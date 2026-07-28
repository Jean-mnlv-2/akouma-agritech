import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authRequired, adminOnly } from '../middleware/authRequired';
import { validate } from '../middleware/validate';
import { prisma } from '../db';
export const elearningStatsRouter = Router();

const createStatSchema = z.object({
  label: z.string().min(1).max(120),
  value: z.string().min(1).max(120),
  icon: z.string().max(120).optional(),
}).strict();

const updateStatSchema = z.object({
  label: z.string().min(1).max(120).optional(),
  value: z.string().min(1).max(120).optional(),
  icon: z.string().max(120).nullable().optional(),
}).strict();

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
elearningStatsRouter.post('/', authRequired, adminOnly, validate(createStatSchema), async (req: Request, res: Response) => {
  try {
    const { label, value, icon } = req.body;
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

elearningStatsRouter.put('/:id', authRequired, adminOnly, validate(updateStatSchema), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { label, value, icon } = req.body;
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


