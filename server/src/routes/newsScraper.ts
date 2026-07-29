import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { newsScraper } from '../services/newsScraperService';
import { authRequired, adminOnly } from '../middleware/authRequired';
import { csrfRequired } from '../middleware/csrf';
import { logger } from '../utils/logger';
import { NEWS_SOURCE_CATEGORIES, NEWS_SOURCE_LANGUAGES, NEWS_SOURCE_TYPES, SOURCE_CONTENT_TYPES, SCHEDULE_TIME_PATTERN } from '../config/newsSources';
import { handlePrismaWriteError } from '../utils/prismaErrors';
import { prisma } from '../db';
export const newsScraperRouter = Router();

// Apply auth middleware to all routes
newsScraperRouter.use(authRequired, adminOnly);

// Get scraper status and stats
newsScraperRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const stats = await newsScraper.getSourceStats();
    const sources = await prisma.newsSource.findMany({ orderBy: { name: 'asc' } });
    const recentArticles = await prisma.news.findMany({
      where: { sourceType: 'auto' },
      orderBy: { scrapedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        sourceName: true,
        isPublished: true,
        createdAt: true,
        language: true,
      },
    });

    const unpublishedCount = await prisma.news.count({
      where: { sourceType: 'auto', isPublished: false },
    });

    res.json({
      status: 'ok',
      sources,
      stats,
      recentArticles,
      unpublishedCount,
    });
  } catch (error) {
    logger.error('[NewsScraper] Error getting status:', error);
    res.status(500).json({ error: 'Failed to get scraper status' });
  }
});

// Trigger manual scrape (toutes les sources activées)
newsScraperRouter.post('/scrape', csrfRequired, async (req: Request, res: Response) => {
  try {
    logger.info('[NewsScraper] Manual scrape triggered by admin');
    const result = await newsScraper.scrapeAllSources();
    res.json({
      status: 'success',
      message: 'Scrape completed successfully',
      result,
    });
  } catch (error) {
    logger.error('[NewsScraper] Error during manual scrape:', error);
    res.status(500).json({ error: 'Failed to scrape sources' });
  }
});

// Scrape specific source
newsScraperRouter.post('/scrape/:sourceId', csrfRequired, async (req: Request, res: Response) => {
  try {
    const sourceId = Number(req.params.sourceId);
    if (isNaN(sourceId)) return res.status(400).json({ error: 'Invalid sourceId' });
    const source = await prisma.newsSource.findUnique({ where: { id: sourceId } });

    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }

    logger.info(`[NewsScraper] Manual scrape triggered for source: ${source.name}`);

    const articles = source.type === 'rss'
      ? await newsScraper.scrapeRSS(source)
      : await newsScraper.scrapeWeb(source);

    let savedCount = 0;
    let skippedCount = 0;
    for (const article of articles) {
      const result = await newsScraper.saveScrapedItem(article, source);
      if (result.saved) savedCount++;
      else if (result.skippedReason && result.skippedReason !== 'duplicate') skippedCount++;
    }

    res.json({
      status: 'success',
      message: `Scrape completed for ${source.name}`,
      result: {
        total: articles.length,
        saved: savedCount,
        skipped: skippedCount,
        source: source.name,
      },
    });
  } catch (error) {
    logger.error('[NewsScraper] Error during source scrape:', error);
    res.status(500).json({ error: 'Failed to scrape source' });
  }
});

// ================================
// Gestion des sources (RSS/web) — CRUD admin avec validation stricte pour
// éviter qu'une source mal formée ou une catégorie arbitraire ne soit
// ajoutée sans contrôle ("ne pas partir dans tous les sens") : URL bien
// formée, type/langue/catégorie limités à un enum fermé, URL testée avant
// sauvegarde (voir POST /sources/test).
// ================================

const sourceSchema = z.object({
  name: z.string().trim().min(2).max(200),
  url: z.string().trim().url().max(500),
  type: z.enum(NEWS_SOURCE_TYPES),
  contentType: z.enum(SOURCE_CONTENT_TYPES).optional(),
  language: z.enum(NEWS_SOURCE_LANGUAGES),
  category: z.enum(NEWS_SOURCE_CATEGORIES),
  enabled: z.boolean().optional(),
  // Horaires "HH:MM" auxquels le scheduler déclenche automatiquement cette
  // source — validés strictement pour ne jamais laisser une valeur
  // inexploitable atteindre node-cron (voir sourceScheduler.ts).
  scheduleTimes: z.array(z.string().regex(SCHEDULE_TIME_PATTERN, 'Format attendu : HH:MM')).max(24).optional(),
});

