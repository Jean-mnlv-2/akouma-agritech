import { Router, Request, Response } from 'express';
import { authRequired, adminOnly } from '../middleware/authRequired';
import { prisma } from '../lib/prisma';

export const careersRouter = Router();

careersRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const items = await prisma.career.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ data: items });
  } catch (error: any) {
    // Si la table n'existe pas, retourner un tableau vide
    if (error?.code === 'P2021') {
      return res.json({ data: [] });
    }
    res.status(500).json({ error: error?.message || 'Failed to fetch careers' });
  }
});

careersRouter.post('/', authRequired, adminOnly, async (req: Request, res: Response) => {
  const { title, description, requirements, location, employmentType, department, salaryRange, isPublished, applicationDeadline } = req.body || {};
  if (!title || !description || !location) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.career.create({ data: { title, description, requirements, location, employmentType, department, salaryRange, isPublished: isPublished ?? false, applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null } });
  res.status(201).json({ data: created });
});

careersRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { title, description, requirements, location, employmentType, department, salaryRange, isPublished, applicationDeadline } = req.body || {};
  const updated = await prisma.career.update({ where: { id }, data: { title, description, requirements, location, employmentType, department, salaryRange, isPublished, applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : undefined } });
  res.json({ data: updated });
});

careersRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.career.delete({ where: { id } });
  res.json({ success: true });
});
