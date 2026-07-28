# Audit approfondi par module — KILIMO Agritech

> Complément à `AUDIT_KILIMO.md` (audit transverse initial). Ce document couvre en profondeur : Actualités + DeerFlow, Semences, E-learning, Boutique/Commandes/Paiements/Livraison, Autres pages (Dons, Partenariats, Carrières, Légal, Auth, Pricing...), Admin (architecture), RAG (pipeline complet), et une revue UX/UI transversale de toutes les pages.
> Méthode : 8 analyses indépendantes en parallèle, lecture réelle du code (pas de suppositions), résultats dédupliqués et priorisés ci-dessous.
> Légende gravité : 🔴 Critique · 🟠 Élevé · 🟡 Moyen · ⚪ Faible.

---

## 0. TOP — Ce qu'il faut lire en premier

Ces éléments sont des **bugs bloquants concrets** (pas des risques théoriques) qui cassent des parcours utilisateurs réels ou exposent des failles exploitables. Ordonnés par impact.

| # | Module | Constat | Gravité |
|---|---|---|---|
| 1 | Semences | Le panier ne distingue pas les types de produits (`CartItem` n'a pas de `productType`) ; le checkout force `productType: 'shop_product'` pour **tout**, y compris les semences → **les semences ne peuvent pas être commandées correctement**. Pire : une semence #1 et un produit boutique #1 fusionnent silencieusement dans le panier. | 🔴 |
| 2 | E-learning | `GET /course/:courseId/modules` (contenu des modules) n'a **aucune vérification d'authentification ni d'inscription** : n'importe qui récupère vidéos, PDF et réponses de quiz de n'importe quel cours, payant ou non. Contournement total du paywall. | 🔴 |
| 3 | Autres pages | Formulaires **Dons** et **Partenariats** intégralement cassés : le frontend envoie des noms de champs (`name`, `country_id`...) que le backend n'attend pas (`donorName`, `country`...) → 400 systématique sur toute tentative. | 🔴 |
| 4 | Autres pages | Les 3 pages légales (Confidentialité/CGU/Mentions légales) affichent **toutes le même contenu** (la page la plus récemment créée en base), quel que soit le slug demandé — `GET /api/legal_pages` ignore ses propres query params. Risque de conformité légale réel. | 🔴 |
| 5 | Autres pages | L'upload de CV dans le formulaire de candidature public appelle `/api/upload`, protégé par `authRequired + adminOnly` → **un candidat non connecté ne peut jamais joindre son CV**. | 🔴 |
| 6 | Boutique | Le cashback est débité du solde utilisateur **avant** la commande, mais jamais soustrait du total payé via Money Fusion → l'utilisateur perd son solde ET paie le prix plein. | 🔴 |
| 7 | Boutique | CSRF absent sur `POST /use-cashback` (vidage de solde à distance) et sur `PUT /api/orders/:id` admin (un attaquant peut forcer `paymentStatus: paid` sur une commande via un admin piégé). | 🔴 |
| 8 | Admin | Le modèle de permissions `allowedModules[]` pour les superviseurs n'est vérifié **que côté frontend** (affichage des onglets) ; le backend protège par simple `adminOnly`/`supervisorOnly` sans notion de module → un superviseur limité peut appeler `/api/stats` directement et récupérer des données hors de son périmètre ; à l'inverse, il ne peut RIEN écrire dans ~90% des modules malgré une UI qui le lui promet. | 🔴 |
| 9 | E-learning | XSS stocké : `AdminCertificates.tsx`/`AdminAttendance.tsx` injectent des données utilisateur non échappées via `document.write()` (contrairement à tout le reste du code qui utilise DOMPurify) — un `fullName` piégé exécute du JS dans la session admin à l'export PDF. | 🔴 |
| 10 | Actualités | Écriture (`POST/PUT/DELETE`) sur `news.ts`/`events.ts` sans `try/catch` ; un slug dupliqué (contrainte unique) lève une exception non interceptée → en Express 4 sans handler global, **le process backend entier peut crasher** (DoS involontaire, déclenchable par un simple double-clic admin). | 🔴 |
| 11 | Autres pages | `GET /api/partnerships` (liste des demandes de partenariat avec emails/téléphones) est **public, sans authentification**. Fuite de PII. | 🟠 |
| 12 | RAG | Seuil de similarité (0.7) incohérent avec l'absence de préfixes `search_query:`/`search_document:` requis par `nomic-embed-text` → une large part des questions légitimes ne remonte **aucun résultat**, l'assistant répond hors-contexte alors que l'info existe en base. | 🟠 |
| 13 | Boutique | Aucune restauration de stock : commandes impayées supprimées après 7j, ou annulées par un admin, ne redonnent jamais le stock décrémenté → fuite de stock permanente. | 🟠 |
| 14 | UX/UI | i18n ne couvre réellement que ~10 pages sur 44 (le sélecteur de langue à 9 langues laisse croire à un site multilingue complet) ; aucune gestion RTL pour l'arabe proposé. | 🟠 |
| 15 | Semences | Les 3 routes GET publiques de `seeds.ts` n'appliquent aucun filtre `isPublished` → les semences en brouillon sont exposées publiquement (idem `careers.ts`/`events.ts`, constat croisé Autres pages). | 🟠 |
| 16 | DeerFlow | L'intégration "actualités automatiques par IA" documentée n'est **pas déployée** : `deerflow/`/`deerflow-src/` sont explicitement gitignorés, aucun service dans `docker-compose.yml`, `env.DEERFLOW_URL` jamais consommé. C'est un clone non modifié d'un framework externe (bytedance/deer-flow), pas une intégration KILIMO. Fonctionnalité fantôme. | 🟠 |

---

## 1. Module Actualités (News) + DeerFlow

### Vue d'ensemble
Trois canaux de contenu non cohérents entre eux : saisie manuelle admin, scraper interne (RSS/Cheerio, sans UI ni cron), et DeerFlow (agent IA externe, non déployé — voir ci-dessous).

### Constats fonctionnels
| Gravité | Fichier:ligne | Problème | Solution | Effort |
|---|---|---|---|---|
| 🔴 | `server/src/routes/news.ts:83-118`, `events.ts:32-50` | Aucun try/catch sur les écritures → un slug dupliqué peut faire planter le process (unhandled rejection, Express 4). | Encadrer les handlers, ajouter `process.on('unhandledRejection')` en filet de sécurité. | Rapide |
| 🟠 | `src/App.tsx:119-121,156` | Le lien "Tous les événements" pointe vers `/events`, route inexistante (seule `/events/:slug` existe) → 404. | Créer une page liste `/events`. | Rapide |
| 🟠 | `src/components/admin/AdminNews.tsx:38-45` | `GET /api/news` sans pagination → au-delà de 9 articles, invisibles/ingérables dans l'admin. | Ajouter pagination/recherche. | Moyen |
| 🟠 | `server/src/config/newsSources.ts` vs `News.tsx`/`AdminNewsDialog.tsx` | 3 taxonomies de catégories incompatibles (scraper vs UI publique vs admin) → tout article scrapé prend une catégorie invisible dans les filtres et dans le `&lt;Select&gt;` admin. | Unifier la taxonomie. | Moyen |
| 🟠 | `server/src/routes/internalAutoNews.ts:42-63` | Dédoublonnage cassé : le check anti-doublon s'exécute après avoir déjà garanti un slug libre — ne peut jamais rien détecter. | Vérifier par `originalId`/`sourceUrl` comme le fait déjà `newsScraperService.saveArticle()`. | Rapide |
| 🟡 | Modèle `News` (schema.prisma) vs `NewsCard.tsx:79` | Aucun champ `read_time` en base ; "5 min" codé en dur affiché comme donnée réelle sur toutes les cartes. | Calculer un temps de lecture réel. | Rapide |
| ⚪ | `server/src/routes/newsScraper.ts` | Routes admin fonctionnelles (`/scrape`, `/publish-batch`...) sans aucun consommateur frontend. | Construire l'écran admin ou retirer le module. | Complexe |

### Constats sécurité
| Gravité | Fichier:ligne | Problème | Solution | Effort |
|---|---|---|---|---|
| 🟠 | `news.ts`, `events.ts` (aucun `csrfRequired`) | Écriture protégée par cookie JWT seul, sans vérification CSRF — contrairement à `payments.ts`/`generic.ts`. | Ajouter `csrfRequired`. | Rapide |
| 🟡 | `server/src/middleware/internalApiAuth.ts:19` | Comparaison du jeton par `!==` (non temps-constant), pas de rate-limit sur `/api/internal/auto-news`. | `crypto.timingSafeEqual` + rate-limit dédié. | Rapide |

### Analyse DeerFlow — verdict
**Intégration non déployée, probablement jamais utilisée en production.** Preuves : `deerflow/` et `deerflow-src/` sont explicitement exclus du `.gitignore` ; `deerflow-src/` est un clone intact du framework générique open-source `bytedance/deer-flow` (aucune personnalisation KILIMO visible) ; **aucun service DeerFlow dans `docker-compose.yml`** ; `env.DEERFLOW_URL` déclaré mais jamais consommé côté backend ; `AUTO_NEWS_CRON_SCHEDULE` mort (le cron interne a été retiré au profit exclusif de DeerFlow, qui ne tourne nulle part). Le fichier de config exemple utilise même un token par défaut `dev_key_12345` en clair. **Conclusion** : le canal "actualités automatiques par IA" annoncé dans la documentation est une fonctionnalité fantôme tant que ce service n'est pas réellement provisionné et déployé.

### Points positifs
Sanitisation DOMPurify cohérente partout, dédoublonnage robuste dans le scraper interne (contrairement à DeerFlow), pagination backend propre sur `/api/news`, accessibilité soignée sur la page publique (`role="tablist"`, `aria-live`), JSON-LD correct, gestion élégante du partage (`navigator.share`).

---

## 2. Module Semences (Seeds)

### Vue d'ensemble
Module riche (fiches détaillées, avis, protection anti-copie, schema.org) mais avec un **bug critique de bout en bout au paiement** (voir §0).

### Constats fonctionnels
| Gravité | Fichier:ligne | Problème | Solution | Effort |
|---|---|---|---|---|
| 🔴 | `src/pages/Checkout.tsx:228` | `productType: 'shop_product'` codé en dur pour tout item du panier, y compris les semences. | Propager le vrai `productType` depuis l'ajout au panier. | Moyen |
| 🔴 | `src/hooks/useCart.ts:4-11` | `CartItem` n'a aucun champ de type produit — collision d'ID entre `Seed`/`ShopProduct`/`Course` (compteurs indépendants). | Namespacer l'id panier (`seed:1`, `shop:1`). | Moyen |
| 🔴 | `server/src/routes/seeds.ts:6-54` | Les 3 routes GET publiques n'appliquent aucun filtre `isPublished`. | Ajouter `where: { isPublished: true }`. | Rapide |
| 🟠 | `AdminSeedDialog.tsx:352` vs `Seeds.tsx:311` | Valeurs de `availability` non alignées entre admin et logique de désactivation du bouton d'achat — une semence "en rupture" reste achetable dans l'UI. | Dériver `availability` du champ `stock` plutôt qu'un texte libre indépendant. | Faible/Moyen |
| 🟠 | `SeedDetail.tsx` vs `KilimoKnowledgeAdapter.ts:141` | `plantingInstructions`/`careInstructions` indexés pour le RAG mais jamais affichés sur la fiche produit — travail éditorial invisible côté client. | Ajouter ces champs à l'onglet "Guide de culture". | Faible |
| 🟡 | `SeedDetail.tsx:688` | Texte "avis **vérifiés**" trompeur : aucune vérification d'achat n'existe réellement. | Retirer le mot ou implémenter la vérification via `OrderItem`. | Faible/Moyen |
| 🟡 | `SeedDetail.tsx:115` | Le formulaire d'avis se réinitialise toujours vide même si l'utilisateur a déjà un avis → risque d'écrasement accidentel. | Pré-remplir avec l'avis existant. | Faible |

**Vérifié positif** : le recalcul de `rating`/`totalReviews` fonctionne bien (upsert + suppression), et le décrément de stock est atomique — contrairement à l'hypothèse initiale de l'audit transverse.

### Constats techniques/sécurité
| Gravité | Fichier:ligne | Problème | Solution | Effort |
|---|---|---|---|---|
| 🟠 | `use-copy-protection.ts` | La "protection anti-copie" n'intercepte que `copy`/`contextmenu` — contournable trivialement (Ctrl+U, DevTools, appel API direct). 100% cosmétique. | Documenter la limite au métier, ou investir dans une vraie protection si c'est un enjeu réel. | Faible (doc) |
| 🟡 | Duplication `Seed`/`ShopProduct` | Deux modèles quasi identiques, deux CRUD dupliqués — cause racine du bug panier du §0. | À moyen terme : discriminant `productType` partagé ou fusion des modèles. | Élevé |
| 🟡 | `seeds.ts:88-118` (PUT) | Aucune validation d'entrée sur update (prix/stock négatifs possibles). | Réutiliser les contraintes du POST. | Faible |

### Points positifs
Prix/frais toujours recalculés serveur, DOMPurify systématique, JSON-LD Product soigné, contrainte unique sur les avis, RAG filtre correctement `isPublished` (contrairement aux routes API elles-mêmes — preuve que le bon pattern est connu mais pas appliqué partout).

---

## 3. Module E-learning

### Vue d'ensemble
Module le plus complexe de la plateforme. Backend globalement bien structuré (file Sertifier robuste, anti-IDOR sur la plupart des écritures), mais **la frontière lecture publique/autorisation est cassée** (paywall entièrement contournable) et le certificat affiché en fin de parcours ne correspond à rien de réel en base.

### Constats fonctionnels
| Gravité | Fichier:ligne | Problème | Solution | Effort |
|---|---|---|---|---|
| 🔴 | `src/pages/CourseLearn.tsx:363-370` | Le "certificat obtenu" affiché est généré **côté client** (numéro aléatoire, score par défaut 85), sans lien avec le vrai `Certificate` créé en base — la vérification publique le déclarera introuvable. | Afficher un état "émission en cours" avec polling sur `/api/certificates/my`. | Moyen |
| 🔴 | `CourseLearn.tsx:58-203` | Aucune vérification d'inscription : la page fonctionne même sans `enrollmentId`, un visiteur anonyme peut parcourir tout le cours en cliquant "Marquer comme terminé". | Rediriger vers la fiche cours si non inscrit. | Rapide |
| 🟠 | `server/src/routes/courseModules.ts:156-219` + `QuizComponent.tsx:57-97` | Score de quiz calculé **entièrement côté client** à partir des réponses envoyées en clair au navigateur, jamais revalidé serveur. | Ne jamais renvoyer `correctAnswer` avant soumission ; valider les réponses côté serveur. | Élevé |
| 🟠 | `CertificateGenerator.tsx:40-81` | Bouton "Obtenir le certificat Sertifier" visible pour tout étudiant mais la route est `adminOnly` → 403 systématique pour 100% des utilisateurs. | Retirer ce bouton du parcours étudiant ou le rebrancher sur `/api/certificates/request`. | Rapide |
| 🟠 | `server/src/utils/cron.ts:239-289` | Rappels email envoyés même après complétion du cours (`completedAt` non filtré), `lastReminderSent` jamais lu ni écrit → spam potentiellement quotidien indéfini. | Filtrer `completedAt: null`, respecter un intervalle minimal. | Moyen |
| 🟠 | `ELearning.tsx:183-184` | `rating`/`isCertifying` n'existent pas sur le modèle `Course` → valeurs par défaut fictives (4.5★, "Certifiant") affichées sur **tous** les cours. | Aligner sur la logique réelle de `CourseDetail.tsx`. | Rapide |
| 🟡 | `LiveCourseChat.tsx:33` | `moduleId=0` est falsy en JS → le filtre par module n'est jamais appliqué, mélange discussion générale et par module. | Utiliser un discriminant explicite plutôt qu'une valeur falsy. | Rapide |
| 🟡 | `AdminCertificatePreview.tsx:103` | Le disclaimer "aucun certificat réellement émis" est faux : le bouton Sertifier de la page reste actif et déclenche une vraie émission avec des données de simulation. | Désactiver spécifiquement ce bouton en mode preview. | Rapide |

### Constats sécurité — 🔴 le plus grave du module
| Gravité | Fichier:ligne | Problème | Solution | Effort |
|---|---|---|---|---|
| 🔴 | `server/src/routes/courseModules.ts:14-26` | `GET /course/:courseId` (contenu complet : vidéo, PDF, quiz avec réponses) **sans aucun middleware d'auth**. Le frontend ne fait que masquer visuellement les liens si non inscrit — cosmétique. | Exiger `authRequired` + vérification d'inscription réelle, ne jamais renvoyer `correctAnswer` publiquement. | Moyen |
| 🔴 | `AdminCertificates.tsx:142-173`, `AdminAttendance.tsx:108-161` | Export PDF via `document.write()` avec données utilisateur non échappées (`fullName`, `email`) — XSS stocké dans la session admin. | Échapper ou utiliser DOMPurify comme partout ailleurs dans le code. | Moyen |

### Points positifs
File d'émission Sertifier robuste (claim atomique, retry, logs d'exécution, fallback local), double vérification serveur avant émission de certificat, anti-IDOR bien traité sur la majorité des routes d'écriture, progression non modifiable côté client, reprise de lecture vidéo/PDF bien implémentée.

