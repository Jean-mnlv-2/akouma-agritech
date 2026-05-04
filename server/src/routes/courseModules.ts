import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';

const prisma = new PrismaClient();
export const courseModulesRouter = Router();

const parseDuration = (dur: string | null): number => {
  if (!dur) return 0;
  const match = dur.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

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

    // Validation de la durée totale
    const course = await prisma.course.findUnique({
      where: { id: Number(courseId) },
      select: { duration: true, modules: { select: { duration: true } } }
    });

    if (course && course.duration && course.duration > 0) {
      const currentModulesDuration = course.modules.reduce((sum, m) => sum + parseDuration(m.duration), 0);
      const newModuleDuration = parseDuration(duration);
      if (currentModulesDuration + newModuleDuration > course.duration) {
        return res.status(400).json({
          error: `La durée totale des modules (${currentModulesDuration + newModuleDuration} min) dépasse la durée du cours (${course.duration} min)`
        });
      }
    }

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

    // Validation de la durée totale si la durée est modifiée
    if (duration !== undefined) {
      const moduleToUpdate = await prisma.courseModule.findUnique({
        where: { id },
        select: { courseId: true }
      });

      if (moduleToUpdate) {
        const course = await prisma.course.findUnique({
          where: { id: moduleToUpdate.courseId },
          select: { duration: true, modules: { select: { id: true, duration: true } } }
        });

        if (course && course.duration && course.duration > 0) {
          const otherModulesDuration = course.modules
            .filter(m => m.id !== id)
            .reduce((sum, m) => sum + parseDuration(m.duration), 0);
          
          const newTotalDuration = otherModulesDuration + parseDuration(duration);
          
          if (newTotalDuration > course.duration) {
            return res.status(400).json({
              error: `La durée totale des modules (${newTotalDuration} min) dépasse la durée du cours (${course.duration} min)`
            });
          }
        }
      }
    }

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
    const u = (req as any).user;
    const enrollment = await prisma.eLearningEnrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) return res.status(404).json({ error: 'Not found' });
    if (enrollment.userId !== u.id && u.role !== 'admin' && u.role !== 'supervisor') {
      return res.status(403).json({ error: 'forbidden' });
    }
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
    // Strict ownership check on the enrollment
    const enrollment = await prisma.eLearningEnrollment.findUnique({ where: { id: Number(enrollmentId) } });
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });
    if (enrollment.userId !== user.id) return res.status(403).json({ error: 'forbidden' });
    
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
