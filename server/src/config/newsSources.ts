/**
 * Les sources RSS/scraping ne sont plus codées en dur ici : elles vivent
 * dans le modèle Prisma `NewsSource` (table gérée par l'admin depuis
 * AdminNews > Sources & Automatisation, ou par DeerFlow en lecture via
 * /api/internal/news-scraper/status). Ce fichier ne garde que les enums
 * fermés utilisés pour valider une source à la création/modification —
 * c'est ce qui empêche un admin (ou DeerFlow) d'introduire une catégorie
 * ou un type arbitraire.
 */
export const NEWS_SOURCE_TYPES = ['rss', 'web'] as const;
export type NewsSourceType = (typeof NEWS_SOURCE_TYPES)[number];

export const SOURCE_CONTENT_TYPES = ['news', 'event'] as const;
export type SourceContentType = (typeof SOURCE_CONTENT_TYPES)[number];

/** Format "HH:MM" (00-23:00-59), heure serveur — un horaire par élément. */
export const SCHEDULE_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const NEWS_SOURCE_LANGUAGES = ['fr', 'en'] as const;
export type NewsSourceLanguage = (typeof NEWS_SOURCE_LANGUAGES)[number];

export const NEWS_SOURCE_CATEGORIES = [
  'Local',
  'Régional',
  'Agriculture',
  'Technologie',
  'Innovation',
  'Environnement',
  'Économie',
  'Formation',
] as const;
export type NewsSourceCategory = (typeof NEWS_SOURCE_CATEGORIES)[number];
