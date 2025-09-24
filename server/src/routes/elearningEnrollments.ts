import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired } from '../middleware/authRequired';

const prisma = new PrismaClient();
export const elearningEnrollmentsRouter = Router();

elearningEnrollmentsRouter.get('/', authRequired, async (_req: Request, res: Response) => {
  const items = await prisma.eLearningEnrollment.findMany({ orderBy: { enrolledAt: 'desc' }, include: { user: true, course: true } });
  res.json({ data: items });
});

elearningEnrollmentsRouter.post('/', authRequired, async (req: Request, res: Response) => {
  const { userId, courseId } = req.body || {};
  if (!userId || !courseId) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.eLearningEnrollment.create({ data: { userId, courseId } });
  res.status(201).json({ data: created });
});