---

## 4. Module Boutique / Commandes / Paiements / Livraison

### Vue d'ensemble
Bonne hygiène générale (prix recalculés serveur, idempotence webhook) mais un **bug monétaire critique sur le cashback** et une **lacune CSRF systémique** sur les routes hors paiement.

### Constats fonctionnels
| Gravité | Fichier:ligne | Problème | Solution | Effort |
|---|---|---|---|---|
| 🔴 | `Checkout.tsx:208-219` + `ordersService.ts:259` | Le cashback est débité **avant** la commande via un appel séparé, mais jamais soustrait du `total` envoyé à Money Fusion → argent perdu pour l'utilisateur. | Intégrer `cashbackAmount` dans le payload de commande, débiter uniquement après confirmation de paiement (webhook), dans la même transaction. | Élevé |
| 🟠 | Aucune restauration de stock (`grep "stock: increment"` → 0 résultat) | Commandes impayées supprimées après 7j (cron) ou annulées par un admin ne redonnent jamais le stock. | Ajouter le restockage à la suppression cron et au passage `cancelled`/`refunded`. | Moyen |
| 🟡 | `Cart.tsx`, `CartDrawer.tsx`, `ProductDetail.tsx` | Aucun composant ne connaît le stock réel ; les boutons `+` n'ont aucune borne liée au stock. | Exposer `stock` via l'API, borner l'UI. | Moyen |
| 🟡 | `orders.ts:244` + `AdminOrders.tsx:490` | Le statut "refunded" ne fait que changer un label : pas de restockage, pas de reprise du cashback déjà crédité à l'affilié. | Implémenter un vrai workflow de remboursement. | Élevé |
| 🟡 | `useCart.ts`/`CartContext.tsx` vs `Checkout.tsx:52` | État de sélection de partenaire de livraison dans le panier jamais réellement branché/finalisé au checkout (flux mort). | Nettoyer ou brancher réellement. | Faible/Moyen |

