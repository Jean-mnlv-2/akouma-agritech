import { Router, Request, Response } from 'express';
import { internalApiAuth } from '../middleware/internalApiAuth';
import { newsScraper } from '../services/newsScraperService';
import { logger } from '../utils/logger';
import { prisma } from '../db';
export const internalNewsScraperRouter = Router();

// Réservé à DeerFlow (agent interne). Les routes /api/admin/news-scraper*
// équivalentes exigent une session admin (cookie + CSRF) que DeerFlow n'a
// jamais — sans ce routeur, l'agent ne pouvait physiquement pas déclencher
// le scraper RSS/HTML déterministe et devait tout redécouvrir lui-même via
// navigation web générique (plus lent, plus coûteux en tokens).
internalNewsScraperRouter.use(internalApiAuth);

// Sources actives + santé persistée (dernier statut, erreur, échecs
// consécutifs) — à consulter avant de lancer un scrape pour éviter
// d'insister sur une source manifestement morte. Les sources elles-mêmes
// sont gérées par un admin humain (AdminNews > Sources & Automatisation) ;
// DeerFlow les consulte en lecture seule, il ne peut pas en créer.
internalNewsScraperRouter.get('/status', async (_req: Request, res: Response) => {
  try {
    const sources = await prisma.newsSource.findMany({ orderBy: { name: 'asc' } });
    res.json({ sources });
  } catch (error) {
    logger.error('[internal-news-scraper] Error getting status:', error);
    res.status(500).json({ error: 'Failed to get scraper status' });
  }
});

// Déclenche un scrape de toutes les sources activées (RSS + web), résultat
// détaillé par source. Les brouillons créés sont ensuite disponibles via
// l'API admin habituelle (GET /api/admin/news-scraper/articles) pour
// relecture humaine — ce scrape ne publie jamais rien directement.
internalNewsScraperRouter.post('/run', async (_req: Request, res: Response) => {
  try {
    logger.info('[internal-news-scraper] Scrape triggered by DeerFlow');
    const result = await newsScraper.scrapeAllSources();
    res.json({ status: 'success', result });
  } catch (error) {
    logger.error('[internal-news-scraper] Error during scrape:', error);
    res.status(500).json({ error: 'Failed to scrape sources' });
  }
});

// Déclenche une seule source — utile pour re-tester une source après
// correction, sans relancer tout le lot.
internalNewsScraperRouter.post('/run/:sourceId', async (req: Request, res: Response) => {
  try {
    const sourceId = Number(req.params.sourceId);
    if (isNaN(sourceId)) return res.status(400).json({ error: 'Invalid sourceId' });
    const source = await prisma.newsSource.findUnique({ where: { id: sourceId } });
    if (!source) return res.status(404).json({ error: 'Source not found' });

    const articles = source.type === 'rss'
      ? await newsScraper.scrapeRSS(source)
      : await newsScraper.scrapeWeb(source);

    let saved = 0;
    for (const article of articles) {
      if (await newsScraper.saveArticle(article)) saved++;
    }

    res.json({
      status: 'success',
      result: { source: source.name, total: articles.length, saved },
    });
  } catch (error) {
    logger.error('[internal-news-scraper] Error during source scrape:', error);
    res.status(500).json({ error: 'Failed to scrape source' });
  }
});
