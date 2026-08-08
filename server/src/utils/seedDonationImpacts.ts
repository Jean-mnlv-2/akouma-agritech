import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

// Projets internes (hors partenaires comme Ekolo) éligibles au soutien via
// le module de dons — reliés aux cartes de la section "Nos Solutions
// Innovantes" par leur slug (voir Services.tsx, bouton "Soutenir ce
// projet"). targetAmount déclenche le calcul automatique de la progression
// depuis les dons confirmés (voir donationImpacts.ts) ; les montants ci-
// dessous sont des objectifs de départ, modifiables depuis l'admin.
export async function ensureDefaultDonationImpacts(prisma: PrismaClient): Promise<void> {
  try {
    const defaultImpacts = [
      {
        slug: 'irrigation-autonome',
        title: 'Irrigation Autonome & Intelligente',
        description: "Financer le déploiement d'un système d'irrigation piloté par capteurs, qui déclenche l'arrosage au bon moment sans intervention humaine.",
        icon: '💧',
        targetAmount: 8000,
        order: 0,
        isActive: true,
      },
      {
        slug: 'gura',
        title: "GURA — Annotation d'Images IA",
        description: 'Soutenir le développement de GURA, notre outil interne d\'annotation d\'images pour entraîner des modèles de vision par ordinateur agricole.',
        icon: '🖼️',
        targetAmount: 6000,
        order: 1,
        isActive: true,
      },
      {
        slug: 'diagnostic-ia',
        title: 'Diagnostic des Maladies par IA',
        description: 'Contribuer à une application qui identifie les maladies des plantes à partir d\'une photo et recommande le traitement phytosanitaire adapté.',
        icon: '🔬',
        targetAmount: 10000,
        order: 2,
        isActive: true,
      },
    ];

    for (const impact of defaultImpacts) {
      const existing = await prisma.donationImpact.findUnique({ where: { slug: impact.slug } });
      if (!existing) {
        await prisma.donationImpact.create({ data: impact });
        logger.info(`[donation-impacts] Created project: ${impact.slug}`);
      }
      // Une fois créé, le contenu (titre, description, cible...) devient
      // éditable depuis l'admin — on ne l'écrase pas à chaque démarrage,
      // sinon les ajustements manuels de l'admin seraient perdus.
    }
  } catch (error) {
    logger.error('[donation-impacts] Failed to ensure default projects', error);
  }
}
