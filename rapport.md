Audit approfondi — Plateforme KILIMO

> Analyse basée sur la structure du dépôt (43 pages React, 46 routes Express, Prisma/Postgres, i18n 6 langues, e-learning + shop + paiements Money Fusion + livraison + chatbot IA). Ton volontairement direct.

---

1. Vision globale

Produit : SaaS agritech multifacette : e-learning (cours, quizzes, certificats Sertifier), e-commerce (semences + boutique + livraison via API tierce), contenu (news scraping automatique, événements), consulting agricole, dons, partenariats, chatbot IA, dashboard admin/supervisor.

Forces
- Périmètre fonctionnel très large, cohérent autour d'un même public (agriculteurs, apprenants Afrique de l'Ouest).
- Stack moderne : React 18 + Vite + shadcn + Tailwind, Node/Prisma/Postgres, i18n natif, PWA offline, tests de régression sécurité.
- Récent gros travail de hardening (Zod strict, audit log, anti-replay webhooks).

Faiblesses
- Scope trop large pour un seul produit : e-learning + marketplace + news + dons + consulting + assistant IA → dispersion produit, aucune verticale n'atteint la profondeur d'un concurrent dédié (Coursera, Jumia Agri, Hello Tractor…).
- Positionnement flou : est-ce une marketplace ? une école ? un média ? La proposition de valeur unique n'est pas énoncée sur l'app.
- Aucun onboarding guidé, aucune segmentation par persona (agriculteur / distributeur / apprenant / donateur).
- Dépendance forte à des APIs tierces critiques sans plan de repli (Money Fusion, Le Livreur, Sertifier, Lovable AI Gateway).

Gravité globale positionnement : Élevé — P1.

---

2. Audit UX

| # | Problème | Gravité | Impact | Solution | Effort | Prio |
|---|---|---|---|---|---|---|
| UX-1 | Pas d'onboarding après signup (aucun wizard "choisis ton profil / ta région / tes cultures") | Élevé | Rétention J1 faible, activation faible | Wizard 3 étapes + segmentation persona stockée sur `profile` | Moyen | P1 |
| UX-2 | 43 pages front, header unique → surcharge cognitive, IA plate | Élevé | Perte de repères, taux de rebond | Refonte IA : 4 hubs (Apprendre / Acheter / Découvrir / Mon compte), méga-menu | Moyen | P1 |
| UX-3 | Recherche globale absente (aucun composant `Command`/search) | Élevé | Utilisateur ne trouve pas un cours/produit spécifique | Ajouter cmdk global (⌘K) indexant courses/products/news | Moyen | P1 |
| UX-4 | Pas d'états vides éducatifs (empty states) confirmés dans `MyCourses`, `Orders`, `MyCashback` | Moyen | Nouveaux utilisateurs perdus | Empty states avec CTA contextuel | Rapide | P2 |
| UX-5 | Chatbot bulle réservée aux connectés → visiteurs anonymes n'ont pas d'aide | Moyen | Conversion réduite | Version dégradée pré-auth (FAQ) | Rapide | P2 |
| UX-6 | 6 langues UI mais contenu (news, cours, produits) probablement mono/bilingue | Élevé | Promesse i18n non tenue | Traduction du contenu ou fallback explicite | Complexe | P1 |
| UX-7 | Reprise vidéo au timestamp existe mais pas de feedback visible ("Reprendre à 12:34") | Faible | Perception de brutalité | Toast/CTA au chargement | Rapide | P2 |
| UX-8 | Formulaires longs (Careers, Partnerships, Contact) sans auto-save ni multi-step | Moyen | Abandon | React Hook Form multi-step + localStorage draft | Moyen | P2 |
| UX-9 | Aucun indicateur de progression pendant checkout multi-étapes | Moyen | Anxiété paiement | Stepper visuel | Rapide | P1 |

---

3. Audit UI

