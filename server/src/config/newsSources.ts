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
