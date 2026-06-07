import { CSSProperties } from "react";

interface AdaptiveImageProps {
  /** Source AVIF (généré via ?format=avif) */
  avifSrc?: string;
  /** Source WebP (généré via ?format=webp) */
  webpSrc?: string;
  /** Source fallback (JPEG/PNG d'origine) */
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
  decoding?: "sync" | "async" | "auto";
  width?: number;
  height?: number;
  sizes?: string;
}

/**
 * <picture> avec sources AVIF/WebP générées par vite-imagetools.
 * Améliore le LCP : navigateurs modernes téléchargent l'AVIF (~50% plus léger).
 */
export default function AdaptiveImage({
  avifSrc,
  webpSrc,
  src,
  alt,
  className,
  style,
  loading = "lazy",
  fetchPriority = "auto",
  decoding = "async",
  width,
  height,
  sizes,
}: AdaptiveImageProps) {
  return (
    <picture>
      {avifSrc && <source type="image/avif" srcSet={avifSrc} sizes={sizes} />}
      {webpSrc && <source type="image/webp" srcSet={webpSrc} sizes={sizes} />}
      <img
        src={src}
        alt={alt}
        className={className}
        style={style}
        loading={loading}
        // @ts-expect-error fetchpriority is valid HTML
        fetchpriority={fetchPriority}
        decoding={decoding}
        width={width}
        height={height}
      />
    </picture>
  );
}