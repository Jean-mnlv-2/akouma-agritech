import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';

const prisma = new PrismaClient();
export const seedsRouter = Router();

seedsRouter.get('/', async (req: Request, res: Response) => {
  const items = await prisma.seed.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ data: items });
});

seedsRouter.post('/', authRequired, adminOnly, async (req: Request, res: Response) => {
  const { name, description, price, stock } = req.body || {};
  if (!name || !description || price == null) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.seed.create({ data: { name, description, price, stock: stock ?? 0 } });
  res.status(201).json({ data: created });
});

seedsRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, description, price, stock } = req.body || {};
  const updated = await prisma.seed.update({ where: { id }, data: { name, description, price, stock } });
  res.json({ data: updated });
});

seedsRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.seed.delete({ where: { id } });
  res.json({ success: true });
});