### Constats sécurité — plusieurs 🔴
| Gravité | Fichier:ligne | Problème | Solution | Effort |
|---|---|---|---|---|
| 🔴 | `promoCodes.ts:214-270` (`POST /use-cashback`, pas de `csrfRequired`) | CSRF exploitable pour vider le solde cashback d'une victime via un formulaire piégé auto-soumis. | Ajouter `csrfRequired`. | Rapide |
| 🔴 | `orders.ts:244` (`PUT`, admin, pas de `csrfRequired`) | CSRF permettant de forcer `paymentStatus: paid` sur une commande via la session d'un admin piégé — fraude possible (inscription/livraison déclenchées sans paiement réel). | Ajouter `csrfRequired`. | Rapide |
| 🟠 | `promoCodes.ts` (POST/PUT/PATCH admin), `shopProducts.ts`, `deliveryPartners.ts`, `orders.ts` (POST) | Même lacune CSRF systémique sur toutes les routes mutantes du module hors `payments.ts`. | Appliquer `csrfRequired` de façon systématique. | Faible/Moyen |
| 🟠 | `promoCodes.ts:237-245` (`use-cashback`) | Débit non atomique (lecture puis update sans clause `WHERE balance >= amount`) — même classe de bug TOCTOU déjà corrigée pour le stock, oubliée ici. | `updateMany({ where: { cashbackBalance: { gte } } })` comme `reserveStock`. | Faible |
| 🟠 | `AdminDeliveries.tsx:126-206` | Utilise `fetch()` brut avec `Authorization: Bearer localStorage.getItem('token')` — cette clé n'est **jamais écrite nulle part** dans le code (l'auth réelle repose sur un cookie httpOnly). En déploiement Render (frontend/backend sur domaines différents), les chemins relatifs tapent le mauvais host. | **Le panneau admin Livraisons est vraisemblablement non fonctionnel en production.** Réécrire avec le client API partagé. | Moyen |
| 🟡 | `deliveries.ts:144-154` (webhook) | Signature HMAC vérifiée sur le corps re-sérialisé, pas sur les octets bruts reçus — faux négatifs possibles. | Vérifier sur le `rawBody` capturé avant parsing. | Moyen |
| 🟡 | `promoCodes.ts:315` (`POST /validate`) | Public, sans rate-limit → énumération par force brute des codes promo actifs. | Rate-limiter dédié. | Faible |

