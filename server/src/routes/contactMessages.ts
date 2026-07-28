import { Router, Request, Response } from 'express';
import { authRequired, adminOnly } from '../middleware/authRequired';
import { verifyRecaptcha } from '../middleware/recaptcha';
import { prisma } from '../db';
export const contactMessagesRouter = Router();

contactMessagesRouter.get('/', authRequired, adminOnly, async (_req: Request, res: Response) => {
  const items = await prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ data: items });
});

contactMessagesRouter.post('/', verifyRecaptcha('contact'), async (req: Request, res: Response) => {
  const { name, email, subject, message, country, phone, company, project_type } = req.body || {};
  if (!name || !email || !message) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.contactMessage.create({ 
    data: { 
      name, 
      email, 
      subject, 
      message, 
      country, 
      phone, 
      company, 
      project_type 
    } 
  });
  res.status(201).json({ data: created });
});

contactMessagesRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, email, subject, message, country, phone, company, project_type, status, processedAt } = req.body || {};
  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (subject !== undefined) updateData.subject = subject;
  if (message !== undefined) updateData.message = message;
  if (country !== undefined) updateData.country = country;
  if (phone !== undefined) updateData.phone = phone;
  if (company !== undefined) updateData.company = company;
  if (project_type !== undefined) updateData.project_type = project_type;
  if (status !== undefined) updateData.status = status;
  if (processedAt !== undefined) updateData.processedAt = processedAt ? new Date(processedAt) : null;
  const updated = await prisma.contactMessage.update({ where: { id }, data: updateData });
  res.json({ data: updated });
});

contactMessagesRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.contactMessage.delete({ where: { id } });
  res.json({ success: true });
});



