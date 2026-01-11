import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

import { authRequired, adminOnly } from '../middleware/authRequired';

export const demoRequestsRouter = Router();

demoRequestsRouter.get('/', authRequired, adminOnly, async (_req: Request, res: Response) => {
  const items = await prisma.demoRequest.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ data: items });
});

demoRequestsRouter.post('/', async (req: Request, res: Response) => {
  const { name, email, company, phone, country, message } = req.body || {};
  if (!name || !email || !country) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.demoRequest.create({ data: { name, email, company, phone, country, message, status: 'pending' } });
  res.status(201).json({ data: created });
});

demoRequestsRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, email, company, phone, country, message, status } = req.body || {};
  const updated = await prisma.demoRequest.update({ where: { id }, data: { name, email, company, phone, country, message, status } });
  res.json({ data: updated });
});

demoRequestsRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.demoRequest.delete({ where: { id } });
  res.json({ success: true });
});

