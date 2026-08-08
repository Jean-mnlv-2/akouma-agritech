import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authRequired, moduleAccess } from '../middleware/authRequired';
import { validate } from '../middleware/validate';
import { audit, actorFromRequest } from '../utils/audit';
import { emailService } from '../utils/email';
import { prisma } from '../db';
export const courseSchedulesRouter = Router();

const createScheduleSchema = z.object({
  enrollmentId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]),
  courseId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]),
  scheduledDate: z.string().min(1),
  timeSlot: z.string().min(1).max(50),
}).strict();

// Get user's schedules
courseSchedulesRouter.get('/my', authRequired, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    // ?courseId= / ?enrollmentId= optionnels — évite aux pages qui ne
    // s'intéressent qu'à UN cours (CourseScheduleManager) de récupérer et
    // filtrer côté client la liste complète des créneaux de l'utilisateur.
    const courseIdParam = req.query.courseId ? Number(req.query.courseId) : undefined;
    const enrollmentIdParam = req.query.enrollmentId ? Number(req.query.enrollmentId) : undefined;
    const where: any = { userId: user.id };
    if (courseIdParam !== undefined && !isNaN(courseIdParam)) where.courseId = courseIdParam;
    if (enrollmentIdParam !== undefined && !isNaN(enrollmentIdParam)) where.enrollmentId = enrollmentIdParam;

    const schedules = await prisma.courseSchedule.findMany({
      where,
      include: { course: { select: { id: true, title: true, slug: true } } },
      orderBy: { scheduledDate: 'asc' },
    });
    res.json({ data: schedules });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

// Create schedule (user picks a slot - once locked cannot change)
courseSchedulesRouter.post('/', authRequired, validate(createScheduleSchema), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    
    const { enrollmentId, courseId, scheduledDate, timeSlot } = req.body;

    // SÉCURITÉ: vérifier que l'inscription appartient bien à l'utilisateur (anti-IDOR)
    const enrollment = await prisma.eLearningEnrollment.findUnique({
      where: { id: Number(enrollmentId) },
      select: { id: true, userId: true, courseId: true },
    });
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });
    if (enrollment.userId !== user.id) return res.status(403).json({ error: 'forbidden' });
    if (enrollment.courseId !== Number(courseId)) {
      return res.status(400).json({ error: 'Course does not match enrollment' });
    }

    const schedule = await prisma.courseSchedule.create({
      data: {
        enrollmentId: Number(enrollmentId),
        userId: user.id,
        courseId: Number(courseId),
        scheduledDate: new Date(scheduledDate),
        timeSlot,
        isLocked: true,
        status: 'scheduled',
      },
    });
    await audit({ ...actorFromRequest(req), action: 'schedule.create', entityType: 'schedule', entityId: schedule.id, metadata: { enrollmentId: Number(enrollmentId), courseId: Number(courseId), scheduledDate, timeSlot } });
    res.status(201).json({ data: schedule });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to create schedule' });
  }
});

// Mark attendance (admin or system)
courseSchedulesRouter.put('/:id/attend', authRequired, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const u = (req as any).user;
    const existing = await prisma.courseSchedule.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    // Only the owner or an admin/supervisor may mark attendance
    if (existing.userId !== u.id && u.role !== 'admin' && u.role !== 'supervisor') {
      return res.status(403).json({ error: 'forbidden' });
    }
    const schedule = await prisma.courseSchedule.update({
      where: { id },
      data: { status: 'attended', attendedAt: new Date() },
    });
    await audit({ ...actorFromRequest(req), action: 'schedule.attend', entityType: 'schedule', entityId: id });
    res.json({ data: schedule });
  } catch (e) {
    res.status(400).json({ error: 'Failed to mark attendance' });
  }
});

// Mark absence (admin/system - increments absence count with penalty + email notification)
courseSchedulesRouter.put('/:id/absent', authRequired, moduleAccess('attendance'), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.courseSchedule.findUnique({
      where: { id },
      include: {
        enrollment: true,
        user: { select: { id: true, fullName: true, email: true } },
        course: { select: { id: true, title: true } },
      },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    
    // Mark as absent
    const schedule = await prisma.courseSchedule.update({
      where: { id },
      data: { status: 'absent', absenceCount: existing.absenceCount + 1 },
    });
    await audit({ ...actorFromRequest(req), action: 'schedule.absent', entityType: 'schedule', entityId: id, metadata: { userId: existing.userId, courseId: existing.courseId } });

    // Count total absences for this enrollment
    const totalAbsences = await prisma.courseSchedule.count({
      where: { enrollmentId: existing.enrollmentId, status: 'absent' },
    });

    let penalty = false;

    // Penalty: after 3 absences, reduce progress by 10% per absence over 2
    if (totalAbsences >= 3 && existing.enrollment) {
      const penaltyAmount = Math.min((totalAbsences - 2) * 10, existing.enrollment.progress);
      await prisma.eLearningEnrollment.update({
        where: { id: existing.enrollmentId },
        data: { progress: Math.max(0, existing.enrollment.progress - penaltyAmount) },
      });
      penalty = true;
    }

    // Send email notification when threshold is reached (3+ absences)
    if (totalAbsences >= 3 && existing.user?.email) {
      try {
        await emailService.sendAbsenceNotification({
          email: existing.user.email,
          userName: existing.user.fullName || 'Apprenant',
          courseTitle: existing.course?.title || 'Cours inconnu',
          totalAbsences,
          penaltyApplied: penalty,
          currentProgress: existing.enrollment
            ? Math.max(0, existing.enrollment.progress - (penalty ? (totalAbsences - 2) * 10 : 0))
            : 0,
        });
      } catch (emailErr) {
        console.error('[Schedules] Failed to send absence notification:', emailErr);
      }
    }

    res.json({ data: schedule, totalAbsences, penalty });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to mark absence' });
  }
});

// Admin: get all schedules
courseSchedulesRouter.get('/admin', authRequired, moduleAccess('attendance'), async (_req: Request, res: Response) => {
  try {
    const schedules = await prisma.courseSchedule.findMany({
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        course: { select: { id: true, title: true } },
      },
      orderBy: { scheduledDate: 'desc' },
    });
    res.json({ data: schedules });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});
