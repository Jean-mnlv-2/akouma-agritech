import { Router, Request, Response } from 'express';
import { authRequired, moduleAccess, optionalAuth } from '../middleware/authRequired';
import { RagSystem } from '../rag';
import { prisma } from '../db';
export const seedsRouter = Router();

// Route unique consommée à la fois par le catalogue public et par le
// back-office (qui a besoin de voir les brouillons pour les gérer) :
// `optionalAuth` détermine si l'appelant est admin/superviseur sans jamais
// rejeter un visiteur anonyme, seul le filtre `isPublished` en dépend.
seedsRouter.get('/', optionalAuth, async (req: Request, res: Response) => {
  const isPrivileged = req.user?.role === 'admin' || req.user?.role === 'supervisor';
  const items = await prisma.seed.findMany({
    where: isPrivileged ? undefined : { isPublished: true },
    include: { reviews: true },
    orderBy: { createdAt: 'desc' }
  } as any);
  res.json({ data: items });
});

seedsRouter.get('/slug/:slug', optionalAuth, async (req: Request, res: Response) => {
  try {
    const isPrivileged = req.user?.role === 'admin' || req.user?.role === 'supervisor';
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
    if (!item || (!isPrivileged && !(item as any).isPublished)) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ data: item });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});

seedsRouter.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const isPrivileged = req.user?.role === 'admin' || req.user?.role === 'supervisor';
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const item = await prisma.seed.findUnique({ where: { id } });
    if (!item || (!isPrivileged && !item.isPublished)) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ data: item });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});

seedsRouter.post('/', authRequired, moduleAccess('seeds'), async (req: Request, res: Response) => {
  const { 
    name, slug, description, price, stock, category, variety, unit, 
    imageUrl, gallery, availability, harvestTime, yield: yield_info, features, 
    fullDescription, origin, purity, germination, moisture, packaging, 
    soilType, plantingDepth, spacing, watering, fertilizer, diseases,
    plantingInstructions, careInstructions, isPublished, isFeatured, isCopyProtected 
  } = req.body || {};
  
  if (!name || !slug || !description || price == null) return res.status(400).json({ error: 'missing fields' });
  
  try {
    const created = await prisma.seed.create({ 
      data: { 
        name, slug, description, price, stock: stock ?? 0,
        category, variety, unit, imageUrl, gallery: gallery || [], availability,
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

seedsRouter.put('/:id', authRequired, moduleAccess('seeds'), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { 
    name, slug, description, price, stock, category, variety, unit, 
    imageUrl, gallery, availability, harvestTime, yield: yield_info, features, 
    fullDescription, origin, purity, germination, moisture, packaging, 
    soilType, plantingDepth, spacing, watering, fertilizer, diseases,
    plantingInstructions, careInstructions, isPublished, isFeatured, isCopyProtected 
  } = req.body || {};
  
  try {
    const updated = await prisma.seed.update({ 
      where: { id }, 
      data: { 
        name, slug, description, price, stock: stock ?? 0,
        category, variety, unit, imageUrl, gallery: gallery === undefined ? undefined : (gallery || []), availability,
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
  const userId = (req as any).user?.id || (req as any).userId;
  
  if (!userId) {
    return res.status(401).json({ error: 'Utilisateur non authentifié' });
  }

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

seedsRouter.delete('/:id', authRequired, moduleAccess('seeds'), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.seed.delete({ where: { id } });
  // Best-effort : purge la source RAG associée pour que l'assistant ne cite
  // plus jamais une semence supprimée définitivement. La sync périodique
  // n'ajoute/actualise que le contenu publié, elle ne nettoie jamais ce qui
  // a disparu — sans cet appel, la source resterait indexée indéfiniment.
  RagSystem.getInstance(prisma).indexer.deleteSource(`seed-${id}`).catch(() => void 0);
  res.json({ success: true });
});