- Design system : shadcn + tokens semantic (bien). Mais règle mémoire "pas de `pt-*` manuel, spacing 7.5rem" révèle un correctif ad hoc plutôt qu'un vrai système d'espacement — dette design. Moyen — P2.
- Contraste : `#E57D27` (orange) sur blanc = ratio ≈ 3.0 → échec WCAG AA pour texte < 18pt. Élevé — P1. Réserver aux CTA grands, ne jamais utiliser comme texte body.
- Typographie 18px body : bon pour lisibilité mobile mais peut casser la densité desktop → prévoir un scale responsive (16 desktop / 18 mobile).
- États boutons : shadcn OK ; vérifier `focus-visible` sur icônes personnalisées (ex. `ChatBubble`, `PWAInstallButton`).
- Cohérence : mix Radix + composants custom (`AdaptiveImage`, `PageHeaderCarousel`) → documenter dans un Storybook (absent). Moyen — P2.
- Dark mode : `ThemeProvider defaultTheme="light"` avec storageKey — vérifier que toutes les couleurs sont bien tokenisées (mémoire indique "constraints" sur `text-white`/`bg-black`). Audit visuel nécessaire.

---

4. Audit fonctionnel

Doublons / incohérences détectés
- `NewsletterForm.tsx` et `EnhancedNewsletterForm.tsx` cohabitent → à unifier. Moyen — P2.
- `Auth.tsx` + `AdminAccess.tsx` + `AuthConfirm.tsx` + `ResetPassword.tsx` → 4 pages d'auth, potentiellement redondantes.
- `tests/integration/authRoutes.test.js` et `.ts` (les deux existent) → double exécution. Faible — P3.
- `test-auth.js`, `test-delivery.js`, `test-paths.js`, `debug-api.sh`, `check_env.cjs`, `test_kilimo_api.cjs`, `test_rss.cjs`, `test_rss.py`, `fix_news_category.sql` à la racine → pollution du repo, à déplacer dans `scripts/` ou supprimer. Faible — P3.
- Fichier `nul` versionné (artefact Windows du `2>nul` mal échappé dans `predev`/`prebuild`) → bug scripts. `2>nul` ne fonctionne pas sous Linux ; utiliser `2>/dev/null || true`. Moyen — P1.

Fonctionnalités manquantes critiques
- Facturation PDF pour commandes (obligation légale UEMOA/OHADA selon pays).
- Suivi de livraison temps réel côté client (l'API Le Livreur est intégrée mais le tracking user-facing n'apparaît pas dans `OrderDetail`).
- Wishlist / favoris (standard e-commerce).
- Retours & remboursements — flow admin uniquement, rien côté user.
- 2FA pour comptes admin/supervisor (critique vu les droits).
- Notifications in-app (uniquement email + polling admin).

Parcours cassés potentiels
- Chatbot IA (`google/gemini-3-flash-preview`) : ce nom de modèle n'existe pas sur Lovable AI Gateway → risque runtime error. Modèles valides : `google/gemini-2.5-flash`, `google/gemini-2.5-pro`. Critique — P0.
- `predev`/`prebuild` échoue silencieusement sur Linux (Render) → sitemap non régénéré en prod. Élevé — P1.

---

5. Audit technique

Architecture : monorepo léger (front Vite + back Express) — OK. Pas de découpage en workspaces (`pnpm`/`bun` workspaces) → typages partagés dupliqués. Moyen — P2.

Qualité code
- 20 500 lignes back sur 46 routes → moyenne 445 l/route, plusieurs > 300 (`payments.ts` 331, `promoCodes.ts` 391, `orders.ts` 309, `newsScraper.ts` 213) → refactor en services. `ordersService.ts` existe déjà, généraliser. Moyen — P2.
- Fichier `server/src/routes/generic.ts` : nom + concept suspect (routes génériques ≈ Rails scaffolding) → risque d'exposition CRUD non contrôlée. À auditer en priorité — Élevé — P1.
- Pas de lint back visible (`server/package.json` sans script `lint`). Moyen — P2.
- `tsgo`/`tsc --noEmit` non intégré CI (aucun `.github/workflows`). Élevé — P1.

Monitoring / logging
- `utils/logger.ts` + `utils/metrics.ts` présents mais pas de Sentry/OpenTelemetry visible. Élevé — P1.
- Aucune stratégie de log structuré (JSON) pour Render.

Gestion d'erreur front : `ChatBubble`, `useCart`, appels API — vérifier boundary React global (absent de `App.tsx`). Moyen — P2.

---

6. Sécurité

Points positifs récents : Zod strict, anti-replay webhooks, audit log, RLS-style checks, tests de régression, JWT 7j.

Problèmes restants

