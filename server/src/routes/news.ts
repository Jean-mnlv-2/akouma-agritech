import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

import { authRequired, adminOnly } from '../middleware/authRequired';

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

newsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const item = await prisma.news.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ data: item });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
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