### Points positifs
Recalcul serveur intégral des prix (ignoré ce que le client envoie), autorisations IDOR correctes sur les commandes, idempotence webhook robuste, résilience de l'estimation de livraison en cas de panne API externe, pattern atomique `updateMany` correctement appliqué pour le stock et les codes promo (juste oublié pour le cashback).

---

## 5. Autres pages (Dons, Partenariats, Carrières, Légal, Auth, Pricing, Investisseurs...)

### Vue d'ensemble
Niveau de finition visuelle homogène avec les pages principales, mais **deux formulaires de génération de leads intégralement cassés** et un **système de pages légales défaillant**.

### Constats fonctionnels
| Gravité | Fichier:ligne | Problème | Solution | Effort |
|---|---|---|---|---|
| 🔴 | `donations.ts:13-16` vs `Donations.tsx:150-167` | Désaccord de contrat frontend/backend (`donorName`/`country` attendus, `name`/`country_id` envoyés) → **formulaire de don 100% non fonctionnel**. | Aligner les noms de champs. | Rapide |
| 🔴 | `partnerships.ts:13-16` vs `Partnerships.tsx:157-167` | Même défaut → **formulaire "Devenir Partenaire" 100% cassé**. `partnership_type`/`budget`/`timeline` ne sont même pas des colonnes du modèle. | Aligner les champs, étendre le schéma Prisma si ces infos doivent être conservées. | Moyen |
| 🔴 | `legalPages.ts:6-9` vs `Privacy.tsx`/`Terms.tsx`/`Legal.tsx` | `GET /api/legal_pages` ignore ses query params, retourne toutes les pages triées par date → **les 3 pages légales affichent le même contenu** (la plus récente). Risque de conformité. | Filtrer par `slug`+`isActive` côté serveur. | Rapide |
| 🔴 | `server/src/index.ts:235` (`/api/upload` admin-only) vs `Careers.tsx:96` | L'upload de CV en candidature publique appelle une route admin-only → **échec systématique pour tout candidat réel**. | Créer une route d'upload publique dédiée, rate-limitée, avec la même validation magic-bytes. | Moyen |
| 🟠 | `donations.ts`/`partnerships.ts` (aucun `verifyRecaptcha`) | Contrairement à Contact/Démo/Newsletter, ces 2 formulaires n'ont aucune protection anti-spam. | Ajouter reCAPTCHA comme sur `demoRequests.ts`. | Rapide |
| 🟠 | `subscriptionService.ts:212-213` | `deleteMany` puis recréation systématique d'abonnement sans vérifier un historique d'essai déjà consommé → **essai gratuit réinitialisable à l'infini** (annuler puis se réabonner). | Ajouter un flag `hasUsedTrial` vérifié avant d'accorder un nouvel essai. | Moyen |
| 🟠 | `partnerships.ts:6-9` | `GET /api/partnerships` public, sans auth — fuite de PII (emails/téléphones de leads B2B). | Ajouter `authRequired, adminOnly`. | Trivial |
| 🟡 | `events.ts`/`careers.ts` (pas de filtre `isPublished`) | Contenu brouillon visible publiquement via API/lien direct. | Filtrer `isPublished: true` sur les routes GET publiques. | Rapide |
| 🟡 | `NewsletterForm.tsx` vs modèle `NewsletterSubscription` | Le formulaire collecte nom/pays/téléphone, jamais persistés (modèle n'a que l'email) — saisie utilisateur silencieusement jetée. | Étendre le modèle ou retirer les champs inutiles du formulaire. | Faible/Moyen |
| 🟡 | `Donations.tsx:45` | Case "newsletter" pré-cochée par défaut — non conforme RGPD (consentement doit être un acte positif). | Initialiser à `false`. | Trivial |
| 🟡 | `Donations.tsx` | Le CTA "Procéder au Paiement" ne déclenche en réalité aucun paiement (juste un enregistrement `pending`), contrairement à `Pricing.tsx` qui appelle bien Money Fusion. | Brancher un vrai flux de paiement ou reformuler clairement le CTA. | Moyen/Élevé |
| ⚪ | Aucune UI admin pour consulter les demandes de don/partenariat (routes CRUD existent, orphelines) | L'équipe n'a aucun moyen de traiter ces leads sans accès direct DB. | Ajouter des onglets admin dédiés (modèle : `AdminJobApplications.tsx`). | Moyen |

