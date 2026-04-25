import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired } from '../middleware/authRequired';

const prisma = new PrismaClient();
export const elearningEnrollmentsRouter = Router();

elearningEnrollmentsRouter.get('/', authRequired, async (_req: Request, res: Response) => {
  const items = await prisma.eLearningEnrollment.findMany({
    orderBy: { enrolledAt: 'desc' },
    include: { user: true, course: true },
  });
  res.json({ data: items });
});

elearningEnrollmentsRouter.post('/', authRequired, async (req: Request, res: Response) => {
  const { courseId, professionalActivity, organization, sector, experienceLevel, expectations } = req.body || {};
  const userId = req.user?.id;

  if (!userId || !courseId) {
    return res.status(400).json({ error: 'Missing userId or courseId' });
  }

  try {
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
    const { studyPace, targetEndDate, remindersEnabled, studyDays, dailyTimeSlot, progress } = req.body || {};
    
    const updated = await prisma.eLearningEnrollment.update({
      where: { id },
      data: {
        ...(studyPace !== undefined && { studyPace }),
        ...(targetEndDate !== undefined && { targetEndDate: targetEndDate ? new Date(targetEndDate) : null }),
        ...(remindersEnabled !== undefined && { remindersEnabled: Boolean(remindersEnabled) }),
        ...(studyDays !== undefined && { studyDays }),
        ...(dailyTimeSlot !== undefined && { dailyTimeSlot }),
        ...(progress !== undefined && { progress: Number(progress) }),
      },
    });
    res.json({ data: updated });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to update enrollment' });
  }
});
