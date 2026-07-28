import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { authRequired, invalidateAuthCache } from '../middleware/authRequired';
import { csrfRequired } from '../middleware/csrf';
import { createRateLimiter } from '../middleware/rateLimit';
import { audit, actorFromRequest } from '../utils/audit';
import { logger } from '../utils/logger';
import { prisma } from '../db';

export const meRouter = Router();
meRouter.use(authRequired);

/**
 * GET /api/me/export
 * Droit à la portabilité (RGPD art. 20) : export JSON de toutes les données
 * personnelles rattachées au compte de l'utilisateur authentifié.
 */
const exportLimiter = createRateLimiter({ windowMs: 60_000, max: 5 });
meRouter.get('/export', exportLimiter, async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const [
    profile,
    orders,
    enrollments,
    reviews,
    certificates,
    chatThreads,
    subscription,
    invoices,
    subscriptionTransactions,
    courseComments,
    reminderLogs,
    cookieConsents,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, fullName: true, phone: true, avatarUrl: true,
        role: true, isActive: true, createdAt: true, updatedAt: true,
      },
    }),
    prisma.order.findMany({ where: { userId }, include: { items: true, events: true }, orderBy: { createdAt: 'desc' } }),
    prisma.eLearningEnrollment.findMany({ where: { userId }, include: { moduleProgress: true, schedules: true } }),
    prisma.review.findMany({ where: { userId } }),
    prisma.certificate.findMany({ where: { userId } }),
    prisma.chatThread.findMany({ where: { userId }, include: { messages: true }, orderBy: { createdAt: 'desc' } }),
    prisma.subscription.findUnique({ where: { userId } }),
    prisma.invoice.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.subscriptionTransaction.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.courseComment.findMany({ where: { userId } }),
    prisma.reminderLog.findMany({ where: { userId }, orderBy: { sentAt: 'desc' } }),
    prisma.cookieConsent.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
  ]);

  if (!profile) return res.status(404).json({ error: 'not_found' });

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    profile,
    orders,
    elearningEnrollments: enrollments,
    reviews,
    certificates,
    chatThreads,
    subscription,
    invoices,
    subscriptionTransactions,
    courseComments,
    reminderLogs,
    cookieConsents,
  };

  await audit({ ...actorFromRequest(req), action: 'user.self_export', entityType: 'user', entityId: userId }).catch(() => void 0);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="kilimo-mes-donnees-${userId}.json"`);
  res.json(exportPayload);
});

/**
 * DELETE /api/me
 * Droit à l'effacement (RGPD art. 17). Le compte est anonymisé plutôt que
 * supprimé en base : les commandes, factures et certificats doivent être
 * conservés pour des obligations légales/comptables (art. 17§3-b), mais toute
 * donnée directement identifiante est effacée ou remplacée. Le contenu sans
 * finalité de conservation (conversations avec l'assistant, historique de
 * consentement cookies) est supprimé définitivement.
 */
const deleteLimiter = createRateLimiter({ windowMs: 60_000, max: 3 });
meRouter.delete('/', deleteLimiter, csrfRequired, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const actor = actorFromRequest(req);

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'not_found' });

    if (user.role === 'admin') {
      const activeAdmins = await prisma.user.count({ where: { role: 'admin', isActive: true } });
      if (activeAdmins <= 1) {
        return res.status(409).json({
          error: 'last_admin_cannot_self_delete',
          message: 'Impossible de supprimer le dernier compte administrateur actif. Transférez ce rôle avant de continuer.',
        });
      }
    }

    const anonymizedEmail = `deleted-${userId}@deleted.kilimo.local`;
    const randomPasswordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);

    await prisma.$transaction([
      // Contenu sans obligation de conservation : suppression définitive.
      prisma.chatThread.deleteMany({ where: { userId } }), // cascade -> ChatMessage
      prisma.chatDailyBudget.deleteMany({ where: { userId } }),
      prisma.cookieConsent.deleteMany({ where: { userId } }),
      // Compte anonymisé (email/nom/téléphone/mot de passe) mais conservé :
      // commandes, factures, certificats, avis... restent rattachés à cet id
      // pour la traçabilité comptable/légale, sans plus révéler d'identité.
      prisma.user.update({
        where: { id: userId },
        data: {
          email: anonymizedEmail,
          passwordHash: randomPasswordHash,
          fullName: 'Compte supprimé',
          avatarUrl: null,
          phone: null,
          isActive: false,
          resetToken: null,
          resetTokenExpiry: null,
          allowedModules: [],
        },
      }),
    ]);

    invalidateAuthCache(userId);

    res.clearCookie('auth_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/auth' });
    res.clearCookie('csrf_token', { path: '/' });

    await audit({ ...actor, action: 'user.self_delete', entityType: 'user', entityId: userId }).catch(() => void 0);

    res.json({ success: true });
  } catch (e) {
    logger.error('[me] account deletion failed', e instanceof Error ? e.message : String(e));
    res.status(500).json({ error: 'delete_failed' });
  }
});
