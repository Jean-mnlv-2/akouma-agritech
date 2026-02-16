import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';

const prisma = new PrismaClient();
export const shopProductsRouter = Router();

shopProductsRouter.get('/', async (req: Request, res: Response) => {
  const isActiveParam = req.query.is_active as string | undefined;
  const isActive = typeof isActiveParam === 'string' ? isActiveParam === 'true' : undefined;
  const items = await prisma.shopProduct.findMany({
    where: typeof isActive === 'boolean' ? { isActive } : undefined,
    orderBy: { createdAt: 'desc' },
  });
  res.json({ data: items });
});

shopProductsRouter.post('/', authRequired, adminOnly, async (req: Request, res: Response) => {
  const { name, description, price, stock, category, imageUrl, isActive } = req.body || {};
  if (!name || price == null) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.shopProduct.create({
    data: { name, description, price, stock: stock ?? 0, category, imageUrl, isActive: isActive ?? true },
  });
  res.status(201).json({ data: created });
});

shopProductsRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, description, price, stock, category, imageUrl, isActive } = req.body || {};
  const updated = await prisma.shopProduct.update({
    where: { id },
    data: { name, description, price, stock, category, imageUrl, isActive },
  });
  res.json({ data: updated });
});

shopProductsRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.shopProduct.delete({ where: { id } });
  res.json({ success: true });
});



