import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';

const prisma = new PrismaClient();
export const elearningEnrollmentsRouter = Router();

elearningEnrollmentsRouter.get('/', authRequired, async (req: Request, res: Response) => {
  const u = (req as any).user;
  const isAdmin = u?.role === 'admin' || u?.role === 'supervisor';
  const items = await prisma.eLearningEnrollment.findMany({
    where: isAdmin ? undefined : { userId: u.id },
    orderBy: { enrolledAt: 'desc' },
    include: {
      course: { include: { modules: { select: { id: true } } } },
      moduleProgress: { where: { completed: true }, select: { moduleId: true, completedAt: true } },
      ...(isAdmin ? { user: true } : {}),
    },
  });
  res.json({ data: items });
});

elearningEnrollmentsRouter.post('/', authRequired, adminOnly, async (req: Request, res: Response) => {
  const { courseId, professionalActivity, organization, sector, experienceLevel, expectations, userId: targetUserId } = req.body || {};
  const u = (req as any).user;
  const userId = targetUserId && (u.role === 'admin' || u.role === 'supervisor') ? targetUserId : u.id;

  if (!userId || !courseId) {
    return res.status(400).json({ error: 'Missing userId or courseId' });
  }

  try {
    const course = await prisma.course.findUnique({ where: { id: Number(courseId) } });
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (Number(course.price) > 0) {
      const validOrder = await prisma.order.findFirst({
        where: {
          userId: String(userId),
          status: { in: ['paid', 'completed'] },
          paymentStatus: 'paid',
          items: {
            some: {
              productType: 'course',
              productId: Number(courseId)
            }
          }
        }
      });

      if (!validOrder) {
        return res.status(403).json({ error: 'Payment required: No valid paid order found for this course' });
      }
    }

    const created = await prisma.eLearningEnrollment.create({
      data: { 
        userId: String(userId), 
        courseId: Number(courseId),
        professionalActivity,
        organization,
        sector,
        experienceLevel,
        expectations
      } as any,
    });
    res.status(201).json({ data: created });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to enroll';
    if (msg.includes('Unique constraint')) {
      return res.status(409).json({ error: 'Already enrolled' });
    }
    res.status(400).json({ error: msg });
  }
});

elearningEnrollmentsRouter.put('/:id', authRequired, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const u = (req as any).user;
    const existing = await prisma.eLearningEnrollment.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.userId !== u.id && u.role !== 'admin' && u.role !== 'supervisor') {
      return res.status(403).json({ error: 'forbidden' });
    }
    const { studyPace, targetEndDate, remindersEnabled, studyDays, dailyTimeSlot, progress } = req.body || {};
    const isAdmin = u.role === 'admin' || u.role === 'supervisor';

    const updated = await prisma.eLearningEnrollment.update({
      where: { id },
      data: {
        ...(studyPace !== undefined && { studyPace }),
        ...(targetEndDate !== undefined && { targetEndDate: targetEndDate ? new Date(targetEndDate) : null }),
        ...(remindersEnabled !== undefined && { remindersEnabled: Boolean(remindersEnabled) }),
        ...(studyDays !== undefined && { studyDays }),
        ...(dailyTimeSlot !== undefined && { dailyTimeSlot }),
        // SÉCURITÉ: la progression ne peut PAS être modifiée par l'utilisateur.
        // Elle est calculée serveur via les ModuleProgress validés.
        ...(isAdmin && progress !== undefined && { progress: Number(progress) }),
      },
    });
    res.json({ data: updated });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to update enrollment' });
  }
});

// Autosave : navigation state (current module, video/pdf position)
elearningEnrollmentsRouter.put('/:id/state', authRequired, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const u = (req as any).user;
    const existing = await prisma.eLearningEnrollment.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.userId !== u.id) return res.status(403).json({ error: 'forbidden' });
    const { currentModuleId, videoPositionSec, pdfPage } = req.body || {};
    const updated = await prisma.eLearningEnrollment.update({
      where: { id },
      data: {
        ...(currentModuleId !== undefined && { currentModuleId: currentModuleId === null ? null : Number(currentModuleId) }),
        ...(videoPositionSec !== undefined && { videoPositionSec: Math.max(0, Math.floor(Number(videoPositionSec) || 0)) }),
        ...(pdfPage !== undefined && { pdfPage: Math.max(1, Math.floor(Number(pdfPage) || 1)) }),
        lastAccessedAt: new Date(),
      },
      select: { id: true, currentModuleId: true, videoPositionSec: true, pdfPage: true, lastAccessedAt: true },
    });
    res.json({ data: updated });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to save state' });
  }
});
