import { Router, Request, Response } from 'express';
import { authRequired, moduleAccess } from '../middleware/authRequired';
import { csrfRequired } from '../middleware/csrf';
import { prisma } from '../db';
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

shopProductsRouter.get('/slug/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const item = await prisma.shopProduct.findUnique({ where: { slug } as any });
    if (!item) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ data: item });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});

shopProductsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const item = await prisma.shopProduct.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ data: item });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});

shopProductsRouter.post('/', authRequired, moduleAccess('products'), csrfRequired, async (req: Request, res: Response) => {
  const { name, slug, description, price, stock, category, imageUrl, gallery, isActive, isPublished, isFeatured, isNew, isCopyProtected, features, specifications } = req.body || {};
  if (!name || !slug || price == null) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.shopProduct.create({
    data: { 
      name, slug, description, price, stock: stock ?? 0, category, imageUrl, 
      gallery: Array.isArray(gallery) ? gallery : [],
      isActive: isActive ?? true,
      isPublished: Boolean(isPublished),
      isFeatured: Boolean(isFeatured),
      isNew: Boolean(isNew),
      isCopyProtected: Boolean(isCopyProtected),
      features: Array.isArray(features) ? features : [],
      specifications: specifications || {}
    } as any,
  });
  res.status(201).json({ data: created });
});

shopProductsRouter.put('/:id', authRequired, moduleAccess('products'), csrfRequired, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, slug, description, price, stock, category, imageUrl, gallery, isActive, isPublished, isFeatured, isNew, isCopyProtected, features, specifications } = req.body || {};
  const updated = await prisma.shopProduct.update({
    where: { id },
    data: { 
      name, slug, description, price, stock, category, imageUrl, 
      gallery: Array.isArray(gallery) ? gallery : undefined,
      isActive,
      isPublished: isPublished === undefined ? undefined : Boolean(isPublished),
      isFeatured: isFeatured === undefined ? undefined : Boolean(isFeatured),
      isNew: isNew === undefined ? undefined : Boolean(isNew),
      isCopyProtected: isCopyProtected === undefined ? undefined : Boolean(isCopyProtected),
      features: Array.isArray(features) ? features : undefined,
      specifications: specifications || undefined
    } as any,
  });
  res.json({ data: updated });
});

shopProductsRouter.delete('/:id', authRequired, moduleAccess('products'), csrfRequired, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.shopProduct.delete({ where: { id } });
  res.json({ success: true });
});



