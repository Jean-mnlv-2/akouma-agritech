import { Helmet } from 'react-helmet-async';

// Domaine canonique unique : doit rester cohérent avec index.html (%VITE_SITE_URL%),
// public/robots.txt, public/llms.txt et scripts/generate-sitemap.ts. Un domaine
// divergent entre ces sources casse le SEO (canonical/OG incohérents, sitemap
// invalide). Redéfinir VITE_SITE_URL dans .env lors du passage à un domaine final.
const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://kilimo-agritech.lovable.app';
const DEFAULT_IMAGE = '/kilimo-logo.png';
const SITE_NAME = 'KILIMO Agritech';

export type JsonLd = Record<string, unknown> | Record<string, unknown>[];

export interface SEOProps {
  /** 50–60 caractères recommandés. Le suffixe " | KILIMO Agritech" est ajouté automatiquement. */
  title: string;
  /** 140–155 caractères recommandés. */
  description: string;
  /** Chemin relatif (ex: "/shop") OU URL absolue. */
  path?: string | null;
  image?: string | null;
  type?: 'website' | 'article' | 'product' | 'course' | 'book';
  locale?: string;
  /** Données structurées JSON-LD (objet ou tableau d'objets). */
  jsonLd?: JsonLd;
  noindex?: boolean;
}

/**
 * SEO/GEO réutilisable: Title, Description, Canonical, OpenGraph, Twitter,
 * et JSON-LD (Schema.org). À placer en tête de chaque page publique.
 * Composant unique pour tout le site — voir CLAUDE.md / audit pour l'historique
 * de l'ancien doublon `TitleManager` (retiré, cette API le remplace partout).
 */
export function SEO({
  title,
  description,
  path = '/',
  image = DEFAULT_IMAGE,
  type = 'website',
  locale = 'fr_FR',
  jsonLd,
  noindex = false,
}: SEOProps) {
  // `?? '/'` / `?? DEFAULT_IMAGE`, pas seulement les valeurs par défaut des
  // paramètres : ces dernières ne s'appliquent qu'à `undefined`, jamais à
  // `null` — et un `imageUrl`/`path` venant de l'API est souvent `null`
  // (champ optionnel non renseigné), pas absent.
  const safePath = path ?? '/';
  const safeImage = image ?? DEFAULT_IMAGE;
  const url = safePath.startsWith('http') ? safePath : `${SITE_URL}${safePath.startsWith('/') ? safePath : `/${safePath}`}`;
  const computedTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const safeTitle = computedTitle.length > 60 ? `${computedTitle.slice(0, 57)}…` : computedTitle;
  const safeDesc = description.length > 160 ? `${description.slice(0, 157)}…` : description;
  const absoluteImage = safeImage.startsWith('http') ? safeImage : `${SITE_URL}${safeImage.startsWith('/') ? safeImage : `/${safeImage}`}`;
  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{safeTitle}</title>
      <meta name="description" content={safeDesc} />
      <link rel="canonical" href={url} />
      <meta name="robots" content={noindex ? 'noindex,nofollow' : 'index,follow'} />

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={safeTitle} />
      <meta property="og:description" content={safeDesc} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:locale" content={locale} />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={safeTitle} />
      <meta name="twitter:description" content={safeDesc} />
      <meta name="twitter:image" content={absoluteImage} />

      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  );
}

/** Helpers JSON-LD courants. */
export const schema = {
  organization: () => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: DEFAULT_IMAGE,
    sameAs: [] as string[],
  }),
  website: () => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/shop?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }),
  breadcrumbs: (items: { name: string; path: string }[]) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  }),
  product: (p: { name: string; description?: string; image?: string; price: number; currency?: string; slug: string; availability?: 'InStock' | 'OutOfStock' }) => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description,
    image: p.image,
    offers: {
      '@type': 'Offer',
      price: p.price,
      priceCurrency: p.currency || 'XOF',
      availability: `https://schema.org/${p.availability || 'InStock'}`,
      url: `${SITE_URL}/shop/${p.slug}`,
    },
  }),
  course: (c: { name: string; description?: string; image?: string; slug: string; provider?: string }) => ({
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: c.name,
    description: c.description,
    image: c.image,
    provider: { '@type': 'Organization', name: c.provider || SITE_NAME, sameAs: SITE_URL },
    url: `${SITE_URL}/elearning/${c.slug}`,
  }),
  article: (a: { headline: string; description?: string; image?: string; datePublished: string; dateModified?: string; author?: string; slug: string }) => ({
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: a.headline,
    description: a.description,
    image: a.image,
    datePublished: a.datePublished,
    dateModified: a.dateModified || a.datePublished,
    author: { '@type': 'Organization', name: a.author || SITE_NAME },
    publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: DEFAULT_IMAGE } },
    mainEntityOfPage: `${SITE_URL}/news/${a.slug}`,
  }),
  event: (e: { name: string; description?: string; image?: string; startDate: string; endDate?: string; location?: string; slug: string }) => ({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: e.name,
    description: e.description,
    image: e.image,
    startDate: e.startDate,
    endDate: e.endDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/MixedEventAttendanceMode',
    location: e.location ? { '@type': 'Place', name: e.location } : undefined,
    organizer: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    url: `${SITE_URL}/events/${e.slug}`,
  }),
  faq: (items: { question: string; answer: string }[]) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.question,
      acceptedAnswer: { '@type': 'Answer', text: it.answer },
    })),
  }),
};

export default SEO;