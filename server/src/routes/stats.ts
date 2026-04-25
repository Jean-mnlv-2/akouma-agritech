import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
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
      totalOrders,
      totalReviews,
      totalApplications,
      totalEnrollments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.news.count(),
      prisma.seed.count(),
      prisma.shopProduct.count(),
      prisma.contentSubmission.count(),
      prisma.order.count(),
      prisma.review.count(),
      prisma.jobApplication.count(),
      prisma.eLearningEnrollment.count(),
    ]);

    res.json({
      data: {
        totalUsers,
        totalCourses,
        totalNews,
        totalSeeds,
        totalProducts,
        totalSubmissions,
        totalOrders,
        totalReviews,
        totalApplications,
        totalEnrollments,
      }
    });
  } catch (e) {
    res.status(500).json({ error: 'failed_to_compute_stats' });
  }
});

// Time-series stats for charts (last 30 days)
statsRouter.get('/charts', async (req: Request, res: Response) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days as string) || 30, 1), 365);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [orders, reviews, applications] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: since } },
        select: { id: true, total: true, status: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.review.findMany({
        where: { createdAt: { gte: since } },
        select: { id: true, rating: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.jobApplication.findMany({
        where: { createdAt: { gte: since } },
        select: { id: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Group by day
    const dayMap: Record<string, { orders: number; revenue: number; reviews: number; applications: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const key = d.toISOString().slice(0, 10);
      dayMap[key] = { orders: 0, revenue: 0, reviews: 0, applications: 0 };
    }

    for (const o of orders) {
      const key = o.createdAt.toISOString().slice(0, 10);
      if (dayMap[key]) {
        dayMap[key].orders++;
        dayMap[key].revenue += Number(o.total);
      }
    }
    for (const r of reviews) {
      const key = r.createdAt.toISOString().slice(0, 10);
      if (dayMap[key]) dayMap[key].reviews++;
    }
    for (const a of applications) {
      const key = a.createdAt.toISOString().slice(0, 10);
      if (dayMap[key]) dayMap[key].applications++;
    }

    const chartData = Object.entries(dayMap).map(([date, vals]) => ({
      date,
      ...vals,
    }));

    // Revenue by status
    const statusCounts: Record<string, number> = {};
    for (const o of orders) {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    }

    // Average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length
      : 0;

    res.json({
      data: {
        chartData,
        totalRevenue30d: orders.reduce((s: number, o: any) => s + Number(o.total), 0),
        ordersByStatus: statusCounts,
        avgRating: Math.round(avgRating * 10) / 10,
        totalOrders30d: orders.length,
        totalReviews30d: reviews.length,
      }
    });
  } catch (e) {
    res.status(500).json({ error: 'failed_to_compute_chart_stats' });
  }
});

// Notifications endpoint - returns recent unread items
statsRouter.get('/notifications', async (req: Request, res: Response) => {
  try {
    const since = req.query.since ? new Date(req.query.since as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [recentOrders, recentApplications] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: since } },
        select: { id: true, orderNumber: true, total: true, createdAt: true, user: { select: { fullName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.jobApplication.findMany({
        where: { createdAt: { gte: since } },
        select: { id: true, fullName: true, careerTitle: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const notifications = [
      ...recentOrders.map((o: any) => ({
        id: `order-${o.id}`,
        type: 'order' as const,
        title: `Nouvelle commande #${o.orderNumber}`,
        description: `${o.user?.fullName || o.user?.email || 'Client'} — ${Number(o.total).toLocaleString('fr-FR')} FCFA`,
        createdAt: o.createdAt.toISOString(),
      })),
      ...recentApplications.map((a: any) => ({
        id: `application-${a.id}`,
        type: 'application' as const,
        title: `Nouvelle candidature`,
        description: `${a.fullName} — ${a.careerTitle}`,
        createdAt: a.createdAt.toISOString(),
      })),
    ].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20);

    res.json({ data: notifications });
  } catch (e) {
    res.status(500).json({ error: 'failed_to_fetch_notifications' });
  }
});


