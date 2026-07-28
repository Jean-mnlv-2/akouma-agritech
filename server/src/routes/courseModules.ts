import { Router, Request, Response } from 'express';
import { authRequired, moduleAccess } from '../middleware/authRequired';
import { emailService } from '../utils/email';
import { prisma } from '../db';
export const courseModulesRouter = Router();

const parseDuration = (dur: string | null): number => {
  if (!dur) return 0;
  const match = dur.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

/**
 * Retire les réponses correctes des questions de quiz avant renvoi au client.
 * `quizQuestions` est un JSON libre (Prisma `Json?`) ; on ne connaît sa forme
 * qu'à l'exécution, d'où le traitement défensif plutôt qu'un typage strict.
 */
function stripQuizAnswers(module: Record<string, unknown>): Record<string, unknown> {
  if (!Array.isArray(module.quizQuestions)) return module;
  return {
    ...module,
    quizQuestions: (module.quizQuestions as Array<Record<string, unknown>>).map((q) => {
      const { correctAnswer, ...rest } = q || {};
      return rest;
    }),
  };
}

// Get modules for a course — réservé aux utilisateurs inscrits (ou admin/superviseur).
// Le contenu complet (vidéo, PDF, questions de quiz) ne doit jamais être
// accessible sans inscription réelle : sans ce contrôle, le paywall du cours
// est entièrement contournable via un appel API direct.
courseModulesRouter.get('/course/:courseId', authRequired, async (req: Request, res: Response) => {
  try {
    const courseId = Number(req.params.courseId);
    if (isNaN(courseId)) return res.status(400).json({ error: 'Invalid courseId' });

    const user = (req as any).user;
    const isPrivileged = user.role === 'admin' || user.role === 'supervisor';
    if (!isPrivileged) {
      const enrollment = await prisma.eLearningEnrollment.findUnique({
        where: { userId_courseId: { userId: user.id, courseId } },
      });
      if (!enrollment) return res.status(403).json({ error: 'not_enrolled' });
    }

    const modules = await prisma.courseModule.findMany({
      where: { courseId, isActive: true },
      orderBy: { order: 'asc' },
    });
    const sanitized = isPrivileged ? modules : modules.map((m) => stripQuizAnswers(m as unknown as Record<string, unknown>));
    res.json({ data: sanitized });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch modules' });
  }
});

// Admin: create module
courseModulesRouter.post('/', authRequired, moduleAccess('course-modules'), async (req: Request, res: Response) => {
  try {
    const { courseId, title, type, duration, content, videoUrl, pdfUrl, order, quizQuestions } = req.body;
    if (!courseId || !title) return res.status(400).json({ error: 'courseId and title required' });

    // Validation de la durée totale
    const course = await prisma.course.findUnique({
      where: { id: Number(courseId) },
      select: { duration: true, modules: { select: { duration: true } } }
    });

    if (course && course.duration && course.duration > 0) {
      const currentModulesDuration = course.modules.reduce((sum: number, m: { duration: string | null }) => sum + parseDuration(m.duration), 0);
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
courseModulesRouter.put('/:id', authRequired, moduleAccess('course-modules'), async (req: Request, res: Response) => {
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
            .reduce((sum: number, m: { duration: string | null }) => sum + parseDuration(m.duration), 0);
          
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
courseModulesRouter.delete('/:id', authRequired, moduleAccess('course-modules'), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.courseModule.delete({ where: { id } });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: 'Failed to delete module' });
  }
});

// User: valider la réponse à une question de quiz. Le corrigé n'est renvoyé
// qu'après soumission de CETTE question précise (jamais en bulk à l'avance,
// cf. stripQuizAnswers dans GET /course/:courseId) — évite de faire confiance
// au `correctAnswer` client, qui n'existe plus côté front depuis ce fix.
courseModulesRouter.post('/:id/quiz/check', authRequired, async (req: Request, res: Response) => {
  try {
    const moduleId = Number(req.params.id);
    if (isNaN(moduleId)) return res.status(400).json({ error: 'Invalid id' });
    const { questionId, answer } = req.body || {};
    if (typeof questionId !== 'string' || typeof answer !== 'number') {
      return res.status(400).json({ error: 'questionId and answer required' });
    }

    const user = (req as any).user;
    const module = await prisma.courseModule.findUnique({ where: { id: moduleId } });
    if (!module) return res.status(404).json({ error: 'Not found' });

    const isPrivileged = user.role === 'admin' || user.role === 'supervisor';
    if (!isPrivileged) {
      const enrollment = await prisma.eLearningEnrollment.findUnique({
        where: { userId_courseId: { userId: user.id, courseId: module.courseId } },
      });
      if (!enrollment) return res.status(403).json({ error: 'not_enrolled' });
    }

    const questions = Array.isArray(module.quizQuestions) ? (module.quizQuestions as Array<Record<string, unknown>>) : [];
    const question = questions.find((q) => q?.id === questionId);
    if (!question) return res.status(404).json({ error: 'question_not_found' });

    const correctAnswer = question.correctAnswer as number;
    res.json({
      data: {
        correct: answer === correctAnswer,
        correctAnswer,
        explanation: (question.explanation as string | undefined) ?? null,
      },
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to check answer' });
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
    if (enrollment) {
      const totalModules = await prisma.courseModule.count({ where: { courseId: enrollment.courseId, isActive: true } });
      const completedModules = await prisma.moduleProgress.count({ where: { enrollmentId: Number(enrollmentId), completed: true } });
      const pct = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
      const wasCompleted = !!enrollment.completedAt;
      await prisma.eLearningEnrollment.update({
        where: { id: Number(enrollmentId) },
        data: { 
          progress: pct,
          ...(pct >= 100 ? { completedAt: new Date() } : {}),
        },
      });

      // Notifications email (best-effort, async)
      try {
        const [userRow, courseRow, moduleRow] = await Promise.all([
          prisma.user.findUnique({ where: { id: user.id }, select: { email: true, fullName: true } }),
          prisma.course.findUnique({ where: { id: enrollment.courseId }, select: { title: true } }),
          prisma.courseModule.findUnique({ where: { id: Number(moduleId) }, select: { title: true } }),
        ]);
        if (userRow?.email && courseRow) {
          const userName = userRow.fullName || userRow.email.split('@')[0];
          if (pct >= 100 && !wasCompleted) {
            emailService.sendLearningEvent({ email: userRow.email, userName, courseTitle: courseRow.title, type: 'course-completed' }).catch(() => {});
          } else {
            emailService.sendLearningEvent({ email: userRow.email, userName, courseTitle: courseRow.title, moduleTitle: moduleRow?.title, progress: pct, type: 'module-completed' }).catch(() => {});
          }
        }
      } catch { /* ignore email errors */ }
    }

    res.json({ data: progress });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to update progress' });
  }
});
