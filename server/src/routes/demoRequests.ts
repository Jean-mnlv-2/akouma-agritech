import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';

const prisma = new PrismaClient();
export const demoRequestsRouter = Router();

function mapDemoRequest(item: any) {
  return {
    id: item.id,
    name: item.name,
    email: item.email,
    company: item.company || null,
    phone: item.phone || null,
    country: item.country || null,
    message: item.message || null,
    status: item.status,
    created_at: item.createdAt ? item.createdAt.toISOString() : null,
  };
}

demoRequestsRouter.get('/', authRequired, adminOnly, async (_req: Request, res: Response) => {
  const items = await prisma.demoRequest.findMany({ orderBy: { createdAt: 'desc' } });
  const mapped = items.map(mapDemoRequest);
  res.json({ data: mapped });
});

demoRequestsRouter.post('/', async (req: Request, res: Response) => {
  const { name, email, company, phone, country, message } = req.body || {};
  if (!name || !email || !country) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.demoRequest.create({
    data: {
      name,
      email,
      company: company || null,
      phone: phone || null,
      country,
      message: message || null,
      status: 'pending',
    },
  });
  res.status(201).json({ data: mapDemoRequest(created) });
});

demoRequestsRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, email, company, phone, country, message, status } = req.body || {};
  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (company !== undefined) updateData.company = company;
  if (phone !== undefined) updateData.phone = phone;
  if (country !== undefined) updateData.country = country;
  if (message !== undefined) updateData.message = message;
  if (status !== undefined) updateData.status = status;
  const updated = await prisma.demoRequest.update({ where: { id }, data: updateData });
  res.json({ data: mapDemoRequest(updated) });
});

demoRequestsRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.demoRequest.delete({ where: { id } });
  res.json({ success: true });
});



