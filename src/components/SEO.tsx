import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://kilimo-agritech.lovable.app';
const DEFAULT_IMAGE = `${SITE_URL}/kilimo-logo.png`;
const SITE_NAME = 'KILIMO Agritech';

export type JsonLd = Record<string, unknown> | Record<string, unknown>[];

export interface SEOProps {
  /** 50–60 caractères recommandés. */
  title: string;
  /** 140–155 caractères recommandés. */
  description: string;
  /** Chemin relatif (ex: "/shop") OU URL absolue. */
  path?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  locale?: string;
  /** Données structurées JSON-LD (objet ou tableau d'objets). */
  jsonLd?: JsonLd;
  noindex?: boolean;
}

/**
 * SEO/GEO réutilisable: Title, Description, Canonical, OpenGraph, Twitter,
 * et JSON-LD (Schema.org). À placer en tête de chaque page publique.
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
  const url = path.startsWith('http') ? path : `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const safeTitle = title.length > 60 ? `${title.slice(0, 57)}…` : title;
  const safeDesc = description.length > 160 ? `${description.slice(0, 157)}…` : description;
  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{safeTitle}</title>
      <meta name="description" content={safeDesc} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={safeTitle} />
      <meta property="og:description" content={safeDesc} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content={locale} />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={safeTitle} />
      <meta name="twitter:description" content={safeDesc} />
      <meta name="twitter:image" content={image} />

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