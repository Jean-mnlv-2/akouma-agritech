import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const newsletterSubscriptionsRouter = Router();

newsletterSubscriptionsRouter.get('/', async (_req: Request, res: Response) => {
  const items = await prisma.newsletterSubscription.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ data: items });
});

newsletterSubscriptionsRouter.post('/', async (req: Request, res: Response) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'missing email' });
  const created = await prisma.newsletterSubscription.create({ data: { email, isActive: true } });
  res.status(201).json({ data: created });
});









