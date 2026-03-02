import nodeCron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { emailService } from './email';

const prisma = new PrismaClient();

/**
 * Initialise les tâches planifiées (cron jobs)
 */
export const initCronJobs = () => {
 
  nodeCron.schedule('0 9 * * *', async () => {
    console.log('[CRON] Vérification des rappels E-Learning...');
    try {
      await sendLearningReminders();
    } catch (error) {
      console.error('[CRON] Erreur lors de l\'envoi des rappels :', error);
    }
  });

  console.log('[CRON] Tâches planifiées initialisées (Rappels à 09:00)');
};

/**
 * Envoie des emails de rappel aux étudiants ayant activé les notifications
 */
async function sendLearningReminders() {
  // On récupère les inscriptions actives avec rappels activés
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
