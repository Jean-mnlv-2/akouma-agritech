/**
 * Source unique des modules qu'un administrateur peut accorder à un
 * superviseur (`User.allowedModules`). Doit rester synchronisée avec :
 * - les clés vérifiées dans `src/pages/Admin.tsx` (gating des onglets/rendu),
 * - les clés vérifiées par `moduleAccess(...)` côté backend
 *   (server/src/middleware/authRequired.ts) sur les routes d'écriture.
 * Les onglets strictement réservés aux admins (abonnements, Sertifier,
 * certificats, affiliés, images d'en-tête, consentements cookies) ne figurent
 * pas ici : ils ne sont jamais délégables à un superviseur.
 */
export const ADMIN_MODULES = [
  { id: 'users', label: 'Utilisateurs' },
  { id: 'orders', label: 'Ventes & Promos' },
  { id: 'deliveries', label: 'Livraisons' },
  { id: 'courses', label: 'Cours' },
  { id: 'elearning-enrollments', label: 'Inscriptions e-learning' },
  { id: 'course-previews', label: 'Aperçus de cours' },
  { id: 'course-modules', label: 'Modules de cours' },
  { id: 'attendance', label: 'Présences' },
  { id: 'rattrapage-requests', label: 'Demandes de rattrapage' },
  { id: 'ai-suggestions', label: 'Suggestions DeerFlow' },
  { id: 'reminder-logs', label: 'Journal des rappels' },
  { id: 'news', label: 'Actualités' },
  { id: 'seeds', label: 'Semences' },
  { id: 'products', label: 'Produits' },
  { id: 'legal', label: 'Pages légales' },
  { id: 'partners', label: 'Partenaires' },
  { id: 'innovative-solutions', label: 'Solutions Innovantes' },
  { id: 'donations-content', label: 'Dons — Contenus' },
  { id: 'careers', label: 'Emplois' },
  { id: 'events', label: 'Événements' },
  { id: 'livestreams', label: 'Live Streams' },
  { id: 'submissions', label: 'Soumissions' },
  { id: 'reviews', label: 'Avis clients' },
  { id: 'contact-settings', label: 'Contacts & Réseaux' },
] as const;

export type AdminModuleId = (typeof ADMIN_MODULES)[number]['id'];
