import { Router, Request, Response } from 'express';
import { authRequired, moduleAccess } from '../middleware/authRequired';
import { emailService } from '../utils/email';
import { logger } from '../utils/logger';
import { prisma } from '../db';
export const aiSuggestionsRouter = Router();

// Admin/superviseur : liste filtrable des suggestions DeerFlow en attente de revue.
aiSuggestionsRouter.get('/', authRequired, moduleAccess('ai-suggestions'), async (req: Request, res: Response) => {
  try {
    const { type, status } = req.query;
    const where: any = {};
    if (typeof type === 'string') where.type = type;
    if (typeof status === 'string') where.status = status;
    const items = await prisma.aiSuggestion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json({ data: items });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch AI suggestions' });
  }
});

// Admin/superviseur : refuser une suggestion (aucune action, juste archivée).
aiSuggestionsRouter.put('/:id/dismiss', authRequired, moduleAccess('ai-suggestions'), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const admin = (req as any).user;
    const updated = await prisma.aiSuggestion.update({
      where: { id },
      data: { status: 'dismissed', reviewedBy: admin.id, reviewedAt: new Date() },
    });
    res.json({ data: updated });
  } catch (e) {
    res.status(400).json({ error: 'Failed to dismiss suggestion' });
  }
});

// Admin/superviseur : appliquer une suggestion. Le comportement dépend du
// type — c'est le SEUL endroit où l'effet réel se produit (DeerFlow n'a
// jamais accès à cette route, qui exige un JWT admin/superviseur, jamais le
// token interne).
aiSuggestionsRouter.put('/:id/apply', authRequired, moduleAccess('ai-suggestions'), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const admin = (req as any).user;
    const suggestion = await prisma.aiSuggestion.findUnique({ where: { id } });
    if (!suggestion) return res.status(404).json({ error: 'Not found' });
    if (suggestion.status !== 'pending') return res.status(400).json({ error: 'Suggestion already reviewed' });

    const payload = suggestion.payload as Record<string, any>;

    switch (suggestion.type) {
      case 'attendance_outreach': {
        const enrollment = await prisma.eLearningEnrollment.findUnique({
          where: { id: suggestion.targetId },
          include: { user: true, course: { select: { title: true } } },
        });
        if (!enrollment?.user?.email) return res.status(404).json({ error: 'Enrollment or user email not found' });
        await emailService.sendCustomLearnerMessage({
          email: enrollment.user.email,
          userName: enrollment.user.fullName || enrollment.user.email,
          subject: payload.subject || `À propos de votre présence : ${enrollment.course?.title || ''}`,
          message: payload.message || '',
        });
        break;
      }
      case 'quiz_review': {
        if (!Array.isArray(payload.quizQuestions)) {
          return res.status(400).json({ error: 'payload.quizQuestions (array) required to apply a quiz_review suggestion' });
        }
        await prisma.courseModule.update({
          where: { id: suggestion.targetId },
          data: { quizQuestions: payload.quizQuestions },
        });
        break;
      }
      case 'cohort_schedule': {
        if (!payload.cohortStartDate || payload.cohortIntervalDays == null) {
          return res.status(400).json({ error: 'payload.cohortStartDate and payload.cohortIntervalDays required to apply a cohort_schedule suggestion' });
        }
        await prisma.course.update({
          where: { id: suggestion.targetId },
          data: {
            cohortStartDate: new Date(payload.cohortStartDate),
            cohortIntervalDays: Number(payload.cohortIntervalDays),
          },
        });
        break;
      }
      case 'translation': {
        // Volontairement aucun effet automatique : créer un cours traduit
        // complet est une action éditoriale distincte, pas un simple
        // changement de champ — l'admin reprend le texte suggéré (visible
        // dans le payload) et crée le cours via le formulaire habituel.
        // "Appliquer" ici ne fait que marquer la suggestion comme traitée.
        break;
      }
      default:
        return res.status(400).json({ error: `Unknown suggestion type: ${suggestion.type}` });
    }

    const updated = await prisma.aiSuggestion.update({
      where: { id },
      data: { status: 'applied', reviewedBy: admin.id, reviewedAt: new Date() },
    });
    logger.info(`[ai-suggestions] Applied suggestion id=${id}, type=${suggestion.type}`);
    res.json({ data: updated });
  } catch (e) {
    logger.error('[ai-suggestions] Error applying suggestion:', e);
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to apply suggestion' });
  }
});
