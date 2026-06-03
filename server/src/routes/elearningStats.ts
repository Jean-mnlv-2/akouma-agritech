import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';

const prisma = new PrismaClient();
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
    const { label, value, icon } = req.body || {};
    if (!label || !value) {
      return res.status(400).json({ error: 'label and value are required' });
    }
    const created = await prisma.eLearningStat.create({
      data: {
        label: String(label),
        value: String(value),
        ...(icon ? { icon: String(icon) } : {}),
      }
    });
    res.json(created);
  } catch (e) {
    res.status(400).json({ error: 'failed_to_create' });
  }
});

elearningStatsRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { label, value, icon } = req.body || {};
    const data: any = {};
    if (label !== undefined) data.label = String(label);
    if (value !== undefined) data.value = String(value);
    if (icon !== undefined) data.icon = icon ? String(icon) : null;
    const updated = await prisma.eLearningStat.update({ where: { id }, data });
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


