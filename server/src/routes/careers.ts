import { Router, Request, Response } from 'express';
import { authRequired, moduleAccess, optionalAuth } from '../middleware/authRequired';
import { prisma } from '../db';
import { RagSystem } from '../rag';
export const careersRouter = Router();

// Route unique consommée par la page publique carrières et par le back-office
// (qui doit voir les offres non publiées pour les gérer) — voir seeds.ts pour
// le même principe.
careersRouter.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const isPrivileged = req.user?.role === 'admin' || req.user?.role === 'supervisor';
    const items = await prisma.career.findMany({
      where: isPrivileged ? undefined : { isPublished: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: items });
  } catch (error: any) {
    // Si la table n'existe pas, retourner un tableau vide
    if (error?.code === 'P2021') {
      return res.json({ data: [] });
    }
    res.status(500).json({ error: error?.message || 'Failed to fetch careers' });
  }
});

careersRouter.post('/', authRequired, moduleAccess('careers'), async (req: Request, res: Response) => {
  const { title, slug, description, requirements, location, employmentType, department, salaryRange, isPublished, applicationDeadline } = req.body || {};
  if (!title || !slug || !description || !location) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.career.create({ data: { title, slug, description, requirements, location, employmentType, department, salaryRange, isPublished: isPublished ?? false, applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null } as any });
  res.status(201).json({ data: created });
});

careersRouter.put('/:id', authRequired, moduleAccess('careers'), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { title, slug, description, requirements, location, employmentType, department, salaryRange, isPublished, applicationDeadline } = req.body || {};
  const updated = await prisma.career.update({ where: { id }, data: { title, slug, description, requirements, location, employmentType, department, salaryRange, isPublished, applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : undefined } as any });
  res.json({ data: updated });
});

careersRouter.delete('/:id', authRequired, moduleAccess('careers'), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.career.delete({ where: { id } });
  RagSystem.getInstance(prisma).indexer.deleteSource(`career-${id}`).catch(() => void 0);
  res.json({ success: true });
});