| # | Problème | Gravité | Prio |
|---|---|---|---|
| SEC-1 | JWT stocké en `localStorage` (`kilimo_auth_user`) → vulnérable XSS. Pas de cookie httpOnly. | Critique | P0 |
| SEC-2 | Durée JWT 7j sans refresh token ni révocation → un token volé = 7j d'accès | Élevé | P0 |
| SEC-3 | Pas de CSP visible dans `index.html` ni headers Helmet côté Express (à vérifier `middleware/csrf.ts` scope) | Élevé | P1 |
| SEC-4 | `INTERNAL_API_TOKEN` a une valeur par défaut codée (`secure_internal_token_change_in_production`) — si non overridée en prod = backdoor | Critique | P0 |
| SEC-5 | `DEFAULT_ADMIN_PASSWORD` seedé — vérifier qu'aucun déploiement prod ne l'utilise ; forcer rotation obligatoire au 1er login | Élevé | P0 |
| SEC-6 | Rate limit `middleware/rateLimit.ts` : vérifier qu'il est appliqué à `/auth/*`, `/payments/*`, `/chat` (coût IA !) | Élevé | P1 |
| SEC-7 | Chat IA sans budget par user/jour → risque de facture explosive (LOVABLE_API_KEY) | Élevé | P1 |
| SEC-8 | Uploads (`FileUpload.tsx`, CV 10MB, images news via ReactQuill) — vérifier validation MIME + antivirus + stockage isolé (pas de path traversal). | Élevé | P1 |
| SEC-9 | reCAPTCHA présent mais non systématique sur forms publics (contact, newsletter, donations) | Moyen | P2 |
| SEC-10 | Pas de rotation JWT_SECRET documentée | Moyen | P2 |
| SEC-11 | CORS `FRONTEND_ORIGINS` en env — bien ; vérifier `credentials: true` cohérent si migration cookie | Moyen | P2 |
| SEC-12 | Pas de politique de mot de passe (longueur/complexité/HIBP) côté signup | Élevé | P1 |

RGPD (voir §12) : renforce SEC-1 (localStorage = données perso en clair).

---

7. Base de données

Sans lecture complète du `schema.prisma`, points structurels probables (à confirmer) :

- `AuditLog` et `WebhookNonce` ajoutés — bien. Prévoir cleanup cron (TTL 90j audit, 24h nonce). Moyen — P2.
- `ChatMessage` : sans limite → table qui explose. Ajouter partition par date ou archivage. Élevé — P1.
- Vérifier index sur : `Order.userId`, `Order.status`, `ModuleProgress.enrollmentId`, `ChatMessage.threadId+createdAt`, `News.publishedAt`, `AuditLog.entityType+entityId`. Élevé — P1.
- `onDelete` cascade : à auditer (perte de traces si `User` supprimé).
- Sauvegardes Postgres (Render) : documenter RPO/RTO. Élevé — P1.
- Pas de séparation read/write, pas de replica → OK à cette échelle mais anticiper.

---

8. API

