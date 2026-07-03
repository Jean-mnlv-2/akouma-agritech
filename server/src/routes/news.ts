import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
export const newsRouter = Router();

newsRouter.get('/', async (req: Request, res: Response) => {
  const isPublishedParam = req.query.is_published as string | undefined;
  const category = req.query.category as string | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 9;

  const isPublished = typeof isPublishedParam === 'string' ? isPublishedParam === 'true' : undefined;
  
  const where: any = {};
  if (typeof isPublished === 'boolean') where.isPublished = isPublished;
  
  if (category && category !== 'all') {
    where.category = {
      equals: category,
      mode: 'insensitive'
    };
  }

  try {
    const [items, total] = await Promise.all([
      prisma.news.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.news.count({ where })
    ]);

    res.json({ 
      data: items,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (e) {
    logger.error('Error in news GET /', e);
    const error = e instanceof Error ? e.message : 'Internal Server Error';
    res.status(500).json({ error });
  }
});

newsRouter.get('/slug/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const item = await prisma.news.findUnique({ where: { slug } as any });
    if (!item) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ data: item });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
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
  const { title, slug, content, excerpt, imageUrl, author, category, isPublished, isFeatured, isCopyProtected } = req.body || {};
  if (!title || !slug || !content) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.news.create({
    data: { 
      title, slug, content, excerpt, imageUrl, author, category,
      isPublished: Boolean(isPublished),
      isFeatured: Boolean(isFeatured),
      isCopyProtected: Boolean(isCopyProtected),
      sourceType: "manual"
    } as any,
  });
  res.status(201).json({ data: created });
});

newsRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { title, slug, content, excerpt, imageUrl, author, category, isPublished, isFeatured, isCopyProtected } = req.body || {};
  const updated = await prisma.news.update({
    where: { id },
    data: { 
      title, slug, content, excerpt, imageUrl, author, category,
      isPublished: isPublished === undefined ? undefined : Boolean(isPublished),
      isFeatured: isFeatured === undefined ? undefined : Boolean(isFeatured),
      isCopyProtected: isCopyProtected === undefined ? undefined : Boolean(isCopyProtected)
      // Don't change sourceType when editing
    } as any,
  });
  res.json({ data: updated });
});

newsRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.news.delete({ where: { id } });
  res.json({ success: true });
});



