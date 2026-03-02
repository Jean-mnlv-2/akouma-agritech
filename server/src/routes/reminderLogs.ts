import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';

const prisma = new PrismaClient();
export const reminderLogsRouter = Router();

// Admin read with basic filters
reminderLogsRouter.get('/', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const { email, status, courseId } = req.query;
    const where: any = {};
    if (email) where.email = String(email);
    if (status) where.status = String(status);
    if (courseId) where.courseId = Number(courseId);
    const items = await prisma.reminderLog.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take: 500,
    });
    res.json({ data: items });
  } catch (e) {
    res.status(500).json({ error: 'failed_to_list' });
  }
});
