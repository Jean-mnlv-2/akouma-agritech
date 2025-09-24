import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';

const prisma = new PrismaClient();
export const contactMessagesRouter = Router();

contactMessagesRouter.get('/', authRequired, adminOnly, async (_req: Request, res: Response) => {
  const items = await prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ data: items });
});

contactMessagesRouter.post('/', async (req: Request, res: Response) => {
  const { name, email, subject, message, country } = req.body || {};
  if (!name || !email || !message) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.contactMessage.create({ data: { name, email, subject, message, country } });
  res.status(201).json({ data: created });
});

contactMessagesRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, email, subject, message, country } = req.body || {};
  const updated = await prisma.contactMessage.update({ where: { id }, data: { name, email, subject, message, country } });
  res.json({ data: updated });
});

contactMessagesRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.contactMessage.delete({ where: { id } });
  res.json({ success: true });
});



