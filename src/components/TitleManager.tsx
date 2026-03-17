import { useEffect } from 'react';

type TitleManagerProps = {
  title?: string;
  description?: string;
  image?: string;
  canonical?: string;
  noIndex?: boolean;
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

export function TitleManager({ title, description, image, canonical, noIndex }: TitleManagerProps) {
  useEffect(() => {
    const siteName = 'BIA Agritech';
    const computedTitle = title ? `${title} | ${siteName}` : siteName;
    document.title = computedTitle;
    
    // Ajouter le favicon avec le logo AKOUMA
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!favicon) {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.href = '/logo-ak.png';
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
    upsertMeta({ property: 'og:type' }, 'website');
    upsertMeta({ property: 'og:url' }, url);
    if (image) upsertMeta({ property: 'og:image' }, image);
    upsertMeta({ property: 'og:site_name' }, siteName);

    // Twitter Card
    upsertMeta({ name: 'twitter:card' }, image ? 'summary_large_image' : 'summary');
    upsertMeta({ name: 'twitter:title' }, computedTitle);
    if (description) upsertMeta({ name: 'twitter:description' }, description);
    if (image) upsertMeta({ name: 'twitter:image' }, image);
  }, [title, description, image, canonical, noIndex]);

  return null;
}

export default TitleManager;


