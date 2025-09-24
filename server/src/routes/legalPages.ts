import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';

const prisma = new PrismaClient();
export const legalPagesRouter = Router();

legalPagesRouter.get('/', async (_req: Request, res: Response) => {
  const items = await prisma.legalPage.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ data: items });
});

legalPagesRouter.post('/', authRequired, adminOnly, async (req: Request, res: Response) => {
  const { title, content, slug, isActive } = req.body || {};
  if (!title || !content || !slug) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.legalPage.create({ data: { title, content, slug, isActive: isActive ?? true } });
  res.status(201).json({ data: created });
});

legalPagesRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { title, content, slug, isActive } = req.body || {};
  const updated = await prisma.legalPage.update({ where: { id }, data: { title, content, slug, isActive } });
  res.json({ data: updated });
});

legalPagesRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.legalPage.delete({ where: { id } });
  res.json({ success: true });
});



