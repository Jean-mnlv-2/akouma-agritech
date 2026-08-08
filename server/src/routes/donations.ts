import { Router, Request, Response } from 'express';
import { authRequired, adminOnly } from '../middleware/authRequired';
import { verifyRecaptcha } from '../middleware/recaptcha';
import { prisma } from '../db';
export const donationsRouter = Router();

donationsRouter.get('/', authRequired, adminOnly, async (_req: Request, res: Response) => {
  const items = await prisma.donation.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ data: items });
});

donationsRouter.post('/', verifyRecaptcha('donations'), async (req: Request, res: Response) => {
  // public submission
  const { donorName, email, amount, country, message, donationImpactId } = req.body || {};
  if (!donorName || !email || amount == null || !country) return res.status(400).json({ error: 'missing fields' });

  // Le lien vers un projet est optionnel (don général si absent), mais s'il
  // est fourni il doit pointer vers une cause active — sinon un id arbitraire
  // pourrait être injecté depuis le formulaire public.
  let linkedImpactId: number | undefined;
  if (donationImpactId != null) {
    const impact = await prisma.donationImpact.findFirst({ where: { id: Number(donationImpactId), isActive: true }, select: { id: true } });
    if (!impact) return res.status(400).json({ error: 'invalid donationImpactId' });
    linkedImpactId = impact.id;
  }

  const created = await prisma.donation.create({ data: { donorName, email, amount, country, message, status: 'pending', donationImpactId: linkedImpactId } });
  res.status(201).json({ data: created });
});

donationsRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { donorName, email, amount, country, message, status } = req.body || {};
  const updated = await prisma.donation.update({ where: { id }, data: { donorName, email, amount, country, message, status } });
  res.json({ data: updated });
});

donationsRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.donation.delete({ where: { id } });
  res.json({ success: true });
});



