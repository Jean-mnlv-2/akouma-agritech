import { useQuery } from "@tanstack/react-query";
import { api } from "@/integrations/api/client";

export interface ElearningStat {
  id: number;
  label: string;
  value: string;
  icon: string | null;
}

/**
 * Statistiques de la page E-Learning gérées par l'admin (GET /api/elearning_stats,
 * public, CRUD dans AdminElearningStats.tsx). Cette route existait déjà mais
 * n'était consommée nulle part côté vitrine — la page affichait des chiffres
 * codés en dur à la place. Quand l'admin n'a rien configuré, l'appelant doit
 * se rabattre sur des données réelles calculées (usePublicStats), jamais sur
 * un chiffre inventé.
 */
export function useElearningStats() {
  return useQuery<ElearningStat[]>({
    queryKey: ["elearning-stats"],
    queryFn: async () => {
      const res = await api.request("GET", "/api/elearning_stats");
      return Array.isArray(res) ? res : [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
