import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';

const prisma = new PrismaClient();
export const seedsRouter = Router();

seedsRouter.get('/', async (req: Request, res: Response) => {
  const items = await prisma.seed.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ data: items });
});

seedsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const item = await prisma.seed.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ data: item });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});

seedsRouter.post('/', authRequired, adminOnly, async (req: Request, res: Response) => {
  const { name, slug, description, price, stock } = req.body || {};
  if (!name || !slug || !description || price == null) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.seed.create({ data: { name, slug, description, price, stock: stock ?? 0 } });
  res.status(201).json({ data: created });
});

seedsRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, slug, description, price, stock } = req.body || {};
  const updated = await prisma.seed.update({ where: { id }, data: { name, slug, description, price, stock } });
  res.json({ data: updated });
});

seedsRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.seed.delete({ where: { id } });
  res.json({ success: true });
});


