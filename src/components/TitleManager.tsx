import { useEffect } from 'react';

type OpenGraphType = 'website' | 'article' | 'product' | 'course' | 'book';

type TitleManagerProps = {
  title?: string;
  description?: string;
  image?: string;
  canonical?: string;
  noIndex?: boolean;
  ogType?: OpenGraphType;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

function upsertMeta(attrs: Record<string, string>, content: string | null) {
  const selector = Object.entries(attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join('');
  let el = document.head.querySelector(`meta[${selector}]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
    document.head.appendChild(el);
  }
  if (content != null) el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function toAbsoluteUrl(urlOrPath: string): string {
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    return urlOrPath;
  }
  return `${window.location.origin}${urlOrPath.startsWith('/') ? '' : '/'}${urlOrPath}`;
}

function upsertJsonLd(data: Record<string, unknown> | Record<string, unknown>[] | null) {
  // Supprime tous les blocs JSON-LD existants gérés par TitleManager
  document.head
    .querySelectorAll('script[data-tm-jsonld="1"]')
    .forEach((el) => el.remove());
  // Compatibilité ascendante: ancien id="json-ld"
  const legacy = document.getElementById('json-ld');
  if (legacy) legacy.remove();
  if (!data) return;
  const items = Array.isArray(data) ? data : [data];
  items.forEach((item, i) => {
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.setAttribute('data-tm-jsonld', '1');
    el.setAttribute('data-tm-jsonld-index', String(i));
    el.textContent = JSON.stringify(item);
    document.head.appendChild(el);
  });
}

export function TitleManager({ 
  title, 
  description, 
  image, 
  canonical, 
  noIndex, 
  ogType = 'website',
  jsonLd 
}: TitleManagerProps) {
  useEffect(() => {
    const siteName = 'KILIMO';
    const computedTitle = title ? `${title} | ${siteName}` : siteName;
    document.title = computedTitle;
    
    // Ajouter le favicon avec le logo KILIMO
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!favicon) {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.href = '/kilimo-logo.png';
      document.head.appendChild(link);
    }

    const url = canonical || window.location.href;
    if (canonical) upsertLink('canonical', canonical);

    // Standard SEO
    if (description) upsertMeta({ name: 'description' }, description);
    if (noIndex) upsertMeta({ name: 'robots' }, 'noindex, nofollow');
    else upsertMeta({ name: 'robots' }, 'index, follow');

    // Open Graph
    upsertMeta({ property: 'og:title' }, computedTitle);
    if (description) upsertMeta({ property: 'og:description' }, description);
    upsertMeta({ property: 'og:type' }, ogType);
    upsertMeta({ property: 'og:url' }, url);
    if (image) upsertMeta({ property: 'og:image' }, toAbsoluteUrl(image));
    upsertMeta({ property: 'og:site_name' }, siteName);

    // Twitter Card
    upsertMeta({ name: 'twitter:card' }, image ? 'summary_large_image' : 'summary');
    upsertMeta({ name: 'twitter:title' }, computedTitle);
    if (description) upsertMeta({ name: 'twitter:description' }, description);
    if (image) upsertMeta({ name: 'twitter:image' }, toAbsoluteUrl(image));

    // JSON-LD
    upsertJsonLd(jsonLd || null);
  }, [title, description, image, canonical, noIndex, ogType, jsonLd]);

  return null;
}

export default TitleManager;


