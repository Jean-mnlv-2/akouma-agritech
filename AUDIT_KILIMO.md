# Audit approfondi — Plateforme KILIMO Agritech

> Audit technique et produit réalisé sur le code source (frontend `src/`, backend `server/`, base Prisma/PostgreSQL, module RAG, infra Docker/Nginx).
> Ton : critique, factuel, sans complaisance. Chaque constat cite le fichier concerné.
> Légende gravité : 🔴 Critique · 🟠 Élevé · 🟡 Moyen · ⚪ Faible — Priorité : P0 (bloquant prod) → P3 (évolution).

---

## 1. Vision globale

**Compréhension du produit.** KILIMO est une plateforme AgriTech africaine « tout-en-un » : (1) marketplace de semences certifiées + boutique d'outils, (2) e-learning certifiant (cours, modules, quiz, certificats Sertifier, live streams), (3) média/actualités agricoles (dont scraping auto via DeerFlow), (4) assistant IA (RAG sur base de connaissance) avec offres Free/Pro par abonnement, (5) dons, partenariats, carrières, consulting. Le back-office admin est très étendu (≈40 écrans).

**Proposition de valeur.** Forte et cohérente sur le papier : accompagner le petit producteur africain de bout en bout (savoir → intrants → outils → marché → conseil IA). Le positionnement « super-app agricole » est différenciant.

**Faiblesse structurelle majeure : l'ambition dépasse la maturité d'exécution.** Le périmètre fonctionnel est celui de 4-5 produits distincts, mais l'implémentation porte des marqueurs de projet « no-code accéléré » (Lovable/Trae) : couche d'accès données générique en SQL brut, duplication de logique d'auth, 55 instances Prisma, IA locale non industrialisable. Le produit est **fonctionnellement riche mais pas prêt pour la production à l'échelle**.

| Forces | Faiblesses |
|---|---|
| Périmètre et vision produit ambitieux et cohérents | Dette technique structurelle (voir §5) |
| Sécurité back **globalement au-dessus de la moyenne** (CSRF double-submit, rate-limit, recalcul prix serveur, validation Zod, audit log, anti-replay webhook) | Incohérences de configuration (domaines, secrets, doublons) |
| Suite de tests backend conséquente (151 fichiers, dont régressions sécurité) | IA (RAG Ollama/llama3.2) inadaptée à la production |
| Bon découpage front (lazy loading par route, React Query, design system shadcn) | SEO cassé par des URLs incohérentes ; SPA sans SSR |
| Gestion e-commerce sérieuse (prix/frais recalculés serveur, idempotence paiement) | Frontend très peu testé (5 fichiers) ; RGPD partiel |

---

## 2. Audit UX

| # | Constat | Grav. | Pourquoi c'est un problème | Impact | Solution | Effort | Prio |
|---|---|---|---|---|---|---|---|
| UX-1 | **Onboarding IA / Free vs Pro peu lisible** : le quota Pro est appliqué côté serveur (`chat.ts`), mais l'utilisateur découvre la limite par un message d'erreur en fin de flux, sans jauge de consommation ni CTA d'upgrade contextualisé en amont. | 🟠 | Friction et frustration au moment le plus engageant (conversation). | Abandon, mauvaise conversion Pro. | Afficher le quota restant en temps réel (l'API renvoie déjà `remaining`) + upsell inline. | Rapide | P1 |
| UX-2 | **Assistant nécessite un compte** (`chatRouter.use(authRequired)`) sans essai anonyme. | 🟡 | La fonctionnalité vitrine est cachée derrière l'inscription. | Perte d'acquisition. | Autoriser N messages anonymes (rate-limit par IP déjà prêt) avant mur d'inscription. | Moyen | P2 |
| UX-3 | **Charge cognitive du back-office** : ~40 écrans admin, navigation plate. | 🟡 | Difficile à opérer, formation lourde. | Erreurs de gestion, lenteur ops. | Regrouper par domaines (Boutique / E-learning / Contenu / CRM), recherche globale. | Moyen | P2 |
| UX-4 | **Parcours de paiement dépendant d'un webhook externe** : si Money Fusion ne rappelle pas, la commande reste `pending`. Un polling `GET /status` existe mais le retour utilisateur après redirection n'est pas garanti. | 🟠 | Utilisateur qui a payé peut voir « en attente ». | Perte de confiance, litiges. | Écran de confirmation avec polling actif + revalidation serveur + relance email. | Moyen | P1 |
| UX-5 | Le `ScrollToTop` (`App.tsx`) fait un `setTimeout(100ms)` pour les ancres — comportement fragile selon le temps de rendu lazy. | ⚪ | Ancres parfois ratées. | Micro-friction. | Utiliser un callback sur montage de la cible / `scroll-margin-top`. | Rapide | P3 |

