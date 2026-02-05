import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired } from '../middleware/authRequired';
import { eventEmitter } from '../services/eventEmitter';

const prisma = new PrismaClient();
export const elearningEnrollmentsRouter = Router();

elearningEnrollmentsRouter.get('/', authRequired, async (req: Request, res: Response) => {
  const authUser = (req as any).user || {};
  const userId = authUser.id;
  const userRole = authUser.role;

  const where: any = {};
  if (userRole !== 'admin' && userRole !== 'supervisor') {
    where.userId = userId;
  }

  const items = await prisma.eLearningEnrollment.findMany({
    where,
    orderBy: { enrolledAt: 'desc' },
    include: { user: true, course: true }
  });
  res.json({ data: items });
});

elearningEnrollmentsRouter.post('/', authRequired, async (req: Request, res: Response) => {
  const { userId, courseId } = req.body || {};
  if (!userId || !courseId) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.eLearningEnrollment.create({ data: { userId, courseId } });
  res.status(201).json({ data: created });
});

elearningEnrollmentsRouter.put('/:id/complete', authRequired, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const authUser = (req as any).user || {};
    const userId = authUser.id;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const enrollment = await prisma.eLearningEnrollment.findUnique({
      where: { id },
      include: { user: true, course: true },
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    // Vérifier si l'utilisateur est bien celui inscrit ou un admin
    if (enrollment.userId !== userId && authUser.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (enrollment.completedAt) {
      return res.status(400).json({ error: 'Course already completed' });
    }

    const updated = await prisma.eLearningEnrollment.update({
      where: { id },
      data: {
        completedAt: new Date(),
        progress: 100,
      },
      include: { user: true, course: true },
    });

    // Événement COURSE_COMPLETED
    await eventEmitter.emit({
      type: 'COURSE_COMPLETED',
      data: {
        userId: updated.userId,
        courseId: updated.courseId,
        enrollmentId: updated.id,
        completedAt: updated.completedAt!.toISOString(),
      },
    });

    res.json({ data: updated });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});



