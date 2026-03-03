import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';

const prisma = new PrismaClient();
export const coursesRouter = Router();

coursesRouter.get('/', async (_req: Request, res: Response) => {
  const items = await prisma.course.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ data: items });
});

coursesRouter.get('/slug/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const item = await prisma.course.findUnique({ where: { slug } as any });
    if (!item) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ data: item });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});

coursesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const item = await prisma.course.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ data: item });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});

coursesRouter.post('/', authRequired, adminOnly, async (req: Request, res: Response) => {
  const { title, slug, description, content, price, duration, level, thumbnailUrl, videoUrl, isPublished } = req.body || {};
  if (!title || !slug || price == null) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.course.create({
    data: { title, slug, description, content, price, duration, level, thumbnailUrl, videoUrl, isPublished: Boolean(isPublished) } as any,
  });
  res.status(201).json({ data: created });
});

coursesRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { title, slug, description, content, price, duration, level, thumbnailUrl, videoUrl, isPublished } = req.body || {};
  const updated = await prisma.course.update({
    where: { id },
    data: { title, slug, description, content, price, duration, level, thumbnailUrl, videoUrl, isPublished } as any,
  });
  res.json({ data: updated });
});

coursesRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.course.delete({ where: { id } });
  res.json({ success: true });
});



