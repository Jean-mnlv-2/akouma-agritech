import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';

const prisma = new PrismaClient();
export const partnershipsRouter = Router();

function mapPartnership(item: any) {
  return {
    id: item.id,
    companyName: item.companyName,
    contactName: item.contactName,
    email: item.email,
    phone: item.phone || null,
    country: item.country || null,
    message: item.message || null,
    status: item.status,
    created_at: item.createdAt ? item.createdAt.toISOString() : null,
  };
}

partnershipsRouter.get('/', async (_req: Request, res: Response) => {
  const items = await prisma.partnership.findMany({ orderBy: { createdAt: 'desc' } });
  const mapped = items.map(mapPartnership);
  res.json({ data: mapped });
});

partnershipsRouter.post('/', async (req: Request, res: Response) => {
  const { companyName, contactName, email, phone, country, message } = req.body || {};
  if (!companyName || !contactName || !email || !country) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.partnership.create({
    data: {
      companyName,
      contactName,
      email,
      phone: phone || null,
      country,
      message: message || null,
      status: 'pending',
    },
  });
  res.status(201).json({ data: mapPartnership(created) });
});

partnershipsRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { companyName, contactName, email, phone, country, message, status } = req.body || {};
  const updateData: any = {};
  if (companyName !== undefined) updateData.companyName = companyName;
  if (contactName !== undefined) updateData.contactName = contactName;
  if (email !== undefined) updateData.email = email;
  if (phone !== undefined) updateData.phone = phone;
  if (country !== undefined) updateData.country = country;
  if (message !== undefined) updateData.message = message;
  if (status !== undefined) updateData.status = status;
  const updated = await prisma.partnership.update({ where: { id }, data: updateData });
  res.json({ data: mapPartnership(updated) });
});

partnershipsRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.partnership.delete({ where: { id } });
  res.json({ success: true });
});



