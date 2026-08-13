import { useState } from "react";
import { useStandalonePwa } from "./use-standalone-pwa";

const STORAGE_KEY = "kilimo_pwa_onboarding_done_v1";

/**
 * Contrôle l'affichage de l'onboarding plein écran de l'app PWA : une seule
 * fois par installation, uniquement en mode standalone (jamais sur le site
 * mobile classique où l'utilisateur navigue déjà librement).
 */
export function usePwaOnboarding() {
  const isStandalone = useStandalonePwa();
  const [done, setDone] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return true;
    }
  });

  const complete = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Stockage indisponible (mode privé...) — on masque quand même pour
      // la session en cours, tant pis pour la persistance.
    }
    setDone(true);
  };

  return { show: isStandalone && !done, complete };
}
