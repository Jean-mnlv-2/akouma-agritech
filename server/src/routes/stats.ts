import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const statsRouter = Router();

// Public stats endpoint used by admin dashboard to avoid auth issues on list endpoints
statsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalCourses,
      totalNews,
      totalSeeds,
      totalProducts,
      totalSubmissions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.news.count(),
      prisma.seed.count(),
      prisma.shopProduct.count(),
      prisma.contentSubmission.count(),
    ]);

    res.json({
      data: {
        totalUsers,
        totalCourses,
        totalNews,
        totalSeeds,
        totalProducts,
        totalSubmissions,
      }
    });
  } catch (e) {
    res.status(500).json({ error: 'failed_to_compute_stats' });
  }
});

