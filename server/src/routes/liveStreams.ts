import { Router, Request, Response } from 'express';
import { authRequired, moduleAccess } from '../middleware/authRequired';
import { env } from '../utils/env';
import { prisma } from '../db';
import { RagSystem } from '../rag';
export const liveStreamsRouter = Router();

// Public list (optionally filter upcoming/published)
liveStreamsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const items = await prisma.liveStream.findMany({ orderBy: { scheduledTime: 'asc' } });
    res.json({ data: items });
  } catch (e) {
    if (env.isDevelopment()) {
      // eslint-disable-next-line no-console
      console.error('Error fetching live streams:', e);
    }
    res.status(500).json({ error: 'failed_to_list' });
  }
});

// Admin CRUD
liveStreamsRouter.post('/', authRequired, moduleAccess('livestreams'), async (req: Request, res: Response) => {
  try {
    if (env.isDevelopment()) {
      // eslint-disable-next-line no-console
      console.log('Creating live stream with data:', req.body);
    }

    const { title, slug } = req.body as { title?: unknown; slug?: unknown };
    if (typeof title !== 'string' || title.trim().length === 0) {
      return res.status(422).json({ error: 'validation_error', details: 'Title is required' });
    }
    if (typeof slug !== 'string' || slug.trim().length === 0) {
      return res.status(422).json({ error: 'validation_error', details: 'Slug is required' });
    }

    // Coercions and validations
    const rawScheduled: unknown = req.body.scheduledTime;
    let scheduledTime: Date | null = null;
    if (typeof rawScheduled === 'string' && rawScheduled.trim().length > 0) {
      const d = new Date(rawScheduled);
      if (!isNaN(d.getTime())) scheduledTime = d; // only accept valid dates
    }

    const toIntOrNull = (v: unknown): number | null => {
      if (v === undefined || v === null || v === '') return null;
      const n = Number(v);
      return Number.isFinite(n) ? Math.trunc(n) : null;
    };

    const durationMinutes = toIntOrNull(req.body.durationMinutes);
    const viewerCount = toIntOrNull(req.body.viewerCount) ?? 0;

    const data = {
      title: title.trim(),
      slug: slug.trim(),
      description: typeof req.body.description === 'string' && req.body.description.trim().length > 0 ? req.body.description.trim() : undefined,
      instructorName: typeof req.body.instructorName === 'string' && req.body.instructorName.trim().length > 0 ? req.body.instructorName.trim() : undefined,
      category: typeof req.body.category === 'string' && req.body.category.trim().length > 0 ? req.body.category.trim() : undefined,
      scheduledTime: scheduledTime ?? undefined,
      durationMinutes: durationMinutes ?? undefined,
      streamUrl: typeof req.body.streamUrl === 'string' && req.body.streamUrl.trim().length > 0 ? req.body.streamUrl.trim() : undefined,
      thumbnailUrl: typeof req.body.thumbnailUrl === 'string' && req.body.thumbnailUrl.trim().length > 0 ? req.body.thumbnailUrl.trim() : undefined,
      isLive: Boolean(req.body.isLive),
      viewerCount,
    } as const;

    const created = await prisma.liveStream.create({ data: data as any });

    res.json({ data: created });
  } catch (e) {
    if (env.isDevelopment()) {
      // eslint-disable-next-line no-console
      console.error('Error creating live stream:', e instanceof Error ? e.message : e);
    }
    res.status(400).json({ error: 'failed_to_create', details: e instanceof Error ? e.message : 'Unknown error' });
  }
});

liveStreamsRouter.put('/:id', authRequired, moduleAccess('livestreams'), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const rawScheduled: unknown = req.body.scheduledTime;
    let scheduledTime: Date | null = null;
    if (typeof rawScheduled === 'string' && rawScheduled.trim().length > 0) {
      const d = new Date(rawScheduled);
      if (!isNaN(d.getTime())) scheduledTime = d;
    }

    const toIntOrNull = (v: unknown): number | null => {
      if (v === undefined || v === null || v === '') return null;
      const n = Number(v);
      return Number.isFinite(n) ? Math.trunc(n) : null;
    };

    const durationMinutes = toIntOrNull(req.body.durationMinutes);
    const viewerCount = toIntOrNull(req.body.viewerCount) ?? 0;

    const data = {
      title: typeof req.body.title === 'string' ? req.body.title.trim() : undefined,
      slug: typeof req.body.slug === 'string' ? req.body.slug.trim() : undefined,
      description: typeof req.body.description === 'string' && req.body.description.trim().length > 0 ? req.body.description.trim() : undefined,
      instructorName: typeof req.body.instructorName === 'string' && req.body.instructorName.trim().length > 0 ? req.body.instructorName.trim() : undefined,
      category: typeof req.body.category === 'string' && req.body.category.trim().length > 0 ? req.body.category.trim() : undefined,
      scheduledTime: scheduledTime ?? undefined,
      durationMinutes: durationMinutes ?? undefined,
      streamUrl: typeof req.body.streamUrl === 'string' && req.body.streamUrl.trim().length > 0 ? req.body.streamUrl.trim() : undefined,
      thumbnailUrl: typeof req.body.thumbnailUrl === 'string' && req.body.thumbnailUrl.trim().length > 0 ? req.body.thumbnailUrl.trim() : undefined,
      isLive: typeof req.body.isLive === 'boolean' ? req.body.isLive : undefined,
      viewerCount,
    } as const;

    const updated = await prisma.liveStream.update({ where: { id }, data: data as any });
    res.json({ data: updated });
  } catch (e) {
    if (env.isDevelopment()) {
      // eslint-disable-next-line no-console
      console.error('Error updating live stream:', e instanceof Error ? e.message : e);
    }
    res.status(400).json({ error: 'failed_to_update', details: e instanceof Error ? e.message : 'Unknown error' });
  }
});

liveStreamsRouter.delete('/:id', authRequired, moduleAccess('livestreams'), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.liveStream.delete({ where: { id } });
    RagSystem.getInstance(prisma).indexer.deleteSource(`liveStream-${id}`).catch(() => void 0);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: 'failed_to_delete', details: e instanceof Error ? e.message : 'Unknown error' });
  }
});


