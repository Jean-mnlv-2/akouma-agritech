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
    id: 'minader',
    name: 'MINADER',
    url: 'https://www.minader.cm',
    type: 'web',
    language: 'fr',
    category: 'Local',
    enabled: true,
  },
  {
    id: 'oncc',
    name: 'ONCC',
    url: 'https://www.oncc.cm',
    type: 'web',
    language: 'fr',
    category: 'Local',
    enabled: true,
  },
  {
    id: 'cameroon-tribune',
    name: 'Cameroon Tribune',
    url: 'https://www.cameroon-tribune.cm',
    type: 'web',
    language: 'fr',
    category: 'Local',
    enabled: true,
  },
  {
    id: 'commodafrica',
    name: 'CommodAfrica',
    url: 'https://www.commodafrica.com',
    type: 'web',
    language: 'fr',
    category: 'Régional',
    enabled: true,
  },
  {
    id: 'willagri',
    name: 'Willagri',
    url: 'https://www.willagri.com',
    type: 'web',
    language: 'fr',
    category: 'Régional',
    enabled: true,
  },
  {
    id: 'afrique-agriculture',
    name: 'Afrique Agriculture',
    url: 'https://www.afrique-agriculture.org',
    type: 'web',
    language: 'fr',
    category: 'Régional',
    enabled: true,
  },
  {
    id: 'jeune-afrique-economie',
    name: 'Jeune Afrique Économie',
    url: 'https://www.jeuneafrique.com/economie',
    type: 'web',
    language: 'fr',
    category: 'Régional',
    enabled: true,
  },
  {
    id: 'mediaterre-afrique-centrale',
    name: 'Médiaterre Afrique centrale',
    url: 'https://www.mediaterre.org/afrique-centrale',
    type: 'web',
    language: 'fr',
    category: 'Régional',
    enabled: true,
  },
  {
    id: 'agritec-africa',
    name: 'Agritec Africa',
    url: 'https://www.agritecafrica.com',
    type: 'web',
    language: 'fr',
    category: 'Événements',
    enabled: true,
  },
  {
    id: 'africa-agri-expo',
    name: 'Africa Agri Expo',
    url: 'https://africa-agriexpo.com',
    type: 'web',
    language: 'en',
    category: 'Événements',
    enabled: true,
  },
  {
    id: 'acae',
    name: 'ACAE',
    url: 'https://aaae-africa.events',
    type: 'web',
    language: 'en',
    category: 'Événements',
    enabled: true,
  },
  {
    id: 'africa-food-changemakers',
    name: 'Africa Food Changemakers',
    url: 'https://afchub.org/events',
    type: 'web',
    language: 'en',
    category: 'Événements',
    enabled: true,
  },
  {
    id: 'farmonaut-blog',
    name: 'Farmonaut Blog',
    url: 'https://farmonaut.com/precision-farming',
    type: 'web',
    language: 'en',
    category: 'Innovation',
    enabled: true,
  },
  {
    id: '10times-agritech',
    name: '10times Agritech',
    url: 'https://10times.com/agritech',
    type: 'web',
    language: 'en',
    category: 'Innovation',
    enabled: true,
  },
];

export const getEnabledSources = () => NEWS_SOURCES.filter(source => source.enabled);
