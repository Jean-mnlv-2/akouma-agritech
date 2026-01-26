import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';
import { eventEmitter } from '../services/eventEmitter';

const prisma = new PrismaClient();
export const donationsRouter = Router();

donationsRouter.get('/', async (_req: Request, res: Response) => {
  const items = await prisma.donation.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ data: items });
});

donationsRouter.post('/', async (req: Request, res: Response) => {
  // public submission
  const { donorName, email, amount, country, message } = req.body || {};
  if (!donorName || !email || amount == null || !country) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.donation.create({ data: { donorName, email, amount, country, message, status: 'pending' } });
  res.status(201).json({ data: created });
});

donationsRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { donorName, email, amount, country, message, status } = req.body || {};
  
  // Récupérer l'état précédent pour comparer
  const currentDonation = await prisma.donation.findUnique({ where: { id } });
  
  const updated = await prisma.donation.update({ where: { id }, data: { donorName, email, amount, country, message, status } });
  
  // Événement DONATION_RECEIVED
  if (status === 'processed' && currentDonation?.status !== 'processed') {
    await eventEmitter.emit({
      type: 'DONATION_RECEIVED',
      data: {
        donationId: updated.id,
        amount: Number(updated.amount),
        donorEmail: updated.email,
        donorName: updated.donorName,
        country: updated.country,
      },
    });
  }
  
  res.json({ data: updated });
});

donationsRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.donation.delete({ where: { id } });
  res.json({ success: true });
});



