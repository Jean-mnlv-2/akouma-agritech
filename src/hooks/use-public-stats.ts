import { useQuery } from "@tanstack/react-query";
import { api } from "@/integrations/api/client";

export interface PublicStats {
  totalCourses: number;
  totalSeeds: number;
  totalNews: number;
  totalLearners: number;
  totalCertificates: number;
  totalDonors: number;
  totalDonated: number;
  totalConfirmedDonations: number;
  totalDonationImpacts: number;
}

/**
 * Compteurs publics réels (GET /api/stats/public), partagés via react-query
 * entre toutes les sections qui affichent des "chiffres clés" (Hero,
 * StatsSection, ELearning) — une seule requête réseau, jamais de chiffre
 * marketing codé en dur qui ne correspond à rien de réel.
 */
export function usePublicStats() {
  return useQuery<PublicStats>({
    queryKey: ["public-stats"],
    queryFn: async () => {
      const res = await api.request("GET", "/api/stats/public");
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
