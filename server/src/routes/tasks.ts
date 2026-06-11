import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authRequired, adminOnly } from '../middleware/authRequired';
import { validate } from '../middleware/validate';
import { audit, actorFromRequest } from '../utils/audit';

const prisma = new PrismaClient();
export const tasksRouter = Router();

const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(5000).nullable().optional(),
  assignedTo: z.string().min(1).max(64).nullable().optional(),
  createdBy: z.string().min(1).max(64).nullable().optional(),
}).strict();

const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).nullable().optional(),
  assignedTo: z.string().min(1).max(64).nullable().optional(),
}).strict();

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
tasksRouter.post('/', authRequired, adminOnly, validate(createTaskSchema), async (req: Request, res: Response) => {
  try {
    const { title, description, assignedTo, createdBy } = req.body;
    const created = await prisma.task.create({
      data: {
        title: String(title),
        description: description ? String(description) : null,
        assignedTo: assignedTo ? String(assignedTo) : null,
        createdBy: createdBy ? String(createdBy) : null,
      },
    });
    await audit({ ...actorFromRequest(req), action: 'task.create', entityType: 'task', entityId: created.id, metadata: { title } });
    res.json(created);
  } catch (e) {
    res.status(400).json({ error: 'failed_to_create' });
  }
});

// Admin: update task
tasksRouter.put('/:id', authRequired, adminOnly, validate(updateTaskSchema), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { title, description, assignedTo } = req.body;
    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = String(title);
    if (description !== undefined) data.description = description ? String(description) : null;
    if (assignedTo !== undefined) data.assignedTo = assignedTo ? String(assignedTo) : null;
    const updated = await prisma.task.update({ where: { id }, data });
    await audit({ ...actorFromRequest(req), action: 'task.update', entityType: 'task', entityId: id, metadata: { fields: Object.keys(data) } });
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
    await audit({ ...actorFromRequest(req), action: 'task.delete', entityType: 'task', entityId: id });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: 'failed_to_delete' });
  }
});


