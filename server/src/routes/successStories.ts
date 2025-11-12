import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';

const prisma = new PrismaClient();
export const successStoriesRouter = Router();

// Public list
successStoriesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const items = await prisma.successStory.findMany({ where: { isActive: true }, orderBy: [{ order: 'asc' }, { id: 'desc' }] });
    res.json({ data: items });
  } catch (error: any) {
    // Si la table n'existe pas, retourner un tableau vide
    if (error?.code === 'P2021') {
      return res.json({ data: [] });
    }
    res.status(500).json({ error: error?.message || 'Failed to fetch success stories' });
  }
});

// Admin list
successStoriesRouter.get('/admin', authRequired, adminOnly, async (_req: Request, res: Response) => {
  const items = await prisma.successStory.findMany({ orderBy: [{ order: 'asc' }, { id: 'desc' }] });
  res.json({ data: items });
});

successStoriesRouter.post('/', authRequired, adminOnly, async (req: Request, res: Response) => {
  const { title, description, impact, year, imageUrl, order, isActive } = req.body || {};
  if (!title || !description || !impact) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.successStory.create({ data: { title, description, impact, year, imageUrl, order: order ?? 0, isActive: isActive ?? true } });
  res.status(201).json({ data: created });
});

successStoriesRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { title, description, impact, year, imageUrl, order, isActive } = req.body || {};
  const updated = await prisma.successStory.update({ where: { id }, data: { title, description, impact, year, imageUrl, order, isActive } });
  res.json({ data: updated });
});

successStoriesRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.successStory.delete({ where: { id } });
  res.json({ success: true });
});


