import { useState } from "react";

interface ProductImageGalleryProps {
  images: string[];
  alt: string;
}

/**
 * Grande image + bande de miniatures défilable — remplace la grille 4
 * colonnes fixe des fiches produit desktop, inadaptée à un écran de 360-420px.
 */
export function ProductImageGallery({ images, alt }: ProductImageGalleryProps) {
  const [selected, setSelected] = useState(0);
  const active = images[selected] || images[0];

  return (
    <div>
      <div className="aspect-square bg-muted/30 flex items-center justify-center">
        <img src={active} alt={alt} className="w-full h-full object-contain p-4" />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-3 hide-scrollbar">
          {images.map((img, idx) => (
            <button
              key={`${img}-${idx}`}
              type="button"
              onClick={() => setSelected(idx)}
              className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 flex items-center justify-center bg-muted/30 ${
                selected === idx ? "border-primary" : "border-transparent"
              }`}
            >
              <img src={img} alt={`${alt} ${idx + 1}`} className="w-full h-full object-contain p-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductImageGallery;
