import { Router, Request, Response } from 'express';
import { authRequired, adminOnly } from '../middleware/authRequired';
import { prisma } from '../lib/prisma';

export const partnershipsRouter = Router();

partnershipsRouter.get('/', async (_req: Request, res: Response) => {
  const items = await prisma.partnership.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ data: items });
});

partnershipsRouter.post('/', async (req: Request, res: Response) => {
  // public submission
  const { companyName, contactName, email, phone, country, message } = req.body || {};
  if (!companyName || !contactName || !email || !country) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.partnership.create({ data: { companyName, contactName, email, phone, country, message, status: 'pending' } });
  res.status(201).json({ data: created });
});

partnershipsRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { companyName, contactName, email, phone, country, message, status } = req.body || {};
  const updated = await prisma.partnership.update({ where: { id }, data: { companyName, contactName, email, phone, country, message, status } });
  res.json({ data: updated });
});

partnershipsRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.partnership.delete({ where: { id } });
  res.json({ success: true });
});