### Points positifs
reCAPTCHA bien implémenté et fail-closed sur Contact/Démo/Newsletter/Auth, upload admin avec validation magic-bytes robuste, flux d'authentification cohérent (anti-énumération sur "mot de passe oublié"), module Abonnements globalement bien conçu (factures PDF, notifications d'expiration d'essai), sanitisation DOMPurify cohérente.

---

## 6. Panneau Admin (architecture, navigation, permissions)

### Vue d'ensemble
Organisation en 7 groupes thématiques (~28 onglets) — gérable pour un accès admin complet. **Le problème central : le modèle de permissions par module n'est appliqué que côté cosmétique (affichage des onglets), jamais réellement côté backend.**

### Constats navigation/permissions
| Gravité | Fichier:ligne | Problème | Solution | Effort |
|---|---|---|---|---|
| 🔴 | `stats.ts:7,53,134` + `authRequired.ts:87-92` (`supervisorOnly`) | Ne vérifie que le rôle, jamais `allowedModules` → tout superviseur (quel que soit son périmètre) peut appeler `/api/stats` et récupérer CA, utilisateurs, candidatures avec PII. | Ajouter une vérification de module dans `supervisorOnly` ou un middleware dédié. | Moyen |
| 🔴 | ~25 routers d'écriture (`generic.ts`, `orders.ts`, `news.ts`, `seeds.ts`, `courses.ts`...) | Toutes exigent `adminOnly` strict — aucune ne vérifie `allowedModules` → un superviseur voit les formulaires dans l'UI mais **toute soumission retourne 403**. Le modèle de permission par module est fonctionnellement inopérant pour l'écriture. | Middleware générique `moduleAccess(moduleKey)` (admin OU supervisor+module), appliqué route par route. | Élevé |
| 🟠 | `AdminTasks.tsx` (accessible superviseur) vs `tasks.ts` (`adminOnly` partout) | Bug concret : un superviseur qui clique "Tâches" reçoit un écran d'erreur à chaque fois. | Restreindre la route frontend aux admins ou assouplir le backend. | Rapide |
| 🟠 | `AdminUserManagement.tsx:58-71` (`MODULES`, 12 clés) vs `Admin.tsx` (21 clés vérifiées) | 9 modules vérifiés côté code n'apparaissent jamais dans le formulaire d'attribution — impossible de les accorder via l'UI standard. | Synchroniser les deux listes (source unique partagée). | Faible |
| 🟡 | `AdminAccess.tsx:10,39,47` | Clé secrète codée en dur côté client, jamais relue nulle part — sécurité 100% théâtrale, texte affiché ("tentatives enregistrées") mensonger. | Supprimer la page ou retirer le texte trompeur. | Faible |
| 🟡 | `AdminRoute.tsx:27-43` | Le guard fait confiance à un `sessionStorage` client sans revalidation serveur immédiate pour le rendu de route. | Revalider silencieusement via l'API après affichage optimiste. | Faible/Moyen |

