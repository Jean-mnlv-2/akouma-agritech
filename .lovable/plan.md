# Plan — Perf/SEO/A11y + Refonte LMS E-Learning

Cette demande regroupe ~4 chantiers majeurs. Je propose un plan séquencé et te demande confirmation avant d'exécuter (le périmètre est très large, plusieurs jours de travail dans une seule itération).

## Chantier 1 — Performance LCP (images hero)

- Convertir les images hero principales (`Hero.tsx`, `PageHeaderCarousel`) en **AVIF + WebP** via `vite-imagetools` (plugin déjà compatible Vite 5).
- Ajouter `<link rel="preload" as="image" fetchpriority="high">` dans `index.html` pour l'image LCP de la home.
- `<picture>` avec sources AVIF/WebP/fallback + `loading="eager"` + `fetchpriority="high"` sur le hero ; `loading="lazy"` + `decoding="async"` partout ailleurs.
- Ajouter `width`/`height` explicites pour éviter le CLS.

## Chantier 2 — SEO structuré + hiérarchie titres + alt

- **JSON-LD dynamique** via le composant `<SEO />` existant sur :
  - `CourseDetail` → `Course` + `BreadcrumbList` + `FAQPage` (si FAQ présente)
  - `ProductDetail` → `Product` + `BreadcrumbList`
  - `SeedDetail` → `Product` + `BreadcrumbList`
  - `NewsDetail` → `NewsArticle` + `BreadcrumbList`
  - `EventDetail` → `Event` + `BreadcrumbList`
- **Audit H1/H2/H3** : script `rg` pour lister tous les `<h1>`, garantir 1 seul H1/page (Home, Shop, Seeds, News, About, ELearning, CourseDetail, etc.) et corriger les sauts (H1→H3).
- **Alt génériques** : recherche globale `alt="Aperçu|Banner|Image|Photo|Publicité|preview|banner"` et remplacement par alt descriptifs basés sur le contexte (titre produit, titre cours, etc.).

## Chantier 3 — Refonte complète E-Learning (LMS)

Audit préalable des modèles Prisma & APIs (`courses`, `courseModules`, `courseLessons`, `elearningEnrollments`, `certificates`, `coursePreviewItems`, quiz) pour ne consommer que des champs réels.

### 3.1 Catalogue (`ELearning.tsx` refactor complet)
Nouvelle UI marketplace : carte avec cover, badge gratuit/payant, niveau, durée, **#modules**, **#leçons**, progression si inscrit, note. Recherche + filtres catégorie/niveau/prix + tri + pagination, état vide pro, skeletons.

### 3.2 Page détail (`CourseDetail.tsx` refactor)
Hero riche + sections : "Ce que vous apprendrez", **Programme** (accordéon modules→leçons via `/api/course-modules`), Prérequis, Public cible, Certification (Sertifier), Formations similaires (même catégorie).

### 3.3 Inscription
- Non connecté → CTA "Connexion / Créer un compte" avec `returnTo`.
- Connecté → **plus de formulaire avec nom/email/téléphone/pays** (déjà dans profil). N'afficher que les champs spécifiques formation si présents en backend (objectif, organisation, acceptation CGU) — sinon inscription en 1 clic.

### 3.4 Dashboard apprenant (`LearningDashboard.tsx` / `MyCourses.tsx`)
Espace apprenant complet : Mes formations + progression, Continuer (dernière leçon), Certifications, Recommandations, Stats (formations terminées, heures, certificats).

### 3.5 Lecture (`CourseLearn.tsx`)
Sidebar gauche modules/leçons avec progression, contenu principal (vidéo/markdown/ressources/quiz), barre de progression globale, nav prev/next, autosave progression.

### 3.6 Certificats
Section dédiée avec liste Sertifier (date, formation, téléchargement, lien vérification).

### 3.7 Design system + perf
Skeletons, états vides, badges cohérents ; **React Query** ajouté si absent pour cache + dédup ; `React.lazy` sur pages lourdes ; mémoïsation des cartes.

## Question

Vu l'ampleur (15+ fichiers refactorisés, 5+ créés, audit backend), veux-tu :

1. **Tout en une seule passe** (long, risque plus élevé de régressions, je devrai itérer ensuite sur les bugs)
2. **Découpé en 3 livraisons** que tu valides l'une après l'autre :
   - L1 : Perf LCP + JSON-LD + H1/alt (rapide, faible risque)
   - L2 : Refonte E-Learning catalogue + détail + inscription
   - L3 : Dashboard apprenant + lecture cours + certificats + perf

Je recommande l'option **2** pour qualité et stabilité. Confirme l'option choisie et je démarre.
