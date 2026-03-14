import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';

const prisma = new PrismaClient();
export const reviewsRouter = Router();

// GET /api/reviews — admin: all reviews with user & seed info
reviewsRouter.get('/', authRequired, adminOnly, async (_req: Request, res: Response) => {
  try {
    const reviews = await (prisma as any).review.findMany({
      include: {
        user: { select: { fullName: true, email: true } },
        seed: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: reviews });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});

// DELETE /api/reviews/:id — admin: delete a review and recalc seed rating
reviewsRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const review = await (prisma as any).review.findUnique({ where: { id } });
    if (!review) return res.status(404).json({ error: 'Not found' });

    await (prisma as any).review.delete({ where: { id } });

    // Recalculate seed rating
    const seedId = review.seedId;
    const remaining = await (prisma as any).review.findMany({ where: { seedId } });
    const totalReviews = remaining.length;
    const avgRating = totalReviews > 0
      ? remaining.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews
      : 0;

    await prisma.seed.update({
      where: { id: seedId },
      data: { rating: avgRating, totalReviews } as any,
    });

    res.json({ success: true });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});
