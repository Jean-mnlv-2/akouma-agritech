import { Router, Request, Response } from 'express';
import { authRequired, moduleAccess, optionalAuth } from '../middleware/authRequired';
import { csrfRequired } from '../middleware/csrf';
import { handlePrismaWriteError } from '../utils/prismaErrors';
import { prisma } from '../db';
import { RagSystem } from '../rag';
export const eventsRouter = Router();

// Route unique consommée par la page publique événements et par le
// back-office (qui doit voir les événements non publiés pour les gérer) —
// voir seeds.ts pour le même principe.
eventsRouter.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const isPrivileged = req.user?.role === 'admin' || req.user?.role === 'supervisor';
    const items = await prisma.event.findMany({
      where: isPrivileged ? undefined : ({ isPublished: true } as any),
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: items });
  } catch (error: any) {
    if (error?.code === 'P2021') {
      return res.json({ data: [] });
    }
    res.status(500).json({ error: error?.message || 'Failed to fetch events' });
  }
});

eventsRouter.get('/slug/:slug', optionalAuth, async (req: Request, res: Response) => {
  try {
    const isPrivileged = req.user?.role === 'admin' || req.user?.role === 'supervisor';
    const { slug } = req.params;
    const item = await prisma.event.findUnique({ where: { slug } as any });
    if (!item || (!isPrivileged && !(item as any).isPublished)) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ data: item });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});

eventsRouter.post('/', authRequired, moduleAccess('events'), csrfRequired, async (req: Request, res: Response) => {
  try {
    const { title, slug, description, date, location, imageUrl, isPublished } = req.body || {};
    if (!title || !slug || !date || !location) return res.status(400).json({ error: 'missing fields' });
    const created = await prisma.event.create({ data: { title, slug, description, date: new Date(date), location, imageUrl, isPublished: isPublished ?? false } as any });
    res.status(201).json({ data: created });
  } catch (e) {
    handlePrismaWriteError(e, res);
  }
});

eventsRouter.put('/:id', authRequired, moduleAccess('events'), csrfRequired, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { title, slug, description, date, location, imageUrl, isPublished } = req.body || {};
    const updated = await prisma.event.update({ where: { id }, data: { title, slug, description, date: date ? new Date(date) : undefined, location, imageUrl, isPublished } as any });
    res.json({ data: updated });
  } catch (e) {
    handlePrismaWriteError(e, res);
  }
});

eventsRouter.delete('/:id', authRequired, moduleAccess('events'), csrfRequired, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.event.delete({ where: { id } });
    RagSystem.getInstance(prisma).indexer.deleteSource(`event-${id}`).catch(() => void 0);
    res.json({ success: true });
  } catch (e) {
    handlePrismaWriteError(e, res);
  }
});
