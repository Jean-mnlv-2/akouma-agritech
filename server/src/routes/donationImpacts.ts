import { Router, Request, Response } from 'express';
import { authRequired, moduleAccess } from '../middleware/authRequired';
import { prisma } from '../db';
export const donationImpactsRouter = Router();

// Public list
donationImpactsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const items = await prisma.donationImpact.findMany({ where: { isActive: true }, orderBy: [{ order: 'asc' }, { id: 'desc' }] });
    res.json({ data: items });
  } catch (error: any) {
    // Si la table n'existe pas, retourner un tableau vide
    if (error?.code === 'P2021') {
      return res.json({ data: [] });
    }
    res.status(500).json({ error: error?.message || 'Failed to fetch donation impacts' });
  }
});

// Admin list
donationImpactsRouter.get('/admin', authRequired, moduleAccess('donations-content'), async (_req: Request, res: Response) => {
  const items = await prisma.donationImpact.findMany({ orderBy: [{ order: 'asc' }, { id: 'desc' }] });
  res.json({ data: items });
});

donationImpactsRouter.post('/', authRequired, moduleAccess('donations-content'), async (req: Request, res: Response) => {
  const { title, slug, description, icon, progress, target, order, isActive } = req.body || {};
  if (!title || !slug || !description) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.donationImpact.create({ data: { title, slug, description, icon, progress: progress ?? 0, target, order: order ?? 0, isActive: isActive ?? true } as any });
  res.status(201).json({ data: created });
});

donationImpactsRouter.put('/:id', authRequired, moduleAccess('donations-content'), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { title, slug, description, icon, progress, target, order, isActive } = req.body || {};
  const updated = await prisma.donationImpact.update({ where: { id }, data: { title, slug, description, icon, progress, target, order, isActive } as any });
  res.json({ data: updated });
});

donationImpactsRouter.delete('/:id', authRequired, moduleAccess('donations-content'), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.donationImpact.delete({ where: { id } });
  res.json({ success: true });
});


