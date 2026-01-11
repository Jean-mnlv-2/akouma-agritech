import { Router, Request, Response } from 'express';
import { authRequired, adminOnly } from '../middleware/authRequired';
import { prisma } from '../lib/prisma';

export const tasksRouter = Router();

// Admin: list all tasks
tasksRouter.get('/', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const items = await prisma.task.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: 'failed_to_list' });
  }
});

// Admin: create task
tasksRouter.post('/', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const created = await prisma.task.create({ data: req.body });
    res.json(created);
  } catch (e) {
    res.status(400).json({ error: 'failed_to_create' });
  }
});

// Admin: update task
tasksRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const updated = await prisma.task.update({ where: { id }, data: req.body });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: 'failed_to_update' });
  }
});

// Admin: delete task
tasksRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.task.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: 'failed_to_delete' });
  }
});


