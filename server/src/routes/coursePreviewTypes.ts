import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';

const prisma = new PrismaClient();
export const coursePreviewTypesRouter = Router();

// Public read
coursePreviewTypesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const items = await prisma.coursePreviewType.findMany({ orderBy: { name: 'asc' } });
    res.json({ data: items });
  } catch (e) {
    res.status(500).json({ error: 'failed_to_list' });
  }
});

// Admin CRUD
coursePreviewTypesRouter.post('/', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const created = await prisma.coursePreviewType.create({ data: req.body });
    res.json({ data: created });
  } catch (e) {
    res.status(400).json({ error: 'failed_to_create' });
  }
});

coursePreviewTypesRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const updated = await prisma.coursePreviewType.update({ where: { id }, data: req.body });
    res.json({ data: updated });
  } catch (e) {
    res.status(400).json({ error: 'failed_to_update' });
  }
});

coursePreviewTypesRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.coursePreviewType.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: 'failed_to_delete' });
  }
});