- REST cohérent (`/api/<resource>`), Zod strict → bien.
- Documentation absente (pas d'OpenAPI/Swagger). Élevé — P1.
- Pagination : `utils/pagination.ts` existe, vérifier qu'elle est appliquée sur toutes les listes (news, orders, products, chat messages).
- Versionning API absent (`/api/v1/…`) → migration future douloureuse. Moyen — P2.
- Codes d'erreur incohérents : tests montrent `[400,401,403,404,503]` acceptés — normaliser un enveloppe `{ error, code, message, details }`. Moyen — P2.
- SSE chat : prévoir `keepalive` + gestion déconnexion + fallback fetch non-stream. Moyen — P2.

---

9. Performance

- Bundle : 43 pages importées statiquement dans `App.tsx` → un seul chunk énorme. `Suspense` présent mais aucun `lazy()` visible. Critique pour LCP/TTI mobile Afrique. P0.
  ```tsx
  const Shop = lazy(() => import('./pages/Shop'));
  ```
- Quill + react-markdown + i18next + embla + recharts → ~800Ko probable. Audit `vite-bundle-visualizer`.
- Images : `AdaptiveImage.tsx` bien, mais pas de `vite-imagetools` détecté → WebP/AVIF non générés.
- LCP : hero image non `<link rel="preload">` dans `index.html`.
- Requêtes : polling 10s (orders) + 30s (notifs) + 30s (chat live) → charge Render inutile. Passer à SSE ou WebSocket. Élevé — P1.
- Cache HTTP : vérifier headers immuables sur `/assets/*` (Vite OK par défaut) et cache API TanStack.
- Service worker (`public/sw.js`) : stratégie ? risque de servir du contenu périmé si mal configuré.

---

10. SEO

- `index.html` : title/description génériques probablement (à vérifier). Mémoire indique que corrections ont été faites — bien.
- `react-helmet-async` : non listé dans les deps snapshot → per-route meta absent. Élevé — P1.
- Sitemap : script échoue sur Linux (`2>nul`) → sitemap non à jour en prod. Critique — P0.
- 43 routes dont la plupart publiques → sitemap doit lister dynamiquement news/products/courses depuis DB (le script actuel semble statique).
- `robots.txt` + `sitemap.xml` présents.
- URLs slug-based (`/shop/:slug`, `/news/:slug`) → bien.
- Données structurées : `Organization` OK ; manque `Product`, `Course`, `Article` per page. Élevé — P1.
- Canonical per route : nécessite Helmet.
- Multi-langue : pas de `hreflang` détecté malgré 6 langues → perte SEO massive. Élevé — P1.

---

11. Accessibilité (WCAG AA)

- Radix/shadcn = bonne base ARIA.
- Contraste orange KILIMO (voir UI). Élevé — P1.
- Icon-only buttons (`ChatBubble`, PWA install, header menu) : vérifier `aria-label`.
- `<main>` unique par route : non garanti (audit à faire).
- Navigation clavier chatbot streaming : vérifier annonces `aria-live="polite"`.
- Vidéos cours : sous-titres/transcriptions ? Élevé — P1 (RGAA/WCAG 1.2).
- Formulaires : erreurs Zod côté server → afficher via `aria-describedby`.

---

12. RGPD / Conformité

| # | Problème | Gravité |
|---|---|---|
| RGPD-1 | JWT en localStorage = données perso en clair côté client, accessible par tout script tiers (analytics, ads) | Critique |
| RGPD-2 | `CookieConsent` présent — vérifier qu'aucun cookie/script tiers ne se charge avant consentement (reCAPTCHA, GA…) | Élevé |
| RGPD-3 | Pas de flow "export mes données" ni "suppression compte" côté user visible | Élevé |
| RGPD-4 | Politique de conservation non documentée (audit log, chat messages, orders) | Moyen |
| RGPD-5 | DPA avec Sertifier, Money Fusion, Le Livreur, Resend, Lovable AI — à formaliser | Moyen |
| RGPD-6 | Mentions légales / DPO / registre des traitements — pages existent (`Legal`, `Privacy`) mais contenu à valider juridiquement | Élevé |
| RGPD-7 | Emails transactionnels sans lien de désabonnement pour marketing | Moyen |

---

13. Qualité produit

- Maturité perçue : v0.9 — beaucoup de features, peu de polish transversal.
- Robustesse : hardening récent = bon signal ; mais absence de CI/CD, monitoring, tests E2E = risque prod.
- Confiance utilisateur : chatbot, badges gamification, certificats = bien ; mais absence de reviews/notes visibles côté produits/cours = manque de social proof (composant `AdminReviews.tsx` existe mais pas côté user ?).

---

14. Analyse concurrentielle rapide

| Domaine | Concurrent | Gap KILIMO |
|---|---|---|
| E-learning agri | Digital Green, Agrilearn | Pas de contenu vidéo offline downloadable, pas d'apprentissage adaptatif |
| Marketplace intrants | Jumia Agri, Farmerline | Pas de comparateur, pas de vendeurs multiples (mono-marchand) |
| News agri | RFI Afrique, Commodafrica | Auto-scraping bien mais pas de personnalisation par culture |
| Assistant IA | FarmGPT | Contexte non enrichi par RAG sur vos données produits/cours |

Opportunités innovantes
- RAG sur catalogue cours + produits pour le chatbot.
- Mode offline complet (PWA + cache SW) pour zones connectivité faible.
- USSD/WhatsApp entry point pour agriculteurs sans smartphone.

---

15. Roadmap priorisée

P0 — Bloquants avant prod (1-2 semaines)
1. Corriger `predev`/`prebuild` (`2>nul` → `2>/dev/null || true`) et supprimer fichier `nul`.
2. Corriger modèle chatbot (`google/gemini-2.5-flash`).
3. Migrer JWT → cookie httpOnly + SameSite=Lax + Secure ; refresh token court.
4. Forcer override `INTERNAL_API_TOKEN` et `DEFAULT_ADMIN_PASSWORD` en prod (fail au boot si valeurs par défaut).
5. Lazy loading routes React (`lazy()` + Suspense par route).
6. Rate limit + budget IA sur `/api/chat`.
7. Audit `routes/generic.ts` (potentiellement dangereux).

P1 — 2-4 semaines
8. CI GitHub Actions : lint + tsc + tests + audit deps.
9. Sentry + logs JSON structurés.
10. `react-helmet-async` + meta/hreflang/JSON-LD par route.
11. Refonte IA / méga-menu + recherche globale ⌘K.
12. Onboarding wizard post-signup + segmentation persona.
13. 2FA admin/supervisor + politique mot de passe (Zod + HIBP).
14. Index Postgres manquants + cleanup cron audit/chat/nonces.
15. Suivi livraison temps réel côté user + factures PDF.
16. Sous-titres vidéos + contraste orange corrigé.
17. Export/suppression données RGPD + revue consent avant scripts tiers.

P2 — 1-2 mois
18. OpenAPI/Swagger + versionning `/api/v1`.
19. Refactor routes > 250 lignes en services.
20. Storybook + tokens design consolidés.
21. Unification `NewsletterForm` / `EnhancedNewsletterForm` / pages auth.
22. Tests E2E Playwright (parcours checkout, e-learning complet).
23. Traduction contenu (news/cours) ou fallback explicite.

P3 — Trimestre suivant
24. RAG chatbot sur catalogue.
25. Mode offline complet + WhatsApp/USSD.
26. Marketplace multi-vendeurs, wishlist, avis produits côté user.

---

16. Notes

| Axe | Note /10 | Justification |
|---|---|---|
| UX | 5.5 | Périmètre riche mais IA plate, pas d'onboarding, pas de recherche |
| UI | 6.5 | shadcn cohérent mais contraste + dette spacing |
| Technique | 6 | Bonne base, dette back, pas de CI |
| Performance | 4.5 | Bundle non splitté, polling excessif, pas d'images optimisées |
| Sécurité | 6 | Gros progrès récents mais JWT localStorage + secrets par défaut |
| SEO | 5 | Sitemap cassé sur Linux, pas de meta per-route, pas de hreflang |
| Accessibilité | 6 | Radix aide, mais contraste + vidéos sans sous-titres |
| Qualité code | 6 | Zod + audit bien, mais fichiers à la racine, doublons, routes trop longues |
| Scalabilité | 5.5 | Monolithe Express OK court terme, chat + polling à revoir |
| Valeur produit | 7 | Scope pertinent pour le marché agri africain |

Note globale : 5.8 / 10 — Beta avancée, pas prod-ready.

---

17. Plan d'action (ordre optimal d'exécution)

