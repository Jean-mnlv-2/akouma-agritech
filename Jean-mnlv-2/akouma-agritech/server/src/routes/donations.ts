import { Router, Request, Response } from 'express';
import { authRequired, adminOnly } from '../middleware/authRequired';
import { prisma } from '../lib/prisma';

export const donationsRouter = Router();

donationsRouter.get('/', async (_req: Request, res: Response) => {
  const items = await prisma.donation.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ data: items });
});

donationsRouter.post('/', async (req: Request, res: Response) => {
  // public submission
  const { donorName, email, amount, country, message } = req.body || {};
  if (!donorName || !email || amount == null || !country) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.donation.create({ data: { donorName, email, amount, country, message, status: 'pending' } });
  res.status(201).json({ data: created });
});

donationsRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { donorName, email, amount, country, message, status } = req.body || {};
  const updated = await prisma.donation.update({ where: { id }, data: { donorName, email, amount, country, message, status } });
  res.json({ data: updated });
});

donationsRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.donation.delete({ where: { id } });
  res.json({ success: true });
});



