import { Router, Request, Response } from 'express';
import { authRequired, moduleAccess } from '../middleware/authRequired';
import { prisma } from '../db';
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
successStoriesRouter.get('/admin', authRequired, moduleAccess('donations-content'), async (_req: Request, res: Response) => {
  const items = await prisma.successStory.findMany({ orderBy: [{ order: 'asc' }, { id: 'desc' }] });
  res.json({ data: items });
});

successStoriesRouter.post('/', authRequired, moduleAccess('donations-content'), async (req: Request, res: Response) => {
  const { title, slug, description, impact, year, imageUrl, order, isActive } = req.body || {};
  if (!title || !slug || !description || !impact) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.successStory.create({ data: { title, slug, description, impact, year, imageUrl, order: order ?? 0, isActive: isActive ?? true } as any });
  res.status(201).json({ data: created });
});

successStoriesRouter.put('/:id', authRequired, moduleAccess('donations-content'), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { title, slug, description, impact, year, imageUrl, order, isActive } = req.body || {};
  const updated = await prisma.successStory.update({ where: { id }, data: { title, slug, description, impact, year, imageUrl, order, isActive } as any });
  res.json({ data: updated });
});

successStoriesRouter.delete('/:id', authRequired, moduleAccess('donations-content'), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.successStory.delete({ where: { id } });
  res.json({ success: true });
});


