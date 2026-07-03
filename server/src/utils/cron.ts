import nodeCron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { emailService } from './email';
import { logger } from './logger';

const prisma = new PrismaClient();

/**
 * Initialise les tâches planifiées (cron jobs)
 * Note: Le scraping d'actualités est exclusivement piloté par DeerFlow
 */
export const initCronJobs = () => {
 
  // Rappels E-Learning à 09:00
  nodeCron.schedule('0 9 * * *', async () => {
    console.log('[CRON] Vérification des rappels E-Learning...');
    try {
      await sendLearningReminders();
    } catch (error) {
      console.error(`[CRON] Erreur lors de l'envoi des rappels :`, error);
    }
  });

  // Gestion des commandes impayées à 10:00 (Relances et Suppressions)
  nodeCron.schedule('0 10 * * *', async () => {
    console.log('[CRON] Traitement des commandes impayées...');
    try {
      await processUnpaidOrders();
    } catch (error) {
      console.error('[CRON] Erreur lors du traitement des commandes impayées :', error);
    }
  });

  console.log('[CRON] Tâches planifiées initialisées (scraping actualités géré par DeerFlow)');
};

/**
 * Gère les relances et la suppression des commandes impayées
 */
async function processUnpaidOrders() {
  const now = new Date();
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(now.getDate() - 3);

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  // 1. Envoyer des relances pour les commandes de 3 jours
  const ordersToRemind = await prisma.order.findMany({
    where: {
      paymentStatus: 'pending',
      status: 'pending',
      createdAt: {
        lte: threeDaysAgo,
        gt: sevenDaysAgo,
      },
    },
    include: {
      user: true,
      items: true,
    },
  });

  console.log(`[CRON] ${ordersToRemind.length} commandes en attente de relance trouvées.`);

  for (const order of ordersToRemind) {
    try {
      // Vérifier si une relance n'a pas déjà été envoyée pour cette commande
      const alreadyReminded = await prisma.reminderLog.findFirst({
        where: {
          email: order.user.email,
          error: `order_reminder_${order.orderNumber}`,
        }
      });

      if (alreadyReminded) continue;

      await emailService.sendUnpaidOrderReminder({
        email: order.user.email,
        userName: order.user.fullName || order.user.email,
        orderNumber: order.orderNumber,
        total: Number(order.total),
        daysOld: 3,
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity
        }))
      });

      await prisma.reminderLog.create({
        data: {
          userId: order.userId,
          email: order.user.email,
          enrollmentId: 0,
          courseId: 0,
          status: 'success',
          error: `order_reminder_${order.orderNumber}`
        }
      });
      
      console.log(`[CRON] Relance envoyée pour la commande #${order.orderNumber} à ${order.user.email}`);
    } catch (error) {
      console.error(`[CRON] Erreur relance commande #${order.orderNumber}:`, error);
    }
  }

  // 2. Supprimer les commandes de plus de 7 jours
  const ordersToDelete = await prisma.order.findMany({
    where: {
      paymentStatus: 'pending',
      status: 'pending',
      createdAt: {
        lte: sevenDaysAgo,
      },
    },
    include: {
      user: true,
    },
  });

  console.log(`[CRON] ${ordersToDelete.length} commandes impayées de plus de 7 jours à supprimer.`);

  for (const order of ordersToDelete) {
    try {
      // Envoyer notification d'annulation avant suppression
      await emailService.sendOrderCancellationNotice({
        email: order.user.email,
        userName: order.user.fullName || order.user.email,
        orderNumber: order.orderNumber,
      });

      // Supprimer la commande (la suppression en cascade gérera les items et events)
      await prisma.order.delete({
        where: { id: order.id }
      });

      console.log(`[CRON] Commande #${order.orderNumber} supprimée (impayée depuis 7 jours). Notification envoyée à ${order.user.email}`);
    } catch (error) {
      console.error(`[CRON] Erreur suppression commande #${order.orderNumber}:`, error);
    }
  }
}

/**
 * Envoie des emails de rappel aux étudiants ayant activé les notifications
 */
async function sendLearningReminders() {
  const enrollments = await prisma.eLearningEnrollment.findMany({
    where: {
      remindersEnabled: true,
    },
    include: {
      user: true,
      course: true,
    },
  });

  console.log(`[CRON] ${enrollments.length} inscriptions avec rappels activés trouvées.`);

  for (const enrollment of enrollments) {
    if (!enrollment.user?.email || !enrollment.course?.title) continue;

    try {
      
      await emailService.sendLearningReminder({
        email: enrollment.user.email,
        userName: enrollment.user.fullName || enrollment.user.email,
        courseTitle: enrollment.course.title,
        progress: enrollment.progress || 0,
        targetEndDate: enrollment.targetEndDate,
      });
      
      console.log(`[CRON] Rappel envoyé à ${enrollment.user.email} pour ${enrollment.course.title}`);
      await prisma.reminderLog.create({
        data: {
          enrollmentId: enrollment.id,
          userId: enrollment.userId,
          courseId: enrollment.courseId,
          email: enrollment.user.email,
          status: 'success',
        }
      });
    } catch (error) {
      console.error(`[CRON] Erreur envoi rappel pour ${enrollment.user.email}:`, error);
      await prisma.reminderLog.create({
        data: {
          enrollmentId: enrollment.id,
          userId: enrollment.userId,
          courseId: enrollment.courseId,
          email: enrollment.user.email,
          status: 'failed',
          error: (error as Error)?.message || 'unknown_error',
        }
      });
    }
  }
}
