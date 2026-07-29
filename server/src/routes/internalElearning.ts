import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { internalApiAuth } from '../middleware/internalApiAuth';
import { logger } from '../utils/logger';
import { prisma } from '../db';

export const internalElearningRouter = Router();

// Toutes les routes de ce fichier sont réservées à DeerFlow (agent interne),
// même middleware que internalAutoNews.ts.
internalElearningRouter.use(internalApiAuth);

const ASSISTANT_EMAIL = 'assistant@kilimo.internal';

/**
 * Compte système utilisé pour attribuer les réponses générées par DeerFlow
 * aux commentaires de cours. Créé paresseusement, rôle 'customer' (pas de
 * privilège admin), mot de passe aléatoire jamais communiqué — ce compte ne
 * sert jamais à se connecter.
 */
async function getOrCreateAssistantUser() {
  const existing = await prisma.user.findUnique({ where: { email: ASSISTANT_EMAIL } });
  if (existing) return existing;
  const passwordHash = await bcrypt.hash(crypto.randomUUID(), 12);
  return prisma.user.create({
    data: {
      email: ASSISTANT_EMAIL,
      passwordHash,
      fullName: 'Assistant KILIMO',
      role: 'customer',
      isActive: true,
    },
  });
}

// ================================
// Cours & modules — toujours créés en brouillon (isPublished/isActive
// forcés à false côté serveur), pour relecture humaine avant publication.
// ================================

internalElearningRouter.post('/courses', async (req: Request, res: Response) => {
  try {
    const {
      title, slug, description, content, price, duration, level,
      thumbnailUrl, videoUrl, category, instructorName, instructorBio,
    } = req.body || {};
    if (!title || !slug || price == null) return res.status(400).json({ error: 'missing fields' });

    const created = await prisma.course.create({
      data: {
        title, slug, description, content,
        price: Number(price),
        duration: duration ? Number(duration) : null,
        level, thumbnailUrl, videoUrl,
        category, instructorName, instructorBio,
        isPublished: false, // toujours brouillon, quoi que le payload envoie
        isCopyProtected: false,
      } as any,
    });
    logger.info(`[internal-elearning] Created draft course: id=${created.id}, title="${title}"`);
    res.status(201).json({ data: created });
  } catch (e) {
    logger.error('[internal-elearning] Error creating course:', e);
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to create course' });
  }
});

internalElearningRouter.put('/courses/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const {
      title, slug, description, content, price, duration, level,
      thumbnailUrl, videoUrl, category, instructorName, instructorBio,
    } = req.body || {};

    const updated = await prisma.course.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(content !== undefined && { content }),
        ...(price !== undefined && { price: Number(price) }),
        ...(duration !== undefined && { duration: duration ? Number(duration) : null }),
        ...(level !== undefined && { level }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(category !== undefined && { category }),
        ...(instructorName !== undefined && { instructorName }),
        ...(instructorBio !== undefined && { instructorBio }),
        // isPublished volontairement ignoré : une mise à jour DeerFlow ne
        // republie jamais un cours existant automatiquement.
      } as any,
    });
    logger.info(`[internal-elearning] Updated course draft: id=${id}`);
    res.json({ data: updated });
  } catch (e) {
    logger.error('[internal-elearning] Error updating course:', e);
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to update course' });
  }
});

internalElearningRouter.post('/courses/:courseId/modules', async (req: Request, res: Response) => {
  try {
    const courseId = Number(req.params.courseId);
    if (isNaN(courseId)) return res.status(400).json({ error: 'Invalid courseId' });
    const { title, type, duration, content, videoUrl, pdfUrl, order, quizQuestions } = req.body || {};
    if (!title) return res.status(400).json({ error: 'title required' });

    const created = await prisma.courseModule.create({
      data: {
        courseId,
        title,
        type: type || 'text',
        duration: duration || null,
        content: content || null,
        videoUrl: videoUrl || null,
        pdfUrl: pdfUrl || null,
        order: order ?? 0,
        quizQuestions: quizQuestions || null,
        isActive: false, // brouillon : invisible des apprenants tant qu'un admin ne l'active pas
      },
    });
    logger.info(`[internal-elearning] Created draft module: id=${created.id}, courseId=${courseId}`);
    res.status(201).json({ data: created });
  } catch (e) {
    logger.error('[internal-elearning] Error creating module:', e);
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to create module' });
  }
});

// ================================
// Modération des commentaires de cours
// ================================

internalElearningRouter.get('/comments/pending', async (_req: Request, res: Response) => {
  try {
    const comments = await prisma.courseComment.findMany({
      where: { isApproved: false },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        course: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ data: comments });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch pending comments' });
  }
});

internalElearningRouter.put('/comments/:id/moderate', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { isApproved } = req.body || {};
    if (typeof isApproved !== 'boolean') return res.status(400).json({ error: 'isApproved (boolean) required' });
    const comment = await prisma.courseComment.update({ where: { id }, data: { isApproved } });
    logger.info(`[internal-elearning] Moderated comment: id=${id}, isApproved=${isApproved}`);
    res.json({ data: comment });
  } catch (e) {
    res.status(400).json({ error: 'Failed to moderate comment' });
  }
});

// ================================
// Avis clients (semences) — seule action de modération existante : suppression
// (le modèle Review n'a pas de champ isApproved).
// ================================

internalElearningRouter.get('/reviews', async (req: Request, res: Response) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        seed: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ data: reviews });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

internalElearningRouter.delete('/reviews/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    await prisma.review.delete({ where: { id } });
    logger.info(`[internal-elearning] Deleted review: id=${id}`);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: 'Failed to delete review' });
  }
});

// ================================
// Inscriptions à risque (pour cibler les relances)
// ================================

internalElearningRouter.get('/enrollments/at-risk', async (req: Request, res: Response) => {
  try {
    const maxProgress = req.query.maxProgress ? Number(req.query.maxProgress) : 30;
    const enrollments = await prisma.eLearningEnrollment.findMany({
      where: {
        completedAt: null,
        progress: { lt: maxProgress },
      },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
        course: { select: { id: true, title: true } },
      },
      orderBy: { enrolledAt: 'asc' },
      take: 200,
    });
    res.json({ data: enrollments });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch at-risk enrollments' });
  }
});

// ================================
// Questions des apprenants sans réponse
// ================================

internalElearningRouter.get('/comments/unanswered', async (_req: Request, res: Response) => {
  try {
    const comments = await prisma.courseComment.findMany({
      where: { parentId: null, isApproved: true, replies: { none: {} } },
      include: {
        user: { select: { id: true, fullName: true } },
        course: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
    res.json({ data: comments });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch unanswered comments' });
  }
});

internalElearningRouter.post('/comments/:id/reply', async (req: Request, res: Response) => {
  try {
    const parentId = Number(req.params.id);
    const { content } = req.body || {};
    if (!content?.trim()) return res.status(400).json({ error: 'content required' });

    const parent = await prisma.courseComment.findUnique({ where: { id: parentId } });
    if (!parent) return res.status(404).json({ error: 'Parent comment not found' });

    const assistant = await getOrCreateAssistantUser();
    const reply = await prisma.courseComment.create({
      data: {
        courseId: parent.courseId,
        moduleId: parent.moduleId,
        userId: assistant.id,
        content: content.trim(),
        parentId,
      },
      include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
    });
    logger.info(`[internal-elearning] Posted assistant reply: parentId=${parentId}`);
    res.status(201).json({ data: reply });
  } catch (e) {
    logger.error('[internal-elearning] Error posting reply:', e);
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to post reply' });
  }
});
