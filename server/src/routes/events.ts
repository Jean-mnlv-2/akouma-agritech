import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

import { authRequired, adminOnly } from '../middleware/authRequired';

export const eventsRouter = Router();

eventsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const items = await prisma.event.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ data: items });
  } catch (error: any) {
    // Si la table n'existe pas, retourner un tableau vide
    if (error?.code === 'P2021') {
      return res.json({ data: [] });
    }
    res.status(500).json({ error: error?.message || 'Failed to fetch events' });
  }
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
