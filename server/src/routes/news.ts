import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';

const prisma = new PrismaClient();
export const newsRouter = Router();

newsRouter.get('/', async (req: Request, res: Response) => {
  const isPublishedParam = req.query.is_published as string | undefined;
  const isPublished = typeof isPublishedParam === 'string' ? isPublishedParam === 'true' : undefined;
  const items = await prisma.news.findMany({
    where: typeof isPublished === 'boolean' ? { isPublished } : undefined,
    orderBy: { createdAt: 'desc' },
  });
  res.json({ data: items });
});

newsRouter.post('/', authRequired, adminOnly, async (req: Request, res: Response) => {
  const { title, content, excerpt, imageUrl, author, isPublished } = req.body || {};
  if (!title || !content) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.news.create({
    data: { title, content, excerpt, imageUrl, author, isPublished: Boolean(isPublished) },
  });
  res.status(201).json({ data: created });
});

newsRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { title, content, excerpt, imageUrl, author, isPublished } = req.body || {};
  const updated = await prisma.news.update({
    where: { id },
    data: { title, content, excerpt, imageUrl, author, isPublished },
  });
  res.json({ data: updated });
});

newsRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.news.delete({ where: { id } });
  res.json({ success: true });
});