### Constats cohérence UX / technique
| Gravité | Constat | Solution | Effort |
|---|---|---|---|
| 🟠 | Bundle Admin ~1.5MB minifié : imports statiques de ~28 composants (dont react-quill ×10 usages, recharts) sans `React.lazy`/code-splitting par onglet. | `React.lazy` + `Suspense` par tab, `manualChunks` dédiés pour react-quill/recharts. | Moyen |
| 🟡 | Un seul composant sur ~28 utilise React Query ; tous les autres réimplémentent manuellement loading/erreur/toast. | Migrer progressivement vers react-query. | Moyen |
| 🟡 | `AdminTasks.tsx`/`Supervisor.tsx` utilisent `fetch()` brut au lieu du client API partagé. | Réécrire avec le client `api`. | Faible |
| ⚪ | `AdminContext`/`use-admin-cache.ts` : code mort, jamais utilisé nulle part (`useAdmin()` jamais appelé). | Supprimer. | Faible |
| ⚪ | Politique de mot de passe admin faible (6 caractères min, aucune complexité). | Renforcer pour les rôles à privilège. | Faible |

### Points positifs
Concept `role`+`allowedModules[]` cohérent en intention, cache TTL + priorité au rôle DB sur le JWT (anti-staleness), CRUD générique avec allowlist de tables et colonnes interdites documentées (décision de sécurité réfléchie et écrite), composant `FileUpload` bien partagé, `AdminDetailsDialog` générique réutilisable.

---

## 7. Module RAG (pipeline complet)

### Vue d'ensemble
Architecture modulaire propre (interfaces remplaçables), mais plusieurs défauts dégradent silencieusement la qualité des réponses de l'assistant IA.

### Constats retrieval / indexation
| Gravité | Fichier:ligne | Problème | Solution | Effort |
|---|---|---|---|---|
| 🔴 | `rag/config/index.ts:34` + `OllamaEmbedding.ts` | Seuil 0.7 incohérent avec l'absence de préfixes `search_query:`/`search_document:` requis par `nomic-embed-text` → scores structurellement plus bas, beaucoup de requêtes légitimes ne remontent **aucun résultat**. | Ajouter les préfixes, recalibrer le seuil (probablement 0.4-0.55). | Faible/Moyen |
| 🔴 | `KilimoKnowledgeAdapter.ts` vs `seeds.ts`/`courses.ts`/`news.ts` (DELETE) | Aucune purge des sources RAG orphelines : la suppression définitive d'une semence/cours/actualité n'appelle jamais `deleteSource` → **contenu supprimé reste indéfiniment cité par l'assistant** comme s'il existait encore. | Appeler `deleteSource` dans les 3 routes DELETE ; calculer un diff au sync périodique. | Faible/Moyen |
| 🟠 | `KnowledgeRetriever.ts:42-62` (`rerank`) | Ré-embedde requête ET chunks avec le même modèle/formule déjà calculée par pgvector → tri quasi identique, mais jusqu'à 21 appels HTTP séquentiels supplémentaires par message. | Supprimer ce rerank redondant. | Faible |
| 🟡 | `TextSplitter.ts:58-73` | Bug d'algorithme de chevauchement : chaque chunk du milieu est stocké/embeddé **deux fois**. | Revoir la logique de chevauchement (préfixe, pas ajout). | Moyen |
| 🟡 | `DocumentIndexer.ts` + `cron.ts` | Ré-indexation complète toutes les 6h, y compris contenu inchangé — pas de hash de contenu. | Ajouter un hash, ne ré-indexer que les sources modifiées. | Moyen |

