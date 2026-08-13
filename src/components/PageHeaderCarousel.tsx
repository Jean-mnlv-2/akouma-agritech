import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageHeaderImages, type PageHeaderImage } from '@/hooks/use-page-header-images';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Props {
  pageKey: string;
  fallbackImage: string;
  fallbackImageAvif?: string;
  fallbackImageWebp?: string;
  fallbackAlt?: string;
  className?: string;
  intervalMs?: number;
  overlayClassName?: string;
  children?: React.ReactNode;
  showOverlayContent?: boolean;
  itemsOverride?: PageHeaderImage[];
  /** Champs à surligner (pour mode comparaison admin). */
  highlightFields?: string[];
  /** Masque les puces de pagination (bandeaux compacts type app PWA, trop
   *  petits pour les accueillir sans chevaucher le texte). */
  hideDots?: boolean;
}

/**
 * Carrousel d'images d'en-tête piloté par l'admin via /api/page_header_images.
 * - Si aucune image configurée → utilise `fallbackImage` (zéro régression).
 * - Si 1 image → affichage statique.
 * - Si 2+ → fondu enchaîné automatique.
 */
export default function PageHeaderCarousel({
  pageKey,
  fallbackImage,
  fallbackImageAvif,
  fallbackImageWebp,
  fallbackAlt = '',
  className,
  intervalMs = 6000,
  overlayClassName = 'absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-primary/30',
  children,
  showOverlayContent = false,
  itemsOverride,
  highlightFields = [],
  hideDots = false,
}: Props) {
  const { data: images = [] } = usePageHeaderImages(itemsOverride ? '' : pageKey);
  const source = itemsOverride ?? images;

  const [index, setIndex] = useState(0);
  // Une image admin dont l'URL est cassée (ex: mauvaise config API_PUBLIC_URL
  // lors d'un upload) ne doit pas casser silencieusement le header — on
  // l'exclut du carrousel dès qu'elle échoue à charger et on retombe sur
  // fallbackImage si plus aucune ne reste valide.
  const [brokenIds, setBrokenIds] = useState<Set<number>>(new Set());
  const markBroken = (id: number) => setBrokenIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));

  const usableSource = source.filter((s) => !brokenIds.has(s.id));
  const slides: PageHeaderImage[] = usableSource.length > 0
    ? usableSource
    : [{ id: 0, pageKey, imageUrl: fallbackImage, altText: fallbackAlt, order: 0, isActive: true } as PageHeaderImage];

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, Math.max(2000, intervalMs));
    return () => window.clearInterval(id);
  }, [slides.length, intervalMs]);

  // reset on key change
  useEffect(() => { setIndex(0); }, [pageKey, slides.length]);

  const current = slides[index];
  const isExternal = (url?: string | null) => !!url && /^https?:\/\//i.test(url);

  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)} aria-hidden={children ? undefined : true}>
      {slides.map((s, i) => {
        const isFirst = i === 0;
        const useAdaptive = isFirst && usableSource.length === 0 && (fallbackImageAvif || fallbackImageWebp);
        const imgEl = (
          <img
            src={s.imageUrl}
            alt={s.altText || fallbackAlt}
            loading={isFirst ? 'eager' : 'lazy'}
            fetchPriority={isFirst ? 'high' : 'auto'}
            decoding="async"
            onError={() => { if (s.id) markBroken(s.id); }}
            className={cn(
              'absolute inset-0 w-full h-full object-cover transition-opacity duration-[1200ms] ease-in-out scale-105',
              i === index ? 'opacity-100' : 'opacity-0'
            )}
          />
        );
        if (useAdaptive) {
          return (
            <picture key={s.id ?? i}>
              {fallbackImageAvif && <source type="image/avif" srcSet={fallbackImageAvif} />}
              {fallbackImageWebp && <source type="image/webp" srcSet={fallbackImageWebp} />}
              {imgEl}
            </picture>
          );
        }
        return <span key={s.id ?? i}>{imgEl}</span>;
      })}
      <div className={overlayClassName} />
      {showOverlayContent && current && (current.title || current.subtitle || current.ctaLabel) && (
        <div className="absolute inset-0 z-[5] flex items-center justify-center pointer-events-none">
          <div className="container mx-auto px-6 text-center text-white pointer-events-auto">
            {current.title && (
              <h2 className={cn(
                "text-3xl md:text-5xl font-bold mb-3 drop-shadow-lg",
                highlightFields.includes('title') && "ring-4 ring-yellow-400/60 rounded-lg px-2 py-1"
              )}>{current.title}</h2>
            )}
            {current.subtitle && (
              <p className={cn(
                "text-base md:text-xl text-white/90 max-w-2xl mx-auto mb-5 drop-shadow",
                highlightFields.includes('subtitle') && "ring-4 ring-yellow-400/60 rounded-lg px-2 py-1"
              )}>{current.subtitle}</p>
            )}
            {current.ctaLabel && current.ctaUrl && (
              <div className={cn(
                highlightFields.includes('ctaLabel') || highlightFields.includes('ctaUrl')
                  ? "ring-4 ring-yellow-400/60 rounded-lg p-1 inline-block"
                  : ""
              )}>
                {isExternal(current.ctaUrl) ? (
                  <a href={current.ctaUrl} target="_blank" rel="noreferrer">
                    <Button size="lg" variant="nature">{current.ctaLabel}</Button>
                  </a>
                ) : (
                  <Link to={current.ctaUrl}>
                    <Button size="lg" variant="nature">{current.ctaLabel}</Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {slides.length > 1 && !hideDots && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === index ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
              )}
            />
          ))}
        </div>
      )}
      {children}
    </div>
  );
}