import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';

const prisma = new PrismaClient();
export const contentSubmissionsRouter = Router();

contentSubmissionsRouter.get('/', authRequired, adminOnly, async (_req: Request, res: Response) => {
  const items = await prisma.contentSubmission.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ data: items });
});

contentSubmissionsRouter.post('/', async (req: Request, res: Response) => {
  const { title, content, author, email } = req.body || {};
  if (!title || !content || !author || !email) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.contentSubmission.create({ data: { title, content, author, email, status: 'pending' } });
  res.status(201).json({ data: created });
});

contentSubmissionsRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { title, content, author, email, status } = req.body || {};
  const updated = await prisma.contentSubmission.update({ where: { id }, data: { title, content, author, email, status } });
  res.json({ data: updated });
});

contentSubmissionsRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.contentSubmission.delete({ where: { id } });
  res.json({ success: true });
});



