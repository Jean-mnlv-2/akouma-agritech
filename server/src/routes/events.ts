import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';

const prisma = new PrismaClient();
export const eventsRouter = Router();

eventsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const items = await prisma.event.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ data: items });
  } catch (error: any) {
    if (error?.code === 'P2021') {
      return res.json({ data: [] });
    }
    res.status(500).json({ error: error?.message || 'Failed to fetch events' });
  }
});

eventsRouter.get('/slug/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const item = await prisma.event.findUnique({ where: { slug } as any });
    if (!item) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ data: item });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});

eventsRouter.post('/', authRequired, adminOnly, async (req: Request, res: Response) => {
  const { title, slug, description, date, location, imageUrl, isPublished } = req.body || {};
  if (!title || !slug || !date || !location) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.event.create({ data: { title, slug, description, date: new Date(date), location, imageUrl, isPublished: isPublished ?? false } as any });
  res.status(201).json({ data: created });
});

eventsRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { title, slug, description, date, location, imageUrl, isPublished } = req.body || {};
  const updated = await prisma.event.update({ where: { id }, data: { title, slug, description, date: date ? new Date(date) : undefined, location, imageUrl, isPublished } as any });
  res.json({ data: updated });
});

eventsRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.event.delete({ where: { id } });
  res.json({ success: true });
});
