import nodeCron from 'node-cron';
import { prisma } from '../db';
import { emailService } from './email';
import { logger } from './logger';
import { computeEffectiveOpenDate } from './cohortSchedule';

const DEDUPE_WINDOW_DAYS = 3;

/**
 * Relance par email les apprenants qui n'ont pas encore demandé de
 * rattrapage pour un module de cohorte dont la fenêtre d'évaluation est
 * fermée sans qu'ils l'aient validé. L'examen de synthèse (dernier module,
 * pas de "fenêtre suivante") n'est pas couvert ici — son rattrapage se
 * déclenche directement à la tentative échouée, géré côté apprenant sans
 * besoin de rappel programmé.
 */
async function checkAndSendRattrapageReminders() {
  const now = new Date();
  const enrollments = await prisma.eLearningEnrollment.findMany({
    where: { remindersEnabled: true },
    include: {
      user: true,
      course: { include: { modules: { where: { isActive: true }, orderBy: { order: 'asc' } } } },
    },
  });

  for (const enrollment of enrollments) {
    if (!enrollment.user?.email || !enrollment.course) continue;
    const modules = enrollment.course.modules;

    for (let idx = 0; idx < modules.length; idx++) {
      const mod = modules[idx];
      const next = modules[idx + 1];
      const nextEffectiveOpenDate = next ? computeEffectiveOpenDate(enrollment.course, next) : null;
      const windowClosed = !!(nextEffectiveOpenDate && nextEffectiveOpenDate <= now);
      if (!windowClosed) continue;

      const progress = await prisma.moduleProgress.findUnique({
        where: { enrollmentId_moduleId: { enrollmentId: enrollment.id, moduleId: mod.id } },
      });
      if (progress?.completed) continue;

      const existingRequest = await prisma.rattrapageRequest.findUnique({
        where: { enrollmentId_moduleId: { enrollmentId: enrollment.id, moduleId: mod.id } },
      });
      if (existingRequest) continue; // déjà demandé, peu importe le statut

      const recentLog = await prisma.reminderLog.findFirst({
        where: {
          enrollmentId: enrollment.id,
          moduleId: mod.id,
          type: 'rattrapage_reminder',
          sentAt: { gte: new Date(now.getTime() - DEDUPE_WINDOW_DAYS * 24 * 60 * 60 * 1000) },
        },
      });
      if (recentLog) continue;

      try {
        await emailService.sendLearningEvent({
          email: enrollment.user.email,
          userName: enrollment.user.fullName || enrollment.user.email,
          courseTitle: enrollment.course.title,
          moduleTitle: mod.title,
          type: 'rattrapage_reminder',
        });
        logger.info(`[RattrapageReminders] Rappel envoyé à ${enrollment.user.email} pour ${mod.title}`);
        await prisma.reminderLog.create({
          data: {
            enrollmentId: enrollment.id,
            userId: enrollment.userId,
            courseId: enrollment.courseId,
            moduleId: mod.id,
            email: enrollment.user.email,
            type: 'rattrapage_reminder',
            status: 'success',
          },
        });
      } catch (error) {
        logger.error(`[RattrapageReminders] Erreur envoi rappel pour ${enrollment.user.email}:`, error);
        await prisma.reminderLog.create({
          data: {
            enrollmentId: enrollment.id,
            userId: enrollment.userId,
            courseId: enrollment.courseId,
            moduleId: mod.id,
            email: enrollment.user.email,
            type: 'rattrapage_reminder',
            status: 'failed',
            error: (error as Error)?.message || 'unknown_error',
          },
        });
      }
    }
  }
}

export function initRattrapageReminders() {
  // Décalé de 30 min par rapport au rappel d'apprentissage existant (09:00)
  // pour éviter de solliciter la base/Resend au même instant.
  nodeCron.schedule('30 8 * * *', async () => {
    try {
      await checkAndSendRattrapageReminders();
    } catch (error) {
      logger.error('[RattrapageReminders] Erreur de vérification des rattrapages en attente:', error);
    }
  });
  logger.info('[RattrapageReminders] Planificateur initialisé (quotidien 08:30)');
}
