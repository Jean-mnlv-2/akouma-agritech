import { Router, Request, Response } from 'express';
import { newsScraper } from '../services/newsScraperService';
import { authRequired, adminOnly } from '../middleware/authRequired';
import { csrfRequired } from '../middleware/csrf';
import { logger } from '../utils/logger';
import { getEnabledSources, NEWS_SOURCES } from '../config/newsSources';
import { prisma } from '../db';
export const newsScraperRouter = Router();

// Apply auth middleware to all routes
newsScraperRouter.use(authRequired, adminOnly);

// Get scraper status and stats
newsScraperRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const stats = await newsScraper.getSourceStats();
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
      sources: NEWS_SOURCES,
      stats,
      recentArticles,
      unpublishedCount,
    });
  } catch (error) {
    logger.error('[NewsScraper] Error getting status:', error);
    res.status(500).json({ error: 'Failed to get scraper status' });
  }
});

// Trigger manual scrape
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
    const { sourceId } = req.params;
    const source = NEWS_SOURCES.find(s => s.id === sourceId);
    
    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }

    logger.info(`[NewsScraper] Manual scrape triggered for source: ${source.name}`);
    
    let articles;
    if (source.type === 'rss') {
      articles = await newsScraper['scrapeRSS'](source);
    } else {
      articles = await newsScraper['scrapeWeb'](source);
    }

    let savedCount = 0;
    for (const article of articles) {
      const saved = await newsScraper.saveArticle(article);
      if (saved) savedCount++;
    }

    res.json({
      status: 'success',
      message: `Scrape completed for ${source.name}`,
      result: {
        total: articles.length,
        saved: savedCount,
        source: source.name,
      },
    });
  } catch (error) {
    logger.error('[NewsScraper] Error during source scrape:', error);
    res.status(500).json({ error: 'Failed to scrape source' });
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
