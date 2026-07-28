import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

export async function ensureDefaultPlans(prisma: PrismaClient): Promise<void> {
  try {
    const defaultPlans = [
      {
        name: 'free',
        displayName: 'Gratuit',
        description: 'Accès aux fonctionnalités de base avec des limitations',
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
        displayName: 'Starter',
        description: 'Essai gratuit de 7 jours avec accès aux documents personnalisés',
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
        displayName: 'Pro',
        description: 'Accès complet avec support prioritaire',
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
        displayName: 'Enterprise',
        description: 'Solution complète avec API dédiée et support premium',
        price: 50000,
        currency: 'XOF',
        dailyProMessageLimit: 0,
        hasCustomDocuments: true,
        hasPrioritySupport: true,
        hasApiAccess: true,
        maxCustomDocuments: 0,
        trialDays: 0,
        sortOrder: 3,
        isActive: true,
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
