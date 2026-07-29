import { Router, Request, Response } from 'express';
import { internalApiAuth } from '../middleware/internalApiAuth';
import { logger } from '../utils/logger';
import { slugify } from '../utils/slugify';
import { prisma } from '../db';
export const internalEventsRouter = Router();

// Réservé à DeerFlow (agent interne), même middleware que internalAutoNews.ts
// et internalElearning.ts. Toujours brouillon (isPublished forcé à false
// côté serveur) — un humain doit publier manuellement après relecture.
internalEventsRouter.use(internalApiAuth);

internalEventsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, date, location, imageUrl, slug, sourceName, sourceUrl } = req.body || {};
    if (!title || !date || !location) {
      return res.status(400).json({ error: 'missing fields' });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'invalid date' });
    }

    let finalSlug = slug || slugify(title);
    const baseSlug = finalSlug;
    let counter = 1;
    while (await prisma.event.findUnique({ where: { slug: finalSlug } })) {
      counter++;
      finalSlug = `${baseSlug}-${counter}`;
    }

    const created = await prisma.event.create({
      data: {
        title,
        description: description || null,
        date: parsedDate,
        location,
        imageUrl: imageUrl || null,
        slug: finalSlug,
        isPublished: false,
      } as any,
    });

    logger.info(`[internal-events] Created draft event: id=${created.id}, title="${title}"${sourceName ? `, source="${sourceName}"` : ''}`);
    res.status(201).json({ data: created });
  } catch (e) {
    logger.error('[internal-events] Error creating event:', e);
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to create event' });
  }
});

internalEventsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const events = await prisma.event.findMany({
      where: { isPublished: false } as any,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ data: events });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch draft events' });
  }
});
