// Génère public/sitemap.xml dynamiquement à partir de l'API publique KILIMO.
// Exécuté via les hooks npm `predev` et `prebuild`.
// Si l'API n'est pas joignable au moment du build, on retombe sur les routes statiques
// uniquement (le sitemap reste valide).

import { writeFileSync } from 'fs';
import { resolve } from 'path';

const BASE_URL = process.env.SITE_URL || 'https://akouma-agritech.lovable.app';
const API_URL = process.env.API_PUBLIC_URL || process.env.VITE_API_URL || '';

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/elearning', changefreq: 'weekly', priority: '0.9' },
  { path: '/seeds', changefreq: 'weekly', priority: '0.9' },
  { path: '/shop', changefreq: 'weekly', priority: '0.9' },
  { path: '/news', changefreq: 'daily', priority: '0.8' },
  { path: '/about', changefreq: 'monthly', priority: '0.7' },
  { path: '/contact', changefreq: 'monthly', priority: '0.7' },
  { path: '/partners', changefreq: 'monthly', priority: '0.6' },
  { path: '/careers', changefreq: 'weekly', priority: '0.6' },
  { path: '/donations', changefreq: 'monthly', priority: '0.5' },
  { path: '/legal', changefreq: 'yearly', priority: '0.3' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
  { path: '/reset-password', changefreq: 'monthly', priority: '0.3' },
  { path: '/verify-account', changefreq: 'monthly', priority: '0.3' },
  { path: '/500', changefreq: 'yearly', priority: '0.1' },
  { path: '/investors', changefreq: 'monthly', priority: '0.5' },
  { path: '/demo', changefreq: 'monthly', priority: '0.5' },
];

async function safeFetch<T>(url: string): Promise<T[]> {
  if (!API_URL) return [];
  try {
    const res = await fetch(`${API_URL}${url}`, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const body = await res.json();
    return Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
  } catch {
    console.warn(`[sitemap] Skipped ${url} (API unreachable)`);
    return [];
  }
}

function toEntry(prefix: string, slugOrId: string | number, lastmod?: string, priority = '0.7'): SitemapEntry {
  return { path: `${prefix}/${slugOrId}`, lastmod, changefreq: 'weekly', priority };
}

async function dynamicEntries(): Promise<SitemapEntry[]> {
  const [courses, seeds, products, news, events] = await Promise.all([
    safeFetch<{ slug?: string; id?: number; updatedAt?: string; isPublished?: boolean }>('/api/courses'),
    safeFetch<{ slug?: string; id?: number; updatedAt?: string; isPublished?: boolean }>('/api/seeds'),
    safeFetch<{ slug?: string; id?: number; updatedAt?: string; isActive?: boolean }>('/api/shop_products'),
    safeFetch<{ slug?: string; id?: number; updatedAt?: string; isPublished?: boolean }>('/api/news'),
    safeFetch<{ slug?: string; id?: number; updatedAt?: string; isPublished?: boolean }>('/api/events'),
  ]);

  const out: SitemapEntry[] = [];
  for (const c of courses) if (c.isPublished !== false && (c.slug || c.id)) out.push(toEntry('/elearning', c.slug || c.id!, c.updatedAt, '0.8'));
  for (const s of seeds) if (s.isPublished !== false && (s.slug || s.id)) out.push(toEntry('/seeds', s.slug || s.id!, s.updatedAt, '0.7'));
  for (const p of products) if (p.isActive !== false && (p.slug || p.id)) out.push(toEntry('/shop', p.slug || p.id!, p.updatedAt, '0.7'));
  for (const n of news) if (n.isPublished !== false && (n.slug || n.id)) out.push(toEntry('/news', n.slug || n.id!, n.updatedAt, '0.7'));
  for (const e of events) if (e.isPublished !== false && (e.slug || e.id)) out.push(toEntry('/events', e.slug || e.id!, e.updatedAt, '0.6'));
  return out;
}

function buildXml(entries: SitemapEntry[]): string {
  const urls = entries.map((e) =>
    [
      '  <url>',
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${new Date(e.lastmod).toISOString()}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      '  </url>',
    ]
      .filter(Boolean)
      .join('\n'),
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
  ].join('\n');
}

(async () => {
  const dynamic = await dynamicEntries();
  const all = [...staticEntries, ...dynamic];
  writeFileSync(resolve('public/sitemap.xml'), buildXml(all));
  console.log(`[sitemap] sitemap.xml written (${all.length} entries, ${dynamic.length} dynamic)`);
})();