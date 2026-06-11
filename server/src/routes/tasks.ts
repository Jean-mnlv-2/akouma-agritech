import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';

const prisma = new PrismaClient();
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
    const { title, description, assignedTo, createdBy } = req.body || {};
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'title_required' });
    }
    const created = await prisma.task.create({
      data: {
        title: String(title),
        description: description ? String(description) : null,
        assignedTo: assignedTo ? String(assignedTo) : null,
        createdBy: createdBy ? String(createdBy) : null,
      },
    });
    res.json(created);
  } catch (e) {
    res.status(400).json({ error: 'failed_to_create' });
  }
});

// Admin: update task
tasksRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { title, description, assignedTo } = req.body || {};
    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = String(title);
    if (description !== undefined) data.description = description ? String(description) : null;
    if (assignedTo !== undefined) data.assignedTo = assignedTo ? String(assignedTo) : null;
    const updated = await prisma.task.update({ where: { id }, data });
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


