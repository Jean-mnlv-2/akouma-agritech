import { Router, Request, Response } from 'express';
import { authRequired, adminOnly } from '../middleware/authRequired';
import { prisma } from '../lib/prisma';

export const coursesRouter = Router();

coursesRouter.get('/', async (_req: Request, res: Response) => {
  const items = await prisma.course.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ data: items });
});

coursesRouter.post('/', authRequired, adminOnly, async (req: Request, res: Response) => {
  const { title, description, content, price, duration, level, thumbnailUrl, videoUrl, isPublished } = req.body || {};
  if (!title || price == null) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.course.create({
    data: { title, description, content, price, duration, level, thumbnailUrl, videoUrl, isPublished: Boolean(isPublished) },
  });
  res.status(201).json({ data: created });
});

coursesRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { title, description, content, price, duration, level, thumbnailUrl, videoUrl, isPublished } = req.body || {};
  const updated = await prisma.course.update({
    where: { id },
    data: { title, description, content, price, duration, level, thumbnailUrl, videoUrl, isPublished },
  });
  res.json({ data: updated });
});

coursesRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.course.delete({ where: { id } });
  res.json({ success: true });
});



