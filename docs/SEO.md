# SEO / GEO / Accessibilité – Guide KILIMO

## 1. Architecture en place

| Couche | Implémentation | Fichier |
|--------|----------------|---------|
| Head statique (fallback crawlers sans JS) | Title, description, canonical, OG, Twitter, JSON-LD Organization + WebSite (SearchAction) | `index.html` |
| Head dynamique par page | `TitleManager` (DOM) + composant `SEO` (Helmet, optionnel) | `src/components/TitleManager.tsx`, `src/components/SEO.tsx` |
| Schemas JSON-LD réutilisables | `schema.organization / website / breadcrumbs / product / course / article / event / faq` | `src/components/SEO.tsx` |
| Sitemap dynamique | Génère `public/sitemap.xml` depuis l'API (courses, seeds, products, news, events) avec fallback statique | `scripts/generate-sitemap.ts` (hooks `predev` / `prebuild`) |
| Robots | `Allow: /` + référence sitemap | `public/robots.txt` |
| llms.txt (GEO / IA Search) | Spec llmstxt.org : H1 + résumé + sections Pages / Catalogue / Contenu / Optional | `public/llms.txt` |

## 2. Connecter Google Search Console

1. Aller sur https://search.google.com/search-console et **Ajouter une propriété** → *Préfixe d'URL* → `https://kilimo-agritech.lovable.app`.
2. Choisir **Balise HTML**. Copier la valeur `content="..."`.
3. Ouvrir `index.html` et ajouter dans `<head>` (avant ou après le bloc Open Graph) :
   ```html
   <meta name="google-site-verification" content="VOTRE_TOKEN_ICI" />
   ```
4. Publier (Update). Revenir sur Search Console et cliquer **Valider**.
5. Sitemaps → soumettre `https://kilimo-agritech.lovable.app/sitemap.xml`.

Variante automatisée via le connecteur Google Search Console : voir la knowledge `google_search_console` (méthode `META` → vérification API).

## 3. Données structurées

Utiliser le composant `SEO` avec les helpers `schema.*` sur chaque page :

```tsx
import { SEO, schema } from "@/components/SEO";

<SEO
  title="Formation Agriculture Durable"
  description="..."
  path={`/elearning/${course.slug}`}
  image={course.thumbnailUrl}
  type="article"
  jsonLd={[
    schema.course({ name: course.title, slug: course.slug, image: course.thumbnailUrl }),
    schema.breadcrumbs([
      { name: "Accueil", path: "/" },
      { name: "E-learning", path: "/elearning" },
      { name: course.title, path: `/elearning/${course.slug}` },
    ]),
  ]}
/>
```

## 4. Open Graph côté serveur

Vite + react-router est 100% client. Pour des aperçus parfaits sur LinkedIn / Slack / Discord (qui n'exécutent pas JS), 2 options :

- **Court terme (en place)** : `index.html` ship des OG/Twitter génériques → tous les crawlers voient au minimum un aperçu KILIMO. Les Helmet/TitleManager surchargent pour les crawlers JS (Google).
- **Long terme** : migrer vers une stack SSR (Next.js, TanStack Start, ou un mini-prerender via `vite-plugin-prerender-spa`) pour avoir un OG par URL côté serveur. À planifier si les partages sociaux deviennent un canal majeur.

## 5. Performance — checklist appliquée / à faire

- [x] Splash screen inline (évite flash de blanc)
- [x] `<link rel="icon">` + manifest PWA
- [ ] Préchargement de l'image LCP (à ajouter dans `index.html` : `<link rel="preload" as="image" href="/hero.webp" fetchpriority="high" />` quand le hero définitif est figé)
- [ ] Convertir hero JPG/PNG → AVIF/WebP (`vite-imagetools`)
- [ ] Code-splitting par route (déjà partiellement via React Router)
- [ ] Cache HTTP (Cache-Control immutable sur `/assets/*`) — à configurer côté Render/Nginx

## 6. Accessibilité — checklist

- [x] `<html lang="fr">`
- [x] shadcn primitives (Radix) → ARIA correct par défaut
- [ ] Audit `alt` génériques (`alt="Aperçu"`, `alt="Banner"`) — chercher avec `rg 'alt="(Aperçu|Banner|Image|Photo|Publicité)"' src/` puis remplacer par un texte descriptif lié au contenu
- [ ] Audit hiérarchie de titres — viser H1 unique + H2 par section sur chaque page
- [ ] Boutons icon-only → toujours fournir `aria-label`

## 7. GEO — Optimisation IA Search

- `public/llms.txt` suit la spec llmstxt.org : ChatGPT, Perplexity, Claude le lisent en priorité.
- Pour des contenus longs (catalogue complet, FAQ), générer aussi `public/llms-full.txt` (mêmes sections, descriptions étendues). Pas obligatoire — à ajouter quand le contenu éditorial est stable.
- Les schemas `Course`, `Product`, `NewsArticle`, `FAQPage` sont les signaux les plus utilisés par Google AI Overviews et Perplexity → les appliquer systématiquement sur les pages de détail.