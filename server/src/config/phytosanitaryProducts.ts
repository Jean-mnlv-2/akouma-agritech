/**
 * Enums fermés pour la caractérisation des produits phytosanitaires —
 * validés côté serveur à la création/modification, reflétés dans le menu
 * déroulant du formulaire admin (AdminPhytosanitaryProducts.tsx).
 */
export const PHYTO_PRODUCT_TYPES = [
  'Herbicide',
  'Fongicide',
  'Insecticide',
  'Acaricide',
  'Nématicide',
  'Régulateur de croissance',
  'Autre',
] as const;
export type PhytoProductType = (typeof PHYTO_PRODUCT_TYPES)[number];

export const PHYTO_REGULATORY_STATUSES = ['homologué', 'restreint', 'en évaluation', 'retiré'] as const;
export type PhytoRegulatoryStatus = (typeof PHYTO_REGULATORY_STATUSES)[number];

export const PHYTO_TIERS = ['standard', 'premium'] as const;
export type PhytoTier = (typeof PHYTO_TIERS)[number];
