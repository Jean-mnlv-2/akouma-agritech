export interface NewsSource {
  id: string;
  name: string;
  url: string;
  type: 'rss' | 'web';
  language: 'fr' | 'en';
  category: string;
  enabled: boolean;
}

export const NEWS_SOURCES: NewsSource[] = [
  {
    id: 'african-farming',
    name: 'African Farming',
    url: 'https://www.africanfarming.com/feed/',
    type: 'rss',
    language: 'en',
    category: 'Agriculture',
    enabled: true,
  },
  {
    id: 'agriculture-afrique',
    name: 'Agriculture Afrique',
    url: 'https://www.agriculture.com.af/feed/',
    type: 'rss',
    language: 'fr',
    category: 'Agriculture',
    enabled: true,
  },
  {
    id: 'agritech-africa',
    name: 'AgriTech Africa',
    url: 'https://agritechafrica.com/feed/',
    type: 'rss',
    language: 'en',
    category: 'Technologie',
    enabled: true,
  },
  {
    id: 'fao-news',
    name: 'FAO News',
    url: 'https://www.fao.org/africa/news-events/news/fr/rss/',
    type: 'rss',
    language: 'fr',
    category: 'Agriculture',
    enabled: true,
  },
  {
    id: 'world-bank-ag',
    name: 'World Bank Agriculture',
    url: 'https://blogs.worldbank.org/africacan/feed',
    type: 'rss',
    language: 'en',
    category: 'Économie',
    enabled: true,
  },
  {
    id: 'ciheam',
    name: 'CIHEAM',
    url: 'https://www.ciheam.org/fr/feed/',
    type: 'rss',
    language: 'fr',
    category: 'Formation',
    enabled: true,
  },
  {
    id: 'ifad',
    name: 'IFAD',
    url: 'https://www.ifad.org/fr/news/rss',
    type: 'rss',
    language: 'fr',
    category: 'Innovation',
    enabled: true,
  },
];

export const getEnabledSources = () => NEWS_SOURCES.filter(source => source.enabled);