newsScraperRouter.get('/sources', async (_req: Request, res: Response) => {
  try {
    const sources = await prisma.newsSource.findMany({ orderBy: { name: 'asc' } });
    res.json({ data: sources });
  } catch (error) {
    logger.error('[NewsScraper] Error listing sources:', error);
    res.status(500).json({ error: 'Failed to list sources' });
  }
});

// Fetch + parse à blanc, sans sauvegarder — l'admin doit obtenir un test
// réussi (au moins 1 article détecté) avant que la création/modification ne
// soit acceptée côté UI. Ne garantit pas la qualité du contenu, seulement
// que l'URL répond et que le flux/la page est effectivement analysable.
newsScraperRouter.post('/sources/test', csrfRequired, async (req: Request, res: Response) => {
  try {
    const testSchema = z.object({
      url: z.string().trim().url(),
      type: z.enum(NEWS_SOURCE_TYPES),
      contentType: z.enum(SOURCE_CONTENT_TYPES).optional(),
    });
    const parsed = testSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'url et type (rss|web) requis' });

    const result = await newsScraper.testSource(parsed.data.url, parsed.data.type, parsed.data.contentType || 'news');
    res.json({ data: result });
  } catch (error) {
    logger.error('[NewsScraper] Error testing source:', error);
    res.status(500).json({ error: 'Failed to test source' });
  }
});

newsScraperRouter.post('/sources', csrfRequired, async (req: Request, res: Response) => {
  try {
    const parsed = sourceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid payload' });

    const created = await prisma.newsSource.create({ data: parsed.data });
    logger.info(`[NewsScraper] Source created by admin: id=${created.id}, name="${created.name}"`);
    res.status(201).json({ data: created });
  } catch (error) {
    handlePrismaWriteError(error, res);
  }
});

newsScraperRouter.put('/sources/:id', csrfRequired, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const parsed = sourceSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid payload' });

    const updated = await prisma.newsSource.update({ where: { id }, data: parsed.data });
    logger.info(`[NewsScraper] Source updated by admin: id=${id}`);
    res.json({ data: updated });
  } catch (error) {
    handlePrismaWriteError(error, res);
  }
});

newsScraperRouter.delete('/sources/:id', csrfRequired, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    await prisma.newsSource.delete({ where: { id } });
    logger.info(`[NewsScraper] Source deleted by admin: id=${id}`);
    res.json({ success: true });
  } catch (error) {
    handlePrismaWriteError(error, res);
  }
});

// Publish multiple auto-news articles
newsScraperRouter.post('/publish-batch', csrfRequired, async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid ids array' });
    }

    const result = await prisma.news.updateMany({
      where: {
        id: { in: ids.map((id: any) => parseInt(id)) },
        sourceType: 'auto',
      },
      data: {
        isPublished: true,
      },
    });

    res.json({
      status: 'success',
      message: `${result.count} articles published`,
      count: result.count,
    });
  } catch (error) {
    logger.error('[NewsScraper] Error during batch publish:', error);
    res.status(500).json({ error: 'Failed to publish articles' });
  }
});

// Delete multiple auto-news articles
newsScraperRouter.post('/delete-batch', csrfRequired, async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid ids array' });
    }

    const result = await prisma.news.deleteMany({
      where: {
        id: { in: ids.map((id: any) => parseInt(id)) },
        sourceType: 'auto',
      },
    });

    res.json({
      status: 'success',
      message: `${result.count} articles deleted`,
      count: result.count,
    });
  } catch (error) {
    logger.error('[NewsScraper] Error during batch delete:', error);
    res.status(500).json({ error: 'Failed to delete articles' });
  }
});

// Get auto-news articles (with filters)
newsScraperRouter.get('/articles', async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      published,
      sourceName,
      language
    } = req.query;

    const where: any = { sourceType: 'auto' };

    if (published !== undefined) {
      where.isPublished = published === 'true';
    }

    if (sourceName) {
      where.sourceName = sourceName;
    }

    if (language) {
      where.language = language;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [articles, total] = await Promise.all([
      prisma.news.findMany({
        where,
        orderBy: { scrapedAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.news.count({ where }),
    ]);

    res.json({
      articles,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    logger.error('[NewsScraper] Error getting auto articles:', error);
    res.status(500).json({ error: 'Failed to get articles' });
  }
});
