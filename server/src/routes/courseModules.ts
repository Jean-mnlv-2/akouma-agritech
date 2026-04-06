import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';

const prisma = new PrismaClient();
export const courseModulesRouter = Router();

// Get modules for a course (public)
courseModulesRouter.get('/course/:courseId', async (req: Request, res: Response) => {
  try {
    const courseId = Number(req.params.courseId);
    if (isNaN(courseId)) return res.status(400).json({ error: 'Invalid courseId' });
    const modules = await prisma.courseModule.findMany({
      where: { courseId, isActive: true },
      orderBy: { order: 'asc' },
    });
    res.json({ data: modules });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch modules' });
  }
});

// Admin: create module
courseModulesRouter.post('/', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const { courseId, title, type, duration, content, videoUrl, pdfUrl, order, quizQuestions } = req.body;
    if (!courseId || !title) return res.status(400).json({ error: 'courseId and title required' });
    const created = await prisma.courseModule.create({
      data: {
        courseId: Number(courseId),
        title,
        type: type || 'text',
        duration: duration || null,
        content: content || null,
        videoUrl: videoUrl || null,
        pdfUrl: pdfUrl || null,
        order: order ?? 0,
        quizQuestions: quizQuestions || null,
      },
    });
    res.status(201).json({ data: created });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to create module' });
  }
});

// Admin: update module
courseModulesRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { title, type, duration, content, videoUrl, pdfUrl, order, isActive, quizQuestions } = req.body;
    const updated = await prisma.courseModule.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(type !== undefined && { type }),
        ...(duration !== undefined && { duration }),
        ...(content !== undefined && { content }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(pdfUrl !== undefined && { pdfUrl }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(quizQuestions !== undefined && { quizQuestions }),
      },
    });
    res.json({ data: updated });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to update module' });
  }
});

// Admin: delete module
courseModulesRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.courseModule.delete({ where: { id } });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: 'Failed to delete module' });
  }
});

// User: get progress for enrollment
courseModulesRouter.get('/progress/:enrollmentId', authRequired, async (req: Request, res: Response) => {
  try {
    const enrollmentId = Number(req.params.enrollmentId);
    const progress = await prisma.moduleProgress.findMany({
      where: { enrollmentId },
      include: { module: true },
    });
    res.json({ data: progress });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// User: mark module complete
courseModulesRouter.post('/progress', authRequired, async (req: Request, res: Response) => {
  try {
    const { enrollmentId, moduleId, quizScore } = req.body;
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    
    const progress = await prisma.moduleProgress.upsert({
      where: { enrollmentId_moduleId: { enrollmentId: Number(enrollmentId), moduleId: Number(moduleId) } },
      create: {
        enrollmentId: Number(enrollmentId),
        moduleId: Number(moduleId),
        userId: user.id,
        completed: true,
        quizScore: quizScore ?? null,
        completedAt: new Date(),
      },
      update: {
        completed: true,
        quizScore: quizScore ?? undefined,
        completedAt: new Date(),
      },
    });

    // Update enrollment progress percentage
    const enrollment = await prisma.eLearningEnrollment.findUnique({ where: { id: Number(enrollmentId) } });
    if (enrollment) {
      const totalModules = await prisma.courseModule.count({ where: { courseId: enrollment.courseId, isActive: true } });
      const completedModules = await prisma.moduleProgress.count({ where: { enrollmentId: Number(enrollmentId), completed: true } });
      const pct = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
      await prisma.eLearningEnrollment.update({
        where: { id: Number(enrollmentId) },
        data: { 
          progress: pct,
          ...(pct >= 100 ? { completedAt: new Date() } : {}),
        },
      });
    }

    res.json({ data: progress });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to update progress' });
  }
});
