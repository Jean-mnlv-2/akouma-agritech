import { useEffect, useState } from "react";

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  // display-mode: standalone couvre Android/desktop PWA installées et iOS
  // (Safari le supporte depuis l'ajout à l'écran d'accueil) ; navigator.standalone
  // reste le fallback historique pour les anciennes versions d'iOS Safari.
  const mediaMatch = window.matchMedia?.("(display-mode: standalone)").matches ?? false;
  const iosLegacy = (window.navigator as any).standalone === true;
  return mediaMatch || iosLegacy;
}

/**
 * true uniquement quand le site tourne en PWA installée (plein écran, sans
 * chrome navigateur) — false pour un onglet de navigateur mobile classique,
 * même sur petit écran. Sert à réserver la nav basse app-like au mode
 * installé, sans changer l'expérience navigateur existante.
 */
export function useStandalonePwa(): boolean {
  const [isStandalone, setIsStandalone] = useState(detectStandalone);

  useEffect(() => {
    const mql = window.matchMedia("(display-mode: standalone)");
    const update = () => setIsStandalone(detectStandalone());
    mql.addEventListener?.("change", update);
    return () => mql.removeEventListener?.("change", update);
  }, []);

  return isStandalone;
}
