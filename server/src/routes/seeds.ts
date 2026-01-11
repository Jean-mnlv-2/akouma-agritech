import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authRequired, adminOnly } from '../middleware/authRequired';
import { validate } from '../middleware/validate';
import { createSeedSchema, updateSeedSchema } from '../schemas/seed.schema';

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

seedsRouter.post('/', authRequired, adminOnly, validate(createSeedSchema), async (req: Request, res: Response) => {
  const { name, description, price, stock, imageUrl } = req.body;
  const created = await prisma.seed.create({ data: { name, description, price, stock, imageUrl } });
  res.status(201).json({ data: created });
});

seedsRouter.put('/:id', authRequired, adminOnly, validate(updateSeedSchema), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const updated = await prisma.seed.update({ where: { id }, data: req.body });
  res.json({ data: updated });
});

seedsRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.seed.delete({ where: { id } });
  res.json({ success: true });
});