### Constats robustesse
| Gravité | Fichier:ligne | Problème | Solution | Effort |
|---|---|---|---|---|
| 🟠 | `RagWorkflow.ts:97-105` + `chat.ts:297-303` | Le quota Free/Pro est décompté **avant** l'appel LLM ; si Ollama échoue, une réponse de secours est comptée comme un succès → l'utilisateur perd un crédit pour une non-réponse. | Ne décompter qu'après confirmation de génération réussie. | Faible/Moyen |
| 🟡 | `OllamaEmbedding.ts`, `RagWorkflow.ts` | Aucun timeout/`AbortSignal` sur les appels Ollama → connexions SSE qui peuvent rester ouvertes indéfiniment si Ollama est bloqué. | `AbortController` avec timeout 15-30s. | Faible |

### Constats UX assistant
| Gravité | Fichier:ligne | Problème | Solution | Effort |
|---|---|---|---|---|
| 🟠 | `Assistant.tsx` vs `chat.ts:314-322` | L'événement SSE `done` (sources, `usesProSources`) est envoyé par le serveur mais **jamais traité côté frontend** — travail déjà fait, jamais affiché. Le system prompt demande explicitement de citer les sources, mais l'utilisateur ne peut jamais les voir. | Traiter l'événement `done`, afficher les sources sous chaque réponse. | Faible/Moyen |
| 🟡 | `Assistant.tsx` | Un 429 (rate-limit) est traité comme une erreur générique de connexion. | Distinguer le cas 429 avec un message spécifique. | Faible |

