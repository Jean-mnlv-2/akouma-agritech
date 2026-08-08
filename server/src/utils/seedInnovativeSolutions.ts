import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

// Cartes par défaut de la section "Nos Solutions Innovantes" (page
// d'accueil) — `icon` doit correspondre à un nom d'icône Lucide connu du
// mapping frontend (voir ICONS dans Services.tsx), sinon une icône de repli
// est utilisée. Chaque slug correspond à la cause de financement du même
// slug créée par ensureDefaultDonationImpacts, exécuté juste avant.
export async function ensureDefaultInnovativeSolutions(prisma: PrismaClient): Promise<void> {
  try {
    const defaultSolutions = [
      {
        slug: 'irrigation-autonome',
        title: 'Irrigation Autonome & Intelligente',
        description: "Un système d'irrigation piloté par capteurs qui déclenche l'arrosage au bon moment, sans intervention humaine.",
        icon: 'Droplets',
        features: [
          "Déclenchement automatique selon l'humidité du sol",
          'Programmation par zones et par culture',
          "Économies d'eau mesurables",
          'Alertes et suivi à distance',
        ],
        order: 0,
        isActive: true,
      },
      {
        slug: 'gura',
        title: "GURA — Annotation d'Images IA",
        description: "Notre outil d'annotation d'images pour entraîner des modèles de vision par ordinateur agricole.",
        icon: 'BoxSelect',
        features: [
          "Annotation collaborative d'images terrain",
          'Export aux formats standards (COCO, YOLO...)',
          'Gestion de jeux de données agricoles',
          'Accélère l\'entraînement de nos modèles IA',
        ],
        order: 1,
        isActive: true,
      },
      {
        slug: 'diagnostic-ia',
        title: 'Diagnostic des Maladies par IA',
        description: 'Une application qui identifie les maladies des plantes à partir d\'une photo et recommande le traitement phytosanitaire adapté.',
        icon: 'ScanSearch',
        features: [
          'Diagnostic instantané par photo',
          'Recommandations phytosanitaires personnalisées',
          'Base de données de produits homologués',
          "Suivi de l'évolution de la culture",
        ],
        order: 2,
        isActive: true,
      },
    ];

    for (const solution of defaultSolutions) {
      const existing = await prisma.innovativeSolution.findUnique({ where: { slug: solution.slug } });
      if (existing) continue; // contenu ensuite éditable depuis l'admin, jamais écrasé au démarrage

      const linkedImpact = await prisma.donationImpact.findUnique({ where: { slug: solution.slug }, select: { id: true } });
      await prisma.innovativeSolution.create({
        data: { ...solution, donationImpactId: linkedImpact?.id ?? null },
      });
      logger.info(`[innovative-solutions] Created project card: ${solution.slug}`);
    }
  } catch (error) {
    logger.error('[innovative-solutions] Failed to ensure default project cards', error);
  }
}
