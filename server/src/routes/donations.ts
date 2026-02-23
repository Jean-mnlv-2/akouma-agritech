import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';

const prisma = new PrismaClient();
export const donationsRouter = Router();

function mapDonation(item: any) {
  return {
    id: item.id,
    donorName: item.donorName,
    email: item.email,
    amount: item.amount,
    country: item.country || null,
    message: item.message || null,
    status: item.status,
    created_at: item.createdAt ? item.createdAt.toISOString() : null,
  };
}

donationsRouter.get('/', async (_req: Request, res: Response) => {
  const items = await prisma.donation.findMany({ orderBy: { createdAt: 'desc' } });
  const mapped = items.map(mapDonation);
  res.json({ data: mapped });
});

donationsRouter.post('/', async (req: Request, res: Response) => {
  const { donorName, email, amount, country, message } = req.body || {};
  if (!donorName || !email || amount == null || !country) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.donation.create({
    data: {
      donorName,
      email,
      amount,
      country,
      message: message || null,
      status: 'pending',
    },
  });
  res.status(201).json({ data: mapDonation(created) });
});

donationsRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { donorName, email, amount, country, message, status } = req.body || {};
  const updateData: any = {};
  if (donorName !== undefined) updateData.donorName = donorName;
  if (email !== undefined) updateData.email = email;
  if (amount !== undefined) updateData.amount = amount;
  if (country !== undefined) updateData.country = country;
  if (message !== undefined) updateData.message = message;
  if (status !== undefined) updateData.status = status;
  const updated = await prisma.donation.update({ where: { id }, data: updateData });
  res.json({ data: mapDonation(updated) });
});

donationsRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.donation.delete({ where: { id } });
  res.json({ success: true });
});