### Points positifs
Architecture modulaire propre et testable, insertion SQL paramétrée (pas d'injection malgré `$executeRaw`), pool de concurrence pour les embeddings, indexation automatique par cron pour seeds/courses/news (contrairement à la crainte initiale), streaming SSE robuste côté frontend, modération de contenu basique avant tout appel LLM.

**Note** : la fonctionnalité "documents personnalisés" (offre Pro) n'a **aucune interface admin** — seule l'API brute (`/admin/documents`) existe, aucune page frontend ne la consomme. Fonctionnalité backend inatteignable sans appel API manuel.

---

## 8. Revue UX/UI transversale (toutes les pages)

### Vue d'ensemble
Design system shadcn/Tailwind cohérent et de bonne qualité visuelle sur les pages "vitrine" (Index, Seeds, Shop, ELearning), mais plusieurs incohérences structurelles traversent tout le site.

### Incohérences majeures
| Gravité | Constat | Détail | Solution | Effort |
|---|---|---|---|---|
| 🟠 | `index.css` redéfinit globalement `.text-sm`/`.text-xs`/`body{font-size:18px}` | Hack global hors du système de tokens déclaré, affecte silencieusement tous les composants shadcn (Badge, Button sm, Toast...). | Définir les tailles via les tokens Tailwind officiels. | Moyen |
| 🟠 | Deux systèmes de SEO concurrents : `TitleManager` (manipulation DOM directe, 26 pages) vs `SEO.tsx` (react-helmet-async, 3 pages seulement) | Deux mécaniques qui écrivent dans `&lt;head&gt;` par des voies différentes — dette et confusion. | Généraliser un seul composant (`SEO.tsx`), supprimer `TitleManager`. | Élevé |
| 🟠 | 16 pages sans aucune gestion de titre/meta (`Cart`, `Checkout`, `Pricing`, `Careers`, `Demo`, `NotFound`...) | Pages de conversion à fort enjeu sans `&lt;title&gt;` personnalisé ni OG. | Ajouter SEO au minimum sur Pricing/Careers/Demo. | Faible |
| 🔴 | i18n réel sur ~10 pages/44 seulement, alors que le sélecteur propose 9 langues | Un utilisateur changeant de langue reste en français sur Boutique/Panier/Paiement/Légal/RGPD/Candidatures. | Documenter le périmètre réel ou étendre `t()` en priorité sur le tunnel d'achat. | Élevé (à planifier) |
| 🟠 | Arabe proposé sans aucune gestion RTL (`dir="rtl"` jamais posé nulle part) | Layout illisible logiquement pour un locuteur arabophone. | `document.documentElement.dir` dynamique + classes logiques `ms-`/`me-`. | Élevé |
| 🔴 | `NotFound.tsx` totalement hors charte | Couleurs Tailwind brutes (`bg-gray-100`, `text-blue-500`), aucun Header/Footer, texte **en anglais** sur un site français. | Reconstruire avec les tokens du design system, en français, avec navigation. | Faible |
| 🟡 | 5 patterns de chargement différents pour une même situation (liste de produits) | `Loader2` brut, `RefreshCw` brut, spinner CSS fait main, `LoadingSpinner`, `Skeleton` — selon la page. | Standardiser : `Skeleton` pour listes, `LoadingSpinner` pour fiches/pages pleines. | Moyen |
| 🟡 | Composant `Breadcrumb` (shadcn) : 0 import dans tout le code | Chaque page réinvente son fil d'Ariane avec accessibilité différente (nav+aria-label vs div brute vs absent). | Généraliser le composant partagé. | Moyen |
| 🟠 | Formulaires "marketing" (Contact, Partenariats, Dons, Démo, Carrières) sans validation inline par champ | Contrairement à Auth/ResetPassword (react-hook-form+zod+FormMessage), erreurs uniquement via toast générique. | Migrer vers le pattern déjà existant côté Auth. | Élevé |
| 🟡 | reCAPTCHA incohérent entre formulaires publics équivalents | Présent sur Auth/Contact/Démo, absent sur Partenariats/Dons/Carrières (recoupe le constat du §5). | Généraliser. | Moyen |
| 🟡 | `Demo.tsx` : contenu placeholder explicite en production | "(Vidéo de démonstration serait intégrée ici)" affiché littéralement sur le CTA principal de la page. | Intégrer une vraie vidéo ou retirer le bouton. | Moyen |

### Accessibilité transversale (patterns récurrents, pas des cas isolés)
- `alt`/`aria-label` concentrés sur ~9 pages, quasi absents ailleurs (Partnerships, Donations, AgriConsulting, Careers, Demo, Cart, Checkout, Legal, Cookies).
- Boutons `+`/`-` de quantité (Cart/Checkout) sans `aria-label` ni focus visible.
- Liens Footer "Solutions" (6 liens) = `href="#"` factices — piège clavier/lecteur d'écran.
- Formulaires hors Auth sans `aria-describedby` liant erreur et champ.

### Pages en retard de finition
`NotFound.tsx` (cas le plus grave), `Investors.tsx` (contenu minimal, pas de CTA fonctionnel réel), `Demo.tsx` (placeholder visible), `Legal.tsx`/`Careers.tsx` (état de chargement qui masque tout le Header/Footer, délai artificiel non justifié sur Careers).

### Points positifs forts
`NewsDetail.tsx` est la page la plus aboutie en accessibilité (référence à généraliser) ; `ELearning.tsx` a le meilleur système de filtres annotés ; DOMPurify systématique sur tout contenu riche ; tokens de couleur HSL propres avec variantes dark mode complètes ; `CardSkeletons.tsx` est un bon modèle de skeleton accessible, sous-utilisé ailleurs.

---

## 9. Synthèse et priorisation globale

### P0 — Bloquants business/légaux (à corriger avant toute annonce publique)
1. Panier : ajouter `productType` (Seeds §2) — les semences sont actuellement invendables correctement.
2. Paywall e-learning : authentifier `GET /course/:courseId/modules`, ne jamais exposer `correctAnswer` (E-learning §3).
3. Formulaires Dons et Partenariats : aligner les contrats frontend/backend (Autres pages §5).
4. Pages légales : filtrer par slug (Autres pages §5) — risque de conformité direct.
5. Upload CV candidature : route publique dédiée (Autres pages §5).
6. Bug cashback : ne jamais payer plein tarif après débit du solde (Boutique §4).
7. CSRF sur `use-cashback` et `PUT /orders/:id` admin (Boutique §4).
8. XSS stocké dans les exports PDF admin certificats/présences (E-learning §3).

### P1 — Sécurité/robustesse à traiter rapidement
- Modèle de permissions admin : réconcilier `allowedModules` frontend/backend ou assumer une UI honnête (Admin §6).
- `/api/stats` : filtrer par module pour les superviseurs (Admin §6).
- `AdminDeliveries.tsx` : réécrire avec le client API partagé (probablement non fonctionnel en prod) (Boutique §4).
- try/catch sur toutes les écritures news/events (risque de crash serveur) (Actualités §1).
- CSRF généralisé sur toutes les routes mutantes restantes (recoupe Actualités + Boutique).
- RAG : préfixes d'embedding + recalibrage du seuil, purge des contenus supprimés (RAG §7).
- Filtrage `isPublished` manquant sur seeds/careers/events (Semences §2, Autres pages §5).

### P2 — Qualité produit et UX
- Unifier le système SEO (un seul composant), corriger `NotFound.tsx`, standardiser les états de chargement.
- Brancher l'affichage des sources RAG côté assistant (fonctionnalité déjà développée serveur, jamais consommée).
- Code-splitting du bundle Admin (1.5MB).
- Décider du périmètre i18n réel et le documenter/étendre progressivement en priorisant le tunnel d'achat.
- Statut de DeerFlow : soit provisionner réellement le service, soit retirer la documentation qui laisse croire à une fonctionnalité active.

### P3 — Dette et nettoyage
- Supprimer le code mort (`AdminContext`, `RateLimitHandler`, `PartnershipForm.tsx` vide, `AdminAccess.tsx` théâtral).
- Fusionner/discriminer `Seed`/`ShopProduct` à moyen terme.
- Généraliser `react-hook-form`+`zod` aux formulaires marketing restants.

---

## Note de transparence
Un des agents d'analyse a, par erreur, publié un fichier préexistant du dépôt (`rapport.md`, un ancien document d'audit non lié à cette tâche) en tant qu'artefact — action non demandée. Les artefacts sont privés par défaut et le contenu n'est ni sensible ni nouveau (c'était déjà un fichier du projet), mais il est signalé ici par souci de transparence complète.
