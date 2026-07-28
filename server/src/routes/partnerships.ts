import { Router, Request, Response } from 'express';
import { authRequired, adminOnly } from '../middleware/authRequired';
import { verifyRecaptcha } from '../middleware/recaptcha';
import { prisma } from '../db';
export const partnershipsRouter = Router();

// Contient emails/téléphones de leads B2B : ne doit jamais être public.
partnershipsRouter.get('/', authRequired, adminOnly, async (_req: Request, res: Response) => {
  const items = await prisma.partnership.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ data: items });
});

partnershipsRouter.post('/', verifyRecaptcha('partnerships'), async (req: Request, res: Response) => {
  // public submission
  const { companyName, contactName, email, phone, country, message, partnershipType, budget, timeline } = req.body || {};
  if (!companyName || !contactName || !email || !country) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.partnership.create({ data: { companyName, contactName, email, phone, country, message, partnershipType, budget, timeline, status: 'pending' } });
  res.status(201).json({ data: created });
});

partnershipsRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { companyName, contactName, email, phone, country, message, status, partnershipType, budget, timeline } = req.body || {};
  const updated = await prisma.partnership.update({ where: { id }, data: { companyName, contactName, email, phone, country, message, status, partnershipType, budget, timeline } });
  res.json({ data: updated });
});

partnershipsRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.partnership.delete({ where: { id } });
  res.json({ success: true });
});



