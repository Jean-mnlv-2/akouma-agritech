import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authRequired, moduleAccess } from '../middleware/authRequired';
import { validate } from '../middleware/validate';
import { audit, actorFromRequest } from '../utils/audit';
import { prisma } from '../db';
export const elearningEnrollmentsRouter = Router();

const createEnrollmentSchema = z.object({
  courseId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]),
  userId: z.string().min(1).optional(),
  professionalActivity: z.string().max(255).optional().nullable(),
  organization: z.string().max(255).optional().nullable(),
  sector: z.string().max(255).optional().nullable(),
  experienceLevel: z.string().max(50).optional().nullable(),
  expectations: z.string().max(5000).optional().nullable(),
}).strict();

const updateEnrollmentSchema = z.object({
  studyPace: z.string().max(50).optional().nullable(),
  targetEndDate: z.string().datetime().nullable().optional(),
  remindersEnabled: z.boolean().optional(),
  studyDays: z.array(z.string().max(20)).max(7).optional().nullable(),
  dailyTimeSlot: z.string().max(50).optional().nullable(),
  // progress: admin/supervisor uniquement (filtré dans le handler en plus du schéma)
  progress: z.number().int().min(0).max(100).optional(),
}).strict();

const stateSchema = z.object({
  currentModuleId: z.union([z.number().int().positive(), z.null()]).optional(),
  videoPositionSec: z.number().int().min(0).max(60 * 60 * 24).optional(),
  pdfPage: z.number().int().min(1).max(10_000).optional(),
}).strict();

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

elearningEnrollmentsRouter.post('/', authRequired, moduleAccess('elearning-enrollments'), validate(createEnrollmentSchema), async (req: Request, res: Response) => {
  const { courseId, professionalActivity, organization, sector, experienceLevel, expectations, userId: targetUserId } = req.body;
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
    await audit({ ...actorFromRequest(req), action: 'enrollment.create', entityType: 'enrollment', entityId: created.id, metadata: { userId: String(userId), courseId: Number(courseId) } });
    res.status(201).json({ data: created });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to enroll';
    if (msg.includes('Unique constraint')) {
      return res.status(409).json({ error: 'Already enrolled' });
    }
    res.status(400).json({ error: msg });
  }
});

elearningEnrollmentsRouter.put('/:id', authRequired, validate(updateEnrollmentSchema), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const u = (req as any).user;
    const existing = await prisma.eLearningEnrollment.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.userId !== u.id && u.role !== 'admin' && u.role !== 'supervisor') {
      return res.status(403).json({ error: 'forbidden' });
    }
    const { studyPace, targetEndDate, remindersEnabled, studyDays, dailyTimeSlot, progress } = req.body;
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
    await audit({ ...actorFromRequest(req), action: 'enrollment.update', entityType: 'enrollment', entityId: id, metadata: { fields: Object.keys(req.body), progressOverride: isAdmin && progress !== undefined } });
    res.json({ data: updated });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to update enrollment' });
  }
});

// Autosave : navigation state (current module, video/pdf position)
elearningEnrollmentsRouter.put('/:id/state', authRequired, validate(stateSchema), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const u = (req as any).user;
    const existing = await prisma.eLearningEnrollment.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.userId !== u.id) return res.status(403).json({ error: 'forbidden' });
    const { currentModuleId, videoPositionSec, pdfPage } = req.body;
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