**Points positifs UX** : cibles tactiles `min-h-11` respectées, splash screen brandé, skeletons de chargement, code splitting → temps d'interaction perçu correct.

---

## 3. Audit UI

- **Design system** : shadcn/ui + Radix + Tailwind + tokens de thème (light/dark via `next-themes`). Base **saine et cohérente**, composants accessibles par défaut, états de boutons gérés par `class-variance-authority`.
- 🟡 **UI-1 — Cohérence graphique non garantie sur le contenu riche** : les champs `content` (news, cours, pages légales) sont du HTML libre (Quill) injecté via `dangerouslySetInnerHTML` dans 18 fichiers. La typographie/espacement du contenu éditeur peut casser la hiérarchie visuelle. *Solution* : encapsuler dans `prose` (`@tailwindcss/typography` déjà installé) systématiquement. Effort rapide, P2.
- ⚪ **UI-2 — Contraste** : le splash utilise `#86efac` sur fond très sombre (OK), mais vérifier `text-muted-foreground` sur `bg-card/90` (NewsCard) → ratio potentiellement < 4.5:1. *Solution* : audit contraste automatisé (axe). P2.
- ⚪ **UI-3 — Images news en `object-contain` sur `bg-muted`** : rendu « letterbox » incohérent selon ratios. P3.

Note UI globale : **la fondation est bonne** ; le risque est sur le contenu dynamique non normalisé, pas sur les composants.

---

## 4. Audit fonctionnel

**Fonctionnalités existantes** : auth (JWT cookie + refresh rotation), rôles (customer/supervisor/admin + `allowedModules`), boutique/semences/panier/checkout/commandes, promo + cashback, livraison (Le Livreur), e-learning complet + certificats + rappels cron, news + scraping auto, assistant RAG Free/Pro, abonnements/plans/factures, dons, partenariats, carrières + candidatures, consentement cookies, back-office complet.

| # | Constat fonctionnel | Grav. | Impact | Solution | Prio |
|---|---|---|---|---|---|
| FN-1 | **Aucune décrémentation ni réservation de stock** à la commande (`ordersService.createOrder`) alors que `Seed.stock`/`ShopProduct.stock` existent. | 🟠 | Survente, ruptures non détectées, litiges. | Vérifier + décrémenter le stock dans la transaction ; refuser si insuffisant. | P1 |
| FN-2 | **Incrément `usesCount` du code promo non atomique vs concurrence** : deux commandes simultanées peuvent dépasser `maxUses`. | 🟡 | Abus promo / perte marge. | Contrainte conditionnelle `UPDATE ... WHERE usesCount < maxUses` ou verrou. | P2 |
| FN-3 | **Doublon de logique d'authentification** : `services/authService.ts` (token 7j, non utilisé par les routes) coexiste avec `routes/auth.ts` (1h + refresh 14j). | 🟡 | Confusion, risque de régression si branché par erreur (durée de session incohérente). | Supprimer `authService.ts` ou le rendre unique source de vérité. | P2 |
| FN-4 | **CRUD générique = surface fonctionnelle floue** : `routes/generic.ts` expose 21 tables en lecture/écriture par nom, en SQL brut. La frontière entre routes métier dédiées et générique est ambiguë. | 🟠 | Comportements non validés (pas de logique métier), incohérences. | Voir SEC-3 ; migrer vers des routes typées. | P1 |
| FN-5 | **`Certificate @@unique([userId, courseId])`** empêche toute réémission / repassage de cours. | ⚪ | Cas limite bloqué (échec certif puis nouvelle tentative). | Ajouter un statut/version plutôt qu'unicité stricte. | P3 |
| FN-6 | Modération du chat = liste de mots-clés (`chat.ts:38`) : bloque des termes légitimes (« password », « kill » pour ravageurs, « violence ») et se contourne trivialement. | 🟡 | Faux positifs (mauvaise UX) + fausse sécurité. | Remplacer par modération du fournisseur LLM + garde anti-injection. | P2 |

