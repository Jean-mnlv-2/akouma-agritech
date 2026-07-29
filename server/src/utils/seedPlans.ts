import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

export async function ensureDefaultPlans(prisma: PrismaClient): Promise<void> {
  try {
    const defaultPlans = [
      {
        name: 'free',
        displayName: 'Gratuit',
        description: 'Découvrez KILIMO : contenus vitrine en accès libre, plus un aperçu quotidien de nos fiches techniques.',
        price: 0,
        currency: 'XOF',
        dailyProMessageLimit: 10,
        hasCustomDocuments: false,
        hasPrioritySupport: false,
        hasApiAccess: false,
        maxCustomDocuments: 0,
        trialDays: 0,
        sortOrder: 0,
        isActive: true,
      },
      {
        name: 'starter',
        displayName: 'Standard',
        description: "L'expertise technique au quotidien : itinéraires techniques des cultures, fiches sanitaires et conseils de lutte. 7 jours d'essai inclus.",
        price: 5000,
        currency: 'XOF',
        dailyProMessageLimit: 20,
        hasCustomDocuments: true,
        hasPrioritySupport: false,
        hasApiAccess: false,
        maxCustomDocuments: 5,
        trialDays: 7,
        sortOrder: 1,
        isActive: true,
      },
      {
        name: 'pro',
        displayName: 'Premium',
        description: "L'accompagnement agroconsulting complet : diagnostic environnemental, planification technico-économique et accès marché.",
        price: 15000,
        currency: 'XOF',
        dailyProMessageLimit: 100,
        hasCustomDocuments: true,
        hasPrioritySupport: true,
        hasApiAccess: false,
        maxCustomDocuments: 20,
        trialDays: 0,
        sortOrder: 2,
        isActive: true,
      },
      {
        name: 'enterprise',
        displayName: 'Entreprise',
        description: 'Tout Premium, sans limite de requêtes, avec un accès API dédié pour vos intégrations.',
        price: 50000,
        currency: 'XOF',
        dailyProMessageLimit: 0,
        hasCustomDocuments: true,
        hasPrioritySupport: true,
        hasApiAccess: true,
        maxCustomDocuments: 0,
        trialDays: 0,
        sortOrder: 3,
        // Désactivé temporairement à la demande — masqué de /api/subscriptions/plans
        // (GET filtre isActive:true) et bloqué côté POST /subscribe. Remettre à
        // `true` pour le republier ; les données du plan restent en base.
        isActive: false,
      },
    ];

    for (const planData of defaultPlans) {
      const existing = await prisma.plan.findUnique({
        where: { name: planData.name },
      });

      if (!existing) {
        await prisma.plan.create({
          data: planData,
        });
        logger.info(`[plans] Created plan: ${planData.name}`);
      } else {
        // Update existing plan if needed
        await prisma.plan.update({
          where: { name: planData.name },
          data: planData,
        });
        logger.info(`[plans] Updated plan: ${planData.name}`);
      }
    }
  } catch (error) {
    logger.error('[plans] Failed to ensure default plans', error);
  }
}
