import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';

const prisma = new PrismaClient();
export const seedsRouter = Router();

seedsRouter.get('/', async (req: Request, res: Response) => {
  const items = await prisma.seed.findMany({ 
    include: { reviews: true },
    orderBy: { createdAt: 'desc' } 
  } as any);
  res.json({ data: items });
});

seedsRouter.get('/slug/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const item = await prisma.seed.findUnique({ 
      where: { slug },
      include: {
        reviews: {
          include: {
            user: {
              select: { fullName: true, avatarUrl: true }
            }
          }
        }
      }
    } as any);
    if (!item) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ data: item });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
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
  const { 
    name, slug, description, price, stock, category, variety, unit, 
    imageUrl, availability, harvestTime, yield: yield_info, features, 
    fullDescription, origin, purity, germination, moisture, packaging, 
    soilType, plantingDepth, spacing, watering, fertilizer, diseases,
    plantingInstructions, careInstructions, isPublished, isFeatured, isCopyProtected 
  } = req.body || {};
  
  if (!name || !slug || !description || price == null) return res.status(400).json({ error: 'missing fields' });
  
  try {
    const created = await prisma.seed.create({ 
      data: { 
        name, slug, description, price, stock: stock ?? 0,
        category, variety, unit, imageUrl, availability,
        harvestTime, yield: yield_info, features: features || [],
        fullDescription, origin, purity, germination, moisture, packaging,
        soilType, plantingDepth, spacing, watering, fertilizer, diseases: diseases || [],
        plantingInstructions, careInstructions,
        isPublished: Boolean(isPublished),
        isFeatured: Boolean(isFeatured),
        isCopyProtected: Boolean(isCopyProtected)
      } as any
    });
    res.status(201).json({ data: created });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});

seedsRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { 
    name, slug, description, price, stock, category, variety, unit, 
    imageUrl, availability, harvestTime, yield: yield_info, features, 
    fullDescription, origin, purity, germination, moisture, packaging, 
    soilType, plantingDepth, spacing, watering, fertilizer, diseases,
    plantingInstructions, careInstructions, isPublished, isFeatured, isCopyProtected 
  } = req.body || {};
  
  try {
    const updated = await prisma.seed.update({ 
      where: { id }, 
      data: { 
        name, slug, description, price, stock: stock ?? 0,
        category, variety, unit, imageUrl, availability,
        harvestTime, yield: yield_info, features: features || [],
        fullDescription, origin, purity, germination, moisture, packaging,
        soilType, plantingDepth, spacing, watering, fertilizer, diseases: diseases || [],
        plantingInstructions, careInstructions,
        isPublished: isPublished === undefined ? undefined : Boolean(isPublished),
        isFeatured: isFeatured === undefined ? undefined : Boolean(isFeatured),
        isCopyProtected: isCopyProtected === undefined ? undefined : Boolean(isCopyProtected)
      } as any
    });
    res.json({ data: updated });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});

seedsRouter.post('/:id/reviews', authRequired, async (req: Request, res: Response) => {
  const seedId = Number(req.params.id);
  const userId = (req as any).userId;
  const { rating, comment } = req.body;

  if (rating == null || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    const review = await (prisma as any).review.upsert({
      where: {
        userId_seedId: { userId, seedId }
      },
      update: { rating, comment },
      create: { userId, seedId, rating, comment }
    });

    // Update seed rating and total reviews
    const allReviews = await (prisma as any).review.findMany({ where: { seedId } });
    const totalReviews = allReviews.length;
    const avgRating = allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews;

    await prisma.seed.update({
      where: { id: seedId },
      data: {
        rating: avgRating,
        totalReviews: totalReviews
      } as any
    });

    res.status(201).json({ data: review });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});

seedsRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.seed.delete({ where: { id } });
  res.json({ success: true });
});


