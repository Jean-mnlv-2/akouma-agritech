import PageHeaderCarousel from "@/components/PageHeaderCarousel";

interface AppHeroBannerProps {
  image: string;
  title: string;
  subtitle?: string;
  /**
   * Clé Admin > Images d'en-tête (ex: "home", "about", "news",
   * "elearning"). Quand fournie, le fond devient le même carrousel
   * défilant que la version desktop de la page — les visuels configurés
   * par l'admin s'enchaînent automatiquement au lieu d'une image figée.
   * `image` reste utilisée comme repli tant qu'aucune image n'est
   * configurée pour cette page (zéro régression).
   */
  pageKey?: string;
}

/**
 * Bandeau hero compact (image + accroche) réutilisé en tête de chaque page
 * standalone — même format que celui de l'accueil, pour une identité visuelle
 * cohérente d'une page à l'autre sans reproduire un vrai hero desktop (85vh).
 */
export function AppHeroBanner({ image, title, subtitle, pageKey }: AppHeroBannerProps) {
  return (
    <div className="px-4 pt-4">
      <div className="relative h-28 rounded-3xl overflow-hidden">
        {pageKey ? (
          <PageHeaderCarousel
            pageKey={pageKey}
            fallbackImage={image}
            fallbackAlt={title}
            intervalMs={5000}
            hideDots
          />
        ) : (
          <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" loading="eager" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10" />
        <div className="absolute inset-0 flex flex-col justify-end p-3.5">
          <h1 className="text-white text-base font-bold leading-tight mb-0.5">{title}</h1>
          {subtitle && <p className="text-white/80 text-xs line-clamp-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

export default AppHeroBanner;
