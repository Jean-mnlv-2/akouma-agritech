import { Router, Request, Response } from 'express';
import { authRequired, moduleAccess } from '../middleware/authRequired';
import { prisma } from '../db';
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
coursePreviewTypesRouter.post('/', authRequired, moduleAccess('course-previews'), async (req: Request, res: Response) => {
  try {
    const created = await prisma.coursePreviewType.create({ data: req.body });
    res.json({ data: created });
  } catch (e) {
    res.status(400).json({ error: 'failed_to_create' });
  }
});

coursePreviewTypesRouter.put('/:id', authRequired, moduleAccess('course-previews'), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const updated = await prisma.coursePreviewType.update({ where: { id }, data: req.body });
    res.json({ data: updated });
  } catch (e) {
    res.status(400).json({ error: 'failed_to_update' });
  }
});

coursePreviewTypesRouter.delete('/:id', authRequired, moduleAccess('course-previews'), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.coursePreviewType.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: 'failed_to_delete' });
  }
});
