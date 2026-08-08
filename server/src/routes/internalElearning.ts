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
        createdVia: 'deerflow',
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
        createdVia: 'deerflow',
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
// Demandes de rattrapage — DeerFlow ne peut que PROPOSER une résolution
// (suggestedResolution/suggestedByAi) ; il n'a aucun moyen d'accorder ou de
// refuser une demande lui-même. Seul un admin, via PUT /api/rattrapage_requests/:id
// (route JWT, hors de ce routeur interne), peut changer le statut — la
// décision finale (équité/intégrité du certificat) reste toujours humaine.
// ================================

internalElearningRouter.get('/rattrapage-requests/pending', async (_req: Request, res: Response) => {
  try {
    const requests = await prisma.rattrapageRequest.findMany({
      where: { status: 'pending' },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        module: { select: { id: true, title: true, type: true, content: true } },
        enrollment: { include: { course: { select: { id: true, title: true } } } },
      },
      orderBy: { requestedAt: 'asc' },
      take: 100,
    });
    res.json({ data: requests });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch pending rattrapage requests' });
  }
});

internalElearningRouter.put('/rattrapage-requests/:id/suggest', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const { suggestedResolution } = req.body || {};
    if (!suggestedResolution?.trim()) return res.status(400).json({ error: 'suggestedResolution required' });

    const existing = await prisma.rattrapageRequest.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending requests can receive a suggestion' });
    }

    const updated = await prisma.rattrapageRequest.update({
      where: { id },
      data: { suggestedResolution: suggestedResolution.trim(), suggestedByAi: true },
      // status volontairement inchangé : ceci reste une suggestion, jamais
      // une décision — voir AdminRattrapageRequests.tsx pour la revue humaine.
    });
    logger.info(`[internal-elearning] Suggested rattrapage resolution: id=${id}`);
    res.json({ data: updated });
  } catch (e) {
    logger.error('[internal-elearning] Error suggesting rattrapage resolution:', e);
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to suggest resolution' });
  }
});

// ================================
// Contexte pour les suggestions génériques (présences, quiz, cohorte,
// traduction) + soumission — voir AiSuggestion / server/src/routes/aiSuggestions.ts
// pour la revue/application humaine. DeerFlow ne peut QUE créer une
// suggestion "pending" ici ; il n'a aucun moyen de l'appliquer lui-même.
// ================================

internalElearningRouter.get('/attendance/at-risk', async (_req: Request, res: Response) => {
  try {
    const groups = await prisma.courseSchedule.groupBy({
      by: ['enrollmentId'],
      where: { status: 'absent' },
      _count: { _all: true },
    });
    // Exactement 2 absences : à un cran de la pénalité (seuil = 3), pas
    // encore pénalisé — c'est la fenêtre utile pour une relance préventive.
    const atRiskEnrollmentIds = groups.filter((g) => g._count._all === 2).map((g) => g.enrollmentId);
    if (atRiskEnrollmentIds.length === 0) return res.json({ data: [] });

    const alreadySuggested = await prisma.aiSuggestion.findMany({
      where: { type: 'attendance_outreach', targetType: 'enrollment', targetId: { in: atRiskEnrollmentIds }, status: 'pending' },
      select: { targetId: true },
    });
    const excluded = new Set(alreadySuggested.map((s) => s.targetId));

    const enrollments = await prisma.eLearningEnrollment.findMany({
      where: { id: { in: atRiskEnrollmentIds.filter((id) => !excluded.has(id)) } },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        course: { select: { id: true, title: true } },
      },
    });
    res.json({ data: enrollments });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch at-risk attendance enrollments' });
  }
});

internalElearningRouter.get('/modules/quiz-modules', async (_req: Request, res: Response) => {
  try {
    const modules = await prisma.courseModule.findMany({
      where: { isActive: true, type: { in: ['quiz', 'synthesis_exam'] } },
      include: { course: { select: { id: true, title: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
    res.json({ data: modules });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch quiz modules' });
  }
});

internalElearningRouter.get('/courses/needs-schedule', async (_req: Request, res: Response) => {
  try {
    const courses = await prisma.course.findMany({
      where: { isPublished: true, cohortStartDate: null },
      include: { modules: { where: { isActive: true }, select: { id: true, duration: true } } },
      take: 100,
    });
    res.json({ data: courses });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch courses needing a schedule' });
  }
});

internalElearningRouter.get('/courses/translation-candidates', async (_req: Request, res: Response) => {
  try {
    const courses = await prisma.course.findMany({
      where: { isPublished: true, languages: { equals: ['Français'] } },
      select: { id: true, title: true, description: true, content: true, languages: true },
      take: 50,
    });
    res.json({ data: courses });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch translation candidates' });
  }
});

internalElearningRouter.post('/suggestions', async (req: Request, res: Response) => {
  try {
    const { type, targetType, targetId, title, payload } = req.body || {};
    const allowedTypes = ['attendance_outreach', 'quiz_review', 'cohort_schedule', 'translation'];
    if (!allowedTypes.includes(type)) return res.status(400).json({ error: `type must be one of ${allowedTypes.join(', ')}` });
    if (!targetType || targetId == null || !title?.trim() || payload == null) {
      return res.status(400).json({ error: 'targetType, targetId, title and payload are required' });
    }
    const created = await prisma.aiSuggestion.create({
      data: { type, targetType, targetId: Number(targetId), title: title.trim(), payload },
    });
    logger.info(`[internal-elearning] Created AI suggestion: type=${type}, targetType=${targetType}, targetId=${targetId}`);
    res.status(201).json({ data: created });
  } catch (e) {
    logger.error('[internal-elearning] Error creating AI suggestion:', e);
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to create suggestion' });
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
