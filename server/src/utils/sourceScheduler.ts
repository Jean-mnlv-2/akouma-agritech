import nodeCron from 'node-cron';
import { prisma } from '../db';
import { newsScraper } from '../services/newsScraperService';
import { logger } from './logger';

/**
 * Déclenche automatiquement le scraping des sources (actualités ET
 * événements) aux horaires que l'admin configure par source
 * (`NewsSource.scheduleTimes`, ex: ["08:00","18:00"] = deux fois par jour).
 *
 * Exécuté par le backend KILIMO lui-même plutôt que de dépendre de
 * DeerFlow pour respecter l'horaire : DeerFlow est un agent externe,
 * lancé séparément, jamais garanti actif à l'instant précis programmé.
 * Le backend, lui, tourne en continu — c'est le seul composant capable de
 * garantir "à cette heure précise, N fois par jour" de façon fiable.
 * DeerFlow reste responsable de tout ce que ce moteur déterministe ne
 * couvre pas (sources sans données structurées, curation qualitative).
 *
 * Granularité de 5 minutes (pas à la seconde près) : suffisant pour un
 * planning de type "2-3 fois par jour", et évite de vérifier la base à
 * chaque seconde pour rien.
 */
function currentTimeSlot(): string {
  const now = new Date();
  const roundedMinutes = Math.floor(now.getMinutes() / 5) * 5;
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(roundedMinutes).padStart(2, '0');
  return `${hh}:${mm}`;
}

async function runDueSourcesForSlot(slot: string) {
  const dueSources = await prisma.newsSource.findMany({
    where: { enabled: true, scheduleTimes: { has: slot } },
  });
  if (dueSources.length === 0) return;

  logger.info(`[SourceScheduler] ${dueSources.length} source(s) programmée(s) pour ${slot}`);

  for (const source of dueSources) {
    try {
      const articles = source.type === 'rss'
        ? await newsScraper.scrapeRSS(source)
        : await newsScraper.scrapeWeb(source);

      let saved = 0;
      for (const article of articles.slice(0, 10)) {
        const result = await newsScraper.saveScrapedItem(article, source);
        if (result.saved) saved++;
      }
      logger.info(`[SourceScheduler] ${source.name} (${source.contentType}): ${saved} nouveau(x) élément(s) sur ${articles.length} trouvé(s)`);
    } catch (error) {
      logger.error(`[SourceScheduler] Échec pour la source "${source.name}":`, error);
    }
  }
}

export function initSourceScheduler() {
  nodeCron.schedule('*/5 * * * *', async () => {
    try {
      await runDueSourcesForSlot(currentTimeSlot());
    } catch (error) {
      logger.error('[SourceScheduler] Erreur de vérification des sources programmées:', error);
    }
  });
  logger.info('[SourceScheduler] Planificateur de sources initialisé (vérification toutes les 5 min)');
}
