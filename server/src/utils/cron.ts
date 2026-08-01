import nodeCron from 'node-cron';
import { emailService, isEmailConfigured } from './email';
import { RagSystem } from '../rag';
import { SubscriptionService } from '../services/subscriptionService';
import { OrdersService } from '../services/ordersService';
import { initSourceScheduler } from './sourceScheduler';
import { prisma } from '../db';
const subscriptionService = new SubscriptionService();
const ordersService = new OrdersService(prisma);

/**
 * Vérifie la connexion à Ollama et s'assure que le modèle est disponible
 */
async function checkOllama() {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://ollama:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3.2';
  
  try {
    console.log('[Ollama] Vérification de la connexion et du modèle...');
    
    // Vérifier la disponibilité d'Ollama
    const healthCheck = await fetch(`${ollamaUrl}/api/tags`);
    if (!healthCheck.ok) {
      throw new Error(`Ollama health check failed: ${healthCheck.statusText}`);
    }
    
    const tagsData = await healthCheck.json();
    const models = tagsData.models || [];
    const modelExists = models.some((m: any) => m.name === model || m.name === `${model}:latest`);
    
    if (!modelExists) {
      console.log(`[Ollama] Le modèle ${model} n'est pas trouvé. Tentative de téléchargement...`);
      const pullResponse = await fetch(`${ollamaUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: model }),
      });
      
      if (!pullResponse.ok) {
        throw new Error(`Échec du téléchargement du modèle ${model}: ${pullResponse.statusText}`);
      }
      
      console.log(`[Ollama] Modèle ${model} téléchargé avec succès !`);
    } else {
      console.log(`[Ollama] Modèle ${model} déjà disponible.`);
    }
  } catch (error) {
    console.error('[Ollama] Échec de la vérification :', error);
  }
}

/**
 * Synchronise automatiquement la base de connaissances RAG
 */
async function syncKnowledgeBase() {
  try {
    console.log('[CRON] Synchronisation automatique de la base de connaissances...');
    
    const rag = RagSystem.getInstance(prisma);
    const { KilimoKnowledgeAdapter } = await import('../rag/adapters/KilimoKnowledgeAdapter');
    const adapter = new KilimoKnowledgeAdapter(prisma, rag.indexer);
    
    await adapter.indexAllContent();
    console.log('[CRON] Synchronisation terminée avec succès !');
  } catch (error) {
    console.error('[CRON] Erreur lors de la synchronisation de la base de connaissances :', error);
  }
}

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

  // Synchronisation automatique de la base de connaissances toutes les 6 heures
  nodeCron.schedule('0 */6 * * *', async () => {
    console.log('[CRON] Synchronisation de la base de connaissances...');
    try {
      await syncKnowledgeBase();
    } catch (error) {
      console.error('[CRON] Erreur lors de la synchronisation de la base de connaissances :', error);
    }
  });

  // Notifications de fin d'essai chaque matin à 08:00
  nodeCron.schedule('0 8 * * *', async () => {
    console.log('[CRON] Vérification des essais d’abonnement arrivant à échéance...');
    try {
      await subscriptionService.checkExpiringTrials();
    } catch (error) {
      console.error('[CRON] Erreur lors de la vérification des essais :', error);
    }
  });

  // Agrégation analytique des abonnements chaque nuit à 23:55
  nodeCron.schedule('55 23 * * *', async () => {
    console.log('[CRON] Mise à jour des analytiques d’abonnement...');
    try {
      await subscriptionService.updateAnalytics();
    } catch (error) {
      console.error('[CRON] Erreur lors de la mise à jour analytique des abonnements :', error);
    }
  });

  // Sources avec horaires admin-configurés (NewsSource.scheduleTimes) —
  // déclenchement fiable indépendant de la disponibilité de DeerFlow. Les
  // sources sans horaire configuré restent manuelles/pilotées par DeerFlow,
  // comme avant.
  initSourceScheduler();

  // Vérification d'Ollama au démarrage
  checkOllama();

  console.log('[CRON] Tâches planifiées initialisées');
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

  // 1. Envoyer des relances (une seule fois) pour les commandes impayées de 3 à 7 jours
  const ordersToRemind = await prisma.order.findMany({
    where: {
      paymentStatus: 'pending',
      status: 'pending',
      reminderSentAt: null,
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

  if (!isEmailConfigured()) {
    console.warn('[CRON] RESEND_API_KEY non configurée : relances commandes impayées ignorées (aucune commande marquée comme relancée).');
  } else {
    for (const order of ordersToRemind) {
      try {
        const daysOld = Math.floor((now.getTime() - order.createdAt.getTime()) / (24 * 60 * 60 * 1000));

        await emailService.sendUnpaidOrderReminder({
          email: order.user.email,
          userName: order.user.fullName || order.user.email,
          orderNumber: order.orderNumber,
          total: Number(order.total),
          daysOld,
          items: order.items.map(item => ({
            name: item.name,
            quantity: item.quantity
          }))
        });

        await prisma.order.update({
          where: { id: order.id },
          data: { reminderSentAt: now },
        });

        console.log(`[CRON] Relance envoyée pour la commande #${order.orderNumber} à ${order.user.email}`);
      } catch (error) {
        console.error(`[CRON] Erreur relance commande #${order.orderNumber}:`, error);
      }
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
      items: true,
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

      // Restaure le stock et rembourse le cashback éventuellement utilisé
      // avant de supprimer (la commande n'a jamais été payée, ces effets
      // n'auraient jamais dû devenir permanents).
      await prisma.$transaction(async (tx: any) => {
        await ordersService.reverseOrderEffects(tx, order);
        await tx.order.delete({ where: { id: order.id } });
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
