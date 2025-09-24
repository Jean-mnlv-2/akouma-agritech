import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';

const prisma = new PrismaClient();
export const donationImpactsRouter = Router();

// Public list
donationImpactsRouter.get('/', async (_req: Request, res: Response) => {
  const items = await prisma.donationImpact.findMany({ where: { isActive: true }, orderBy: [{ order: 'asc' }, { id: 'desc' }] });
  res.json({ data: items });
});

// Admin list
donationImpactsRouter.get('/admin', authRequired, adminOnly, async (_req: Request, res: Response) => {
  const items = await prisma.donationImpact.findMany({ orderBy: [{ order: 'asc' }, { id: 'desc' }] });
  res.json({ data: items });
});

donationImpactsRouter.post('/', authRequired, adminOnly, async (req: Request, res: Response) => {
  const { title, description, icon, progress, target, order, isActive } = req.body || {};
  if (!title || !description) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.donationImpact.create({ data: { title, description, icon, progress: progress ?? 0, target, order: order ?? 0, isActive: isActive ?? true } });
  res.status(201).json({ data: created });
});

donationImpactsRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { title, description, icon, progress, target, order, isActive } = req.body || {};
  const updated = await prisma.donationImpact.update({ where: { id }, data: { title, description, icon, progress, target, order, isActive } });
  res.json({ data: updated });
});

donationImpactsRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.donationImpact.delete({ where: { id } });
  res.json({ success: true });
});


