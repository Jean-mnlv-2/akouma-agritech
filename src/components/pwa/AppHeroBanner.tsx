interface AppHeroBannerProps {
  image: string;
  title: string;
  subtitle?: string;
}

/**
 * Bandeau hero compact (image + accroche) réutilisé en tête de chaque page
 * standalone — même format que celui de l'accueil, pour une identité visuelle
 * cohérente d'une page à l'autre sans reproduire un vrai hero desktop (85vh).
 */
export function AppHeroBanner({ image, title, subtitle }: AppHeroBannerProps) {
  return (
    <div className="px-4 pt-4">
      <div className="relative h-28 rounded-3xl overflow-hidden">
        <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" loading="eager" />
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
