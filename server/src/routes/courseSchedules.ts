import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';

const prisma = new PrismaClient();
export const courseSchedulesRouter = Router();

// Get user's schedules
courseSchedulesRouter.get('/my', authRequired, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    
    const schedules = await prisma.courseSchedule.findMany({
      where: { userId: user.id },
      include: { course: { select: { id: true, title: true, slug: true } } },
      orderBy: { scheduledDate: 'asc' },
    });
    res.json({ data: schedules });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

// Create schedule (user picks a slot - once locked cannot change)
courseSchedulesRouter.post('/', authRequired, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    
    const { enrollmentId, courseId, scheduledDate, timeSlot } = req.body;
    if (!enrollmentId || !courseId || !scheduledDate || !timeSlot) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const schedule = await prisma.courseSchedule.create({
      data: {
        enrollmentId: Number(enrollmentId),
        userId: user.id,
        courseId: Number(courseId),
        scheduledDate: new Date(scheduledDate),
        timeSlot,
        isLocked: true, // Lock immediately after creation
        status: 'scheduled',
      },
    });
    res.status(201).json({ data: schedule });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to create schedule' });
  }
});

// Mark attendance (admin or system)
courseSchedulesRouter.put('/:id/attend', authRequired, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const schedule = await prisma.courseSchedule.update({
      where: { id },
      data: { status: 'attended', attendedAt: new Date() },
    });
    res.json({ data: schedule });
  } catch (e) {
    res.status(400).json({ error: 'Failed to mark attendance' });
  }
});

// Mark absence (admin/system - increments absence count with penalty)
courseSchedulesRouter.put('/:id/absent', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.courseSchedule.findUnique({ where: { id }, include: { enrollment: true } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    
    // Mark as absent
    const schedule = await prisma.courseSchedule.update({
      where: { id },
      data: { status: 'absent', absenceCount: existing.absenceCount + 1 },
    });

    // Count total absences for this enrollment
    const totalAbsences = await prisma.courseSchedule.count({
      where: { enrollmentId: existing.enrollmentId, status: 'absent' },
    });

    // Penalty: after 3 absences, block progression (reduce progress by 10% per absence over 3)
    if (totalAbsences >= 3 && existing.enrollment) {
      const penalty = Math.min((totalAbsences - 2) * 10, existing.enrollment.progress);
      await prisma.eLearningEnrollment.update({
        where: { id: existing.enrollmentId },
        data: { progress: Math.max(0, existing.enrollment.progress - penalty) },
      });
    }

    res.json({ data: schedule, totalAbsences, penalty: totalAbsences >= 3 });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to mark absence' });
  }
});

// Admin: get all schedules
courseSchedulesRouter.get('/admin', authRequired, adminOnly, async (_req: Request, res: Response) => {
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