---

## 5. Audit technique

| # | Constat | Grav. | Pourquoi | Impact | Solution | Effort | Prio |
|---|---|---|---|---|---|---|---|
| TECH-1 | **55 instances `new PrismaClient()`** (une par fichier de route/service, `grep` confirmé). | 🔴 | Chaque client ouvre son propre pool de connexions ; sous charge → **épuisement de `max_connections` PostgreSQL** et crash. | Panne en production dès la montée en charge. | Un **singleton Prisma** partagé (`server/src/db.ts`) importé partout. | Moyen | **P0** |
| TECH-2 | **Couche d'accès données en SQL brut générique** (`generic.ts`, `$queryRawUnsafe` avec interpolation de nom de table/colonnes/LIMIT). | 🟠 | Anti-pattern : contournement de l'ORM typé, mapping camel/snake ad hoc, fragile, difficile à faire évoluer. | Dette lourde, bugs silencieux. | Remplacer par des routers Prisma typés par ressource. | Complexe | P1 |
| TECH-3 | **Dépendance IA à Ollama auto-hébergé (llama3.2)** avec `llama3.2` utilisé **aussi comme modèle d'embedding** (`rag/config`). | 🟠 | llama3.2 n'est pas un modèle d'embedding ; inférence CPU lente ; qualité FR agricole médiocre ; non scalable. | Réponses IA lentes/faibles, coût infra élevé. | Passer à un **LLM managé (Claude)** + modèle d'embedding dédié ; voir §8/§9. | Complexe | P1 |
| TECH-4 | `morgan('dev')` actif quel que soit l'env (`index.ts:179`). | ⚪ | Logs verbeux non structurés en prod. | Bruit, coût logs. | `morgan('combined')` + logger structuré en prod uniquement. | Rapide | P3 |
| TECH-5 | **Gestion d'erreurs hétérogène** : mélange `next(err)`, `try/catch` locaux, `res.status(400)` avec message d'exception brut renvoyé au client (`generic.ts`, `payments.ts` renvoie `e.message`). | 🟡 | Fuite d'infos internes, incohérence des codes HTTP. | Diagnostic difficile, info leak. | Wrapper `asyncHandler` + erreurs typées + jamais de message brut hors dev. | Moyen | P2 |
| TECH-6 | **Repo pollué** : `deerflow/`, `deerflow-src/`, `.trae/`, `.lovable/`, `rapport.md`, `IMPROVEMENTS.md`, `.env.backup`, `bun.lock` + `package-lock.json`. | ⚪ | Confusion, gestionnaires de paquets multiples. | Onboarding lent. | Nettoyage + un seul package manager. | Rapide | P3 |
| TECH-7 | **Monitoring/observabilité quasi absents** : `/health` ping DB, `utils/metrics.ts` existe mais pas d'APM, pas de tracing, pas d'alerting. | 🟠 | Aucune détection proactive d'incident. | MTTR élevé. | Sentry (front+back), métriques Prometheus, alertes. | Moyen | P1 |

**Points positifs** : séparation routes/services/middlewares/utils claire ; validation Zod ; `authRequired` recharge le rôle depuis la DB (cache 30s) — bonne pratique ; audit log (`utils/audit.ts`) ; anti-replay webhook.

---

## 6. Sécurité

> Bonne nouvelle : le back a été manifestement durci (tests de régression sécurité présents). Les points ci-dessous restent néanmoins réels.