Semaine 1 — P0 sécurité & runtime (items 1-4, 7). Ajouter CI minimale (lint + tsc).
Semaine 2 — P0 perf & IA (5, 6). Sentry (item 9).
Semaines 3-4 — SEO/meta (10), onboarding (12), 2FA (13), index DB (14).
Mois 2 — Refonte IA + recherche (11), livraison/facture (15), RGPD data rights (17), a11y (16).
Mois 3 — Doc API, refactor, Storybook, unifications, tests E2E.
Mois 4+ — Innovations concurrentielles (RAG, offline, multi-vendeurs).

---

18. Esprit critique — verdict sans complaisance

- Le produit essaie de faire cinq produits à la fois ; sans focus, aucun ne gagnera son marché. Choisissez la verticale champion (probablement e-learning agri + shop intrants) et reléguez le reste en "phase 2".
- Le récent sprint sécurité est solide mais masque des fondamentaux manquants : pas de CI, pas de monitoring, pas de doc API, JWT en localStorage. On a colmaté les fuites avant de vérifier l'étanchéité de la coque.
- La présence de `nul`, `check_env.cjs`, `debug-api.sh`, `.js` et `.ts` du même test, `NewsletterForm` et `EnhancedNewsletterForm` trahit un manque de discipline de repo — signal négatif pour un dev qui reprend le projet.
- Le chatbot avec un nom de modèle inexistant est symptomatique : features poussées sans smoke test end-to-end.

19. Vérification de conformité

Incohérences confirmées :
- `predev` Windows-only vs déploiement Linux (Render).
- Modèle IA invalide dans `/api/chat`.
- Doublons de formulaires et de tests.
- JWT en localStorage vs mémoire projet qui interdit d'utiliser localStorage pour vérifier des rôles admin (contradiction directe avec `security/user-roles`).
- Assets `text-white`/`bg-black` interdits par constraint mémoire — audit visuel nécessaire (non fait ici).

---