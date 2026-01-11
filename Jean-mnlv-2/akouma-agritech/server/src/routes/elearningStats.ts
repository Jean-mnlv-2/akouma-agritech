import { Router, Request, Response } from 'express';
import { authRequired, adminOnly } from '../middleware/authRequired';
import { prisma } from '../lib/prisma';

export const elearningStatsRouter = Router();

// Public read
elearningStatsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const items = await prisma.eLearningStat.findMany({ orderBy: { createdAt: 'asc' } });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: 'failed_to_list' });
  }
});

// Admin CRUD
elearningStatsRouter.post('/', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const created = await prisma.eLearningStat.create({ data: req.body });
    res.json(created);
  } catch (e) {
    res.status(400).json({ error: 'failed_to_create' });
  }
});

elearningStatsRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const updated = await prisma.eLearningStat.update({ where: { id }, data: req.body });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: 'failed_to_update' });
  }
});

elearningStatsRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.eLearningStat.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: 'failed_to_delete' });
  }
});