| # | Constat | Grav. | Détail / fichier | Impact | Solution | Prio |
|---|---|---|---|---|---|---|
| SEC-1 | **reCAPTCHA silencieusement désactivé si `RECAPTCHA_SECRET_KEY` absent** (`recaptcha.ts:26-29` → `next()`), et **non contrôlé par `validateSecrets()`**. | 🔴 | Si la clé n'est pas fournie en prod, sign-in/sign-up/forgot passent sans captcha. | Bourrage de comptes, spam, brute-force facilité. | Exiger la clé en prod (échec au boot) OU basculer explicitement sur un mode Enterprise vérifié. | **P0** |
| SEC-2 | **Rate-limit en mémoire + fuite mémoire + clé IP falsifiable** (`rateLimit.ts`) : `Map` jamais purgée, non partagée entre instances, `keyGenerator` lit `x-forwarded-for` brut alors que `trust proxy=1`. | 🟠 | Inefficace en multi-instance ; contournable en spoofant l'en-tête ; croissance mémoire. | Protection anti-abus illusoire à l'échelle. | Redis (ex: `rate-limiter-flexible`) + s'appuyer sur `req.ip`. | P1 |
| SEC-3 | **`$queryRawUnsafe` avec interpolation** dans `generic.ts` (table, colonnes d'`orderBy`/filtres, `LIMIT`). | 🟠 | Injection bloquée aujourd'hui par whitelist + regex + paramètres, **mais** un seul oubli de validation = injection SQL ; pattern intrinsèquement risqué. | Risque SQLi latent, corruption données. | Migrer vers Prisma typé (cf. TECH-2). En attendant : tests exhaustifs (déjà partiels). | P1 |
| SEC-4 | **Vérification webhook paiement par secret en clair, comparaison non constante** (`payments.ts:196-200`, `provided !== webhookSecret`) plutôt qu'une **signature HMAC**. | 🟠 | Secret partagé loggable/interceptable ; timing attack théorique. | Faux paiements si secret fuite. | HMAC sur le corps + `crypto.timingSafeEqual`. La revalidation externe atténue déjà (bonne pratique existante). | P1 |
| SEC-5 | **Identifiants admin par défaut publiés** dans `README.md` et `env.ts` (`Admin123!`, `admin@kilimo.test`). | 🟡 | `validateSecrets()` bloque bien la prod, mais la fuite documentaire + `.env` local (`KilimoAdmin2026!`, `FORCE_RESET=true`) est risquée. | Compromission si un env non-prod est exposé. | Retirer du README ; générer un mot de passe aléatoire au 1er boot. | P2 |
| SEC-6 | **CSP autorise `'unsafe-inline'` pour les scripts** (`index.html` et `nginx/default.conf`). | 🟠 | Neutralise une grande partie de la défense XSS (or 18 usages de `dangerouslySetInnerHTML`). | XSS stocké via contenu éditeur si DOMPurify contourné. | Retirer `unsafe-inline` (nonces/hash), restreindre `img-src https:` et `connect-src https:`. | P1 |
| SEC-7 | **Pas de révocation de session / blacklist JWT** ; le cache rôle (30s) atténue mais un token volé reste valable 1h. | 🟡 | Impossible de déconnecter immédiatement un compte compromis. | Fenêtre d'abus. | Table de sessions/`jti` révocables, ou versioning de token par user. | P2 |
| SEC-8 | **Uploads** : admin-only + magic bytes + limite 100 Mo (bien), mais **pas de re-encodage image / scan antivirus**, fichiers servis même origine sous `/uploads`. | 🟡 | docx/xlsx = zip (macro possible), stockage disque local non répliqué. | Distribution de fichiers malveillants, perte à la panne. | Re-encoder les images (sharp), stockage objet (S3/R2), scan AV. | P2 |
| SEC-9 | `INTERNAL_API_TOKEN` a un défaut lisible ; bien bloqué en prod par `validateSecrets`. Bon. | ⚪ | — | — | RAS (surveiller). | P3 |

**Bonnes pratiques observées** : cookies `httpOnly`/`secure`/`sameSite`, refresh scoping `path=/auth`, recalcul serveur des prix/frais, non-révélation d'existence de compte au `forgot-password`, idempotence webhook, audit trail.

---

## 7. Base de données

- 🔴/🟠 **DB-1 — Index vectoriel invalide** : `KnowledgeChunk.embedding = vector(3072)` avec `CREATE INDEX ... USING hnsw (embedding vector_cosine_ops)`. **pgvector limite les index HNSW/IVFFlat à 2000 dimensions.** L'index sur 3072 dims **échoue à la création** → recherche RAG en **scan séquentiel O(n)**. *Impact* : latence IA croissante avec le corpus. *Solution* : modèle d'embedding ≤ 2000 dims (ex. 768/1024) + réindexation. **P0** (bloque la scalabilité de l'IA).
- 🟡 **DB-2 — Incohérence de ncommage** : tout le schéma est camelCase sauf `contact_settings` (snake_case mappé), d'où le hack `mapColumnName/unmapColumnName` dans `generic.ts`. Fragile. *Solution* : uniformiser via `@map`. P2.
- 🟠 **DB-3 — `stock` jamais utilisé transactionnellement** (cf. FN-1). P1.
- ⚪ **DB-4** — Modèles sans `updatedAt` (`Country`, `NewsletterSubscription`, `OrderItem`, `OrderEvent`) : traçabilité partielle. P3.
- ✅ Points forts : `Decimal(12,2)` pour la monnaie (pas de float), indexation métier soignée (Order, PromoCode, Certificate…), `onDelete: Cascade` cohérent, contraintes `@@unique` pertinentes, `WebhookNonce` pour l'anti-replay, `AuditLog` en BigInt.

---

## 8. API

- **Style** : REST-ish incohérent — `/auth/*` (racine), `/api/*` (métier), plus un CRUD générique `/api/:table` (RPC déguisé), plus des sous-clients ad hoc (`promoCodes`, `deliveryPartners`) dans `client.ts`. 🟡 **Manque de convention unifiée.**
- 🟠 **API-1 — Pagination non standardisée** : le générique renvoie `{data}` avec `LIMIT 1000` par défaut, sans total ni curseur ; risque de payloads massifs. *Solution* : enveloppe `{data, page, pageSize, total}` + limites strictes. P1.
- 🟡 **API-2 — Absence de documentation** (pas d'OpenAPI/Swagger). Le `README` liste des routes à la main, déjà partiellement obsolète. *Solution* : générer OpenAPI depuis Zod (`zod-to-openapi`). P2.
- 🟡 **API-3 — Contrats de réponse hétérogènes** : tantôt `{data}`, tantôt objet brut (`/auth/session`), tantôt `{success:true}`. *Solution* : enveloppe standard. P2.
- ✅ Validation Zod sur les routes sensibles, CSRF sur mutations cookie, rate-limit ciblé (login/chat/upload), gestion d'erreur centralisée existante.

---

## 9. Performance

| # | Constat | Grav. | Impact | Solution | Prio |
|---|---|---|---|---|---|
| PERF-1 | Pool Prisma explosé (TECH-1) | 🔴 | Saturation DB | Singleton | P0 |
| PERF-2 | Recherche vectorielle non indexée (DB-1) | 🟠 | Latence IA croissante | Embedding ≤2000 dims + HNSW | P0/P1 |
| PERF-3 | IA sur Ollama CPU (TECH-3) | 🟠 | Réponses lentes (plusieurs s/tokens) | LLM managé (Claude) streaming | P1 |
| PERF-4 | `/api/:table` `LIMIT 1000`, `admin/consumption/users` charge **tous** les users + budgets en mémoire (`chat.ts:550`) | 🟠 | O(n) mémoire, lenteur back-office | Agrégation SQL + pagination | P1 |
| PERF-5 | Pas de cache HTTP/CDN sur les endpoints publics (news/seeds/courses) | 🟡 | Charge DB inutile | `Cache-Control` + CDN / React Query `staleTime` | P2 |
| PERF-6 | 172 `console.*` dans `src/` | ⚪ | Bruit, micro-coût, fuite d'infos | Retirer en build (esbuild `drop`) | P3 |

✅ **Front bien optimisé** : code splitting par route (`App.tsx`), `sharp`/`vite-imagetools` au build, `AdaptiveImage`, `loading="lazy"`, PWA (`sw.js`, manifest). Core Web Vitals a priori corrects sur les pages statiques ; à mesurer réellement (Lighthouse CI non présent).

---

## 10. SEO

- 🟠 **SEO-1 — Domaine canonique incohérent (4 valeurs différentes)** :
  - `SEO.tsx` → `https://kilimo-agritech.com`
  - `index.html` JSON-LD → `https://kilimo-agritech.example.com`
  - `public/robots.txt` sitemap → `https://kilimo-agritech.lovable.app/sitemap.xml`
  - `client.ts` → `kilimo.onrender.com` / `kilimo-backend.onrender.com`
  → **Canonicals, OG et sitemap pointent vers des domaines contradictoires.** *Impact* : contenu dupliqué, mauvaise indexation, partages sociaux cassés. *Solution* : une seule variable `SITE_URL` centralisée. **P1, rapide.**
- 🟠 **SEO-2 — SPA sans SSR/prerender** : les meta par page sont posées par `react-helmet-async` côté client. Googlebot rend le JS, mais les crawlers sociaux (LinkedIn/Facebook/WhatsApp/Slack) lisent l'`index.html` statique → **toutes les pages partagent le même titre/description/OG**. *Solution* : prerender (vite-plugin-ssg / react-snap) ou SSR (Next). P1/P2.
- 🟡 **SEO-3 — Sitemap** généré au build (`scripts/generate-sitemap.ts`) mais domaine à vérifier vs SEO-1. P2.
- ✅ Bon socle on-page : composant `SEO` complet (canonical, OG, Twitter, JSON-LD Organization/Website/Product/Course/Article/Event/FAQ/Breadcrumb), `robots.txt`, `llms.txt` présents, langue `fr` déclarée.

---

## 11. Accessibilité (WCAG)

- ✅ Base solide grâce à Radix (rôles ARIA, focus, clavier), cibles tactiles ≥44px, `aria-hidden` sur icônes décoratives, `<time dateTime>`, `focus-visible:ring`.
- 🟡 **A11Y-1** — Images de contenu (NewsCard) en `alt=""` `aria-hidden` : acceptable si purement décoratives, mais pour des visuels d'article porteurs de sens c'est une perte d'info pour lecteurs d'écran. *Solution* : `alt` descriptif quand l'image porte du sens. P2.
- 🟡 **A11Y-2** — Contenu HTML riche (Quill) non garanti accessible (hiérarchie de titres, contrastes). P2.
- 🟡 **A11Y-3** — Aucun test a11y automatisé (axe/pa11y) ni audit clavier documenté. *Solution* : `@axe-core/playwright` dans la CI. P2.
- ⚪ Vérifier contrastes `muted-foreground` (cf. UI-2).

---

## 12. RGPD & conformité

- ✅ **Bon socle** : bannière `CookieConsent` + `consentGating.ts` (gating analytics/marketing), stockage `CookieConsent` avec **`ipHash` (IP hachée, pas en clair)**, versioning du consentement, méthode (`accept_all`/`reject_all`/`custom`/`revoked`), back-office `AdminCookieConsents`, pages Privacy/Terms/Legal/Cookies.
- 🟠 **RGPD-1 — Droits d'accès/portabilité/effacement non exposés à l'utilisateur** : export existe pour les threads de chat uniquement ; **pas d'export global de ses données ni de suppression de compte self-service**. *Impact* : non-conformité art. 15/17/20 RGPD. *Solution* : endpoints `/me/export` et `/me/delete` (anonymisation). P1.
- 🟡 **RGPD-2 — Durées de conservation non définies** (messages contact, candidatures avec CV, logs) : pas de purge automatique. *Solution* : politique de rétention + cron de purge. P2.
- 🟡 **RGPD-3 — Sous-traitants** (Resend, Money Fusion, Le Livreur, Sertifier, Google reCAPTCHA) : transferts de données à documenter dans la politique de confidentialité + registre. P2.
- 🟡 **RGPD-4 — CV/candidatures** stockés en clair sur disque (`/uploads`) sans contrôle d'accès fin. P2.

---

## 13. Qualité produit

- **Robustesse** : back testé (151 fichiers) et défensif ; front peu testé (5 fichiers) → **déséquilibre**, risque de régressions UI. 🟠
- **Stabilité** : dépendances lourdes et parfois redondantes (`react-quill` **+** `quill`, `react-select-country-list` **+** `countries.json`). Le SPA sans SSR + IA locale rendent la perception de « produit fini » fragile.
- **Maturité** : back e-commerce **mature**, IA **prototype**, SEO/RGPD **incomplets**. Le produit donne l'impression d'un MVP très étendu plutôt que d'un produit stabilisé.
- **Confiance utilisateur** : le maillon faible est le paiement (dépendance webhook, UX de confirmation) et l'IA (lenteur/qualité) — les deux moments de vérité.

---

## 14. Analyse concurrentielle (vs standards marché)

| Domaine | Standard attendu 2026 | KILIMO | Écart |
|---|---|---|---|
| Assistant IA | LLM managé (Claude/GPT), RAG indexé, streaming rapide | Ollama llama3.2 CPU, index vectoriel invalide | 🔴 Fort |
| E-commerce | Gestion stock, paiement robuste, factures | Prix serveur OK, **stock absent**, webhook fragile | 🟠 Moyen |
| SEO | SSR/prerender, canonicals cohérents | SPA client-only, domaines incohérents | 🟠 Moyen |
| Observabilité | APM, tracing, alerting | `/health` seulement | 🟠 Fort |
| Data layer | ORM typé, migrations propres | ORM + SQL brut générique | 🟠 Moyen |
| Conformité | Self-service RGPD complet | Partiel | 🟡 Moyen |

**Différenciateurs réels** : l'intégration verticale (savoir→intrants→marché→conseil) et l'ancrage africain (langues, cultures locales, livraison Le Livreur, paiement Money Fusion XOF) sont de vrais atouts si l'exécution technique suit.

**Innovations possibles** : conseil IA **contextualisé par géoloc/saison/culture**, alertes climatiques/ravageurs, marketplace C2C producteurs, WhatsApp bot (canal dominant en Afrique de l'Ouest).

---

## 15. Roadmap priorisée

### P0 — Corrections critiques (avant toute mise en production)
1. **Singleton Prisma** (TECH-1) — sinon crash sous charge.
2. **Forcer reCAPTCHA en prod** ou mode Enterprise vérifié (SEC-1).
3. **Corriger l'embedding/index vectoriel** : modèle ≤2000 dims + HNSW valide (DB-1/PERF-2).
4. Vérifier `validateSecrets` couvre bien tous les déploiements (JWT, INTERNAL_API_TOKEN, admin).

### P1 — Importantes (semaines suivantes)
5. Gestion du **stock transactionnel** (FN-1).
6. **Rate-limit distribué (Redis)** (SEC-2).
7. **HMAC signé** sur webhook paiement + timing-safe (SEC-4).
8. **CSP sans `unsafe-inline`** + restreindre `img/connect-src` (SEC-6).
9. **Unifier `SITE_URL`** (SEO-1) + prerender pages publiques (SEO-2).
10. **LLM managé (Claude)** pour l'assistant (TECH-3).
11. **Observabilité** (Sentry + métriques) (TECH-7).
12. **RGPD self-service** export/suppression (RGPD-1).
13. **Pagination standardisée** + requêtes back-office agrégées (API-1, PERF-4).

### P2 — Optimisations
14. Migrer `generic.ts` → routers Prisma typés (TECH-2).
15. Supprimer `authService.ts` dupliqué (FN-3).
16. OpenAPI depuis Zod (API-2), enveloppe de réponse unifiée (API-3).
17. Tests front + a11y automatisés (Robustesse, A11Y-3).
18. Rétention/purge des données (RGPD-2), normalisation `prose` du contenu (UI-1).

### P3 — Évolutions
19. Nettoyage repo, un seul package manager (TECH-6).
20. WhatsApp bot, conseil IA géolocalisé/saisonnier, marketplace C2C.

---

## 16. Scores (sur 10)

| Dimension | Note | Justification synthétique |
|---|---|---|
| UX | 6.5 | Parcours riches et soignés, mais frictions IA/paiement et charge cognitive admin. |
| UI | 7.5 | Design system shadcn cohérent ; risque sur contenu riche non normalisé. |
| Technique (archi/code) | 5.0 | Bonne structure mais dette lourde (SQL générique, 55 Prisma, doublons). |
| Performance | 5.0 | Front optimisé ; back plombé par pool DB, IA CPU, recherche vectorielle non indexée. |
| Sécurité | 6.5 | Back durci et testé ; mais reCAPTCHA contournable, rate-limit fragile, CSP permissive. |
| SEO | 5.0 | Excellent on-page annulé par domaines incohérents et absence de SSR. |
| Accessibilité | 6.5 | Bonne base Radix ; manque tests et rigueur sur contenu/alt. |
| Qualité du code | 5.5 | Lisible et validé côté back ; anti-patterns et front peu testé. |
| Scalabilité | 4.0 | Points bloquants concrets : Prisma, rate-limit mémoire, IA locale, index vectoriel. |
| Valeur produit | 8.0 | Vision et intégration verticale fortes, différenciation africaine réelle. |

### 🎯 Note globale : **5.9 / 10**
> Produit **prometteur et fonctionnellement mûr côté métier**, mais **pas prêt pour une mise en production à l'échelle** en l'état. 3-4 correctifs P0 (Prisma, reCAPTCHA, index vectoriel) sont **bloquants**. L'écart principal n'est pas l'ambition ni la sécurité de base — c'est la **scalabilité** et l'**industrialisation de l'IA**.

---

## 17. Plan d'action (ordre optimal d'exécution)

1. **Semaine 1 — Stop-the-bleeding** : singleton Prisma → reCAPTCHA prod → validateSecrets → embedding/index vectoriel. (Débloque la prod.)
2. **Semaine 2 — Intégrité métier & sécurité** : stock transactionnel → HMAC webhook → rate-limit Redis → CSP durcie.
3. **Semaine 3 — Visibilité & confiance** : unifier SITE_URL → prerender public → Sentry + métriques → écran de confirmation paiement robuste.
4. **Semaine 4 — IA industrialisée** : bascule LLM managé (Claude) + modèle d'embedding dédié + garde anti-injection ; jauge de quota Pro en temps réel.
5. **Semaine 5-6 — Conformité & dette** : RGPD self-service → pagination/agrégations → migration progressive de `generic.ts` → suppression doublons.
6. **Continu** : tests front + a11y en CI, Lighthouse CI, nettoyage repo, OpenAPI.

---

## 18. Esprit critique — verdict sans complaisance

- **Ce qui est réellement bon** : la logique e-commerce serveur (recalcul prix/frais, idempotence, audit) est de niveau professionnel ; la culture de test backend et de régression sécurité est **au-dessus de la moyenne** des projets à ce stade ; le design system et le découpage front sont propres.
- **Ce qui est réellement mauvais** : les **55 instances Prisma** et le **rate-limit mémoire** sont des fautes d'architecture qui feront tomber la prod ; l'**IA Ollama/llama3.2 avec embedding 3072 dims non indexable** est un choix inadapté qui ne passera pas à l'échelle et livre une qualité médiocre ; l'incohérence des **domaines** sabote le SEO malgré un excellent travail on-page ; le **CRUD générique en SQL brut** est une dette qui grandira avec chaque table.
- **Ce qui est trompeur** : le produit *paraît* fini (40 écrans admin, 20+ ressources) mais repose sur des fondations de prototype. La richesse fonctionnelle masque un déficit d'industrialisation.

## 19. Vérification de conformité (cohérence inter-composants)

- ❌ **Incohérence de configuration** : 4 domaines différents (SEO-1) ; deux systèmes de token (1h vs 7j, FN-3) ; camel vs snake case DB (DB-2).
- ❌ **Fonctionnalité inachevée** : index vectoriel qui échoue (DB-1) → RAG dégradé silencieusement ; stock modélisé mais non appliqué (FN-1) ; modération chat factice (FN-6).
- ❌ **Non-conformité aux bonnes pratiques** : `$queryRawUnsafe` (SEC-3), `unsafe-inline` CSP (SEC-6), rate-limit non distribué (SEC-2), pas d'observabilité (TECH-7), RGPD partiel (RGPD-1).
- ✅ **Cohérences confirmées** : le flux de paiement (initiate → webhook → post-payment → enrollment/delivery/subscription) est logiquement complet et sécurisé ; le modèle de données relationnel est cohérent et bien indexé ; la couche middleware (auth/csrf/validate/rate-limit) est appliquée de façon homogène sur les routes sensibles.

**Conclusion** : corriger les 3-4 P0 rend la plateforme déployable ; traiter les P1 la rend crédible à l'échelle ; les P2/P3 la hissent au niveau des standards du marché. La valeur produit (8/10) justifie l'investissement de remédiation.
