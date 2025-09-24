import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';

const prisma = new PrismaClient();
export const eventsRouter = Router();

eventsRouter.get('/', async (_req: Request, res: Response) => {
  const items = await prisma.event.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ data: items });
});

eventsRouter.post('/', authRequired, adminOnly, async (req: Request, res: Response) => {
  const { title, description, date, location, imageUrl, isPublished } = req.body || {};
  if (!title || !date || !location) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.event.create({ data: { title, description, date: new Date(date), location, imageUrl, isPublished: isPublished ?? false } });
  res.status(201).json({ data: created });
});

eventsRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { title, description, date, location, imageUrl, isPublished } = req.body || {};
  const updated = await prisma.event.update({ where: { id }, data: { title, description, date: date ? new Date(date) : undefined, location, imageUrl, isPublished } });
  res.json({ data: updated });
});

eventsRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.event.delete({ where: { id } });
  res.json({ success: true });
});
