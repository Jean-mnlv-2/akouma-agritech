import { ReactNode } from "react";

interface StickyActionBarProps {
  children: ReactNode;
}

/**
 * Barre d'action collante juste au-dessus de la nav basse standalone
 * (h-16 + safe-area) — utilisée par les fiches détail (cours, semence,
 * produit) pour garder le CTA principal (prix + action) toujours visible.
 */
export function StickyActionBar({ children }: StickyActionBarProps) {
  return (
    <div
      className="fixed inset-x-0 z-40 bg-background/95 backdrop-blur-lg border-t border-border/60 px-4 py-3 flex items-center gap-3"
      style={{ bottom: "calc(4rem + env(safe-area-inset-bottom))" }}
    >
      {children}
    </div>
  );
}

export default StickyActionBar;
