import { useEffect, useState } from "react";

// Doit matcher le breakpoint `lg` de Tailwind (voir tailwind.config.ts) —
// au-delà, même une PWA installée doit se comporter comme le site desktop.
const MOBILE_BREAKPOINT_PX = 1024;

function detectStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return false;
  // display-mode: standalone couvre Android/desktop PWA installées et iOS
  // (Safari le supporte depuis l'ajout à l'écran d'accueil) ; navigator.standalone
  // reste le fallback historique pour les anciennes versions d'iOS Safari.
  const mediaMatch = window.matchMedia?.("(display-mode: standalone)").matches ?? false;
  const iosLegacy = (window.navigator as any).standalone === true;
  return mediaMatch || iosLegacy;
}

function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < MOBILE_BREAKPOINT_PX;
}

/**
 * true uniquement quand le site tourne en PWA installée (plein écran, sans
 * chrome navigateur) **et** sur un écran de taille mobile/tablette. Une PWA
 * installée sur ordinateur (Chrome/Edge le permettent) ou une fenêtre
 * standalone agrandie doit retomber sur l'expérience site web classique —
 * la nav basse app-like n'a de sens que sur petit écran.
 */
export function useStandalonePwa(): boolean {
  const [isStandalone, setIsStandalone] = useState(
    () => detectStandaloneDisplayMode() && isMobileViewport()
  );

  useEffect(() => {
    const update = () => setIsStandalone(detectStandaloneDisplayMode() && isMobileViewport());

    const mql = window.matchMedia("(display-mode: standalone)");
    mql.addEventListener?.("change", update);
    window.addEventListener("resize", update);

    return () => {
      mql.removeEventListener?.("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return isStandalone;
}
