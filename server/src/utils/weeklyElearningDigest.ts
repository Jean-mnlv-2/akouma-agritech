import nodeCron from 'node-cron';
import { prisma } from '../db';
import { emailService } from './email';
import { logger } from './logger';
import { env } from './env';

const LINK_CHECK_TIMEOUT_MS = 8000;
const FORGOTTEN_DRAFT_DAYS = 14;
const ACTIVITY_WINDOW_DAYS = 7;

async function isLinkReachable(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), LINK_CHECK_TIMEOUT_MS);
    try {
      const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
      if (res.ok) return true;
      // Certains hébergeurs (YouTube, Drive…) rejettent HEAD — on retente en GET avant de conclure.
      const getRes = await fetch(url, { method: 'GET', signal: controller.signal });
      return getRes.ok;
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return false;
  }
}

/**
 * Vérifie les liens vidéo/PDF des modules actifs, un par un (pas de
 * parallélisme agressif — un catalogue de cours reste petit, et ça évite de
 * déclencher des protections anti-bot sur les hébergeurs externes).
 */
async function checkModuleLinks(): Promise<{ checked: number; brokenNow: string[] }> {
  const modules = await prisma.courseModule.findMany({
    where: { isActive: true, OR: [{ videoUrl: { not: null } }, { pdfUrl: { not: null } }] },
    select: { id: true, title: true, videoUrl: true, pdfUrl: true, course: { select: { title: true } } },
  });

  const brokenNow: string[] = [];
  for (const mod of modules) {
    const url = mod.videoUrl || mod.pdfUrl;
    if (!url) continue;
    const reachable = await isLinkReachable(url);
    if (!reachable) brokenNow.push(`${mod.course.title} — ${mod.title}`);
    await prisma.courseModule.update({
      where: { id: mod.id },
      data: { linkBroken: !reachable, linkLastCheckedAt: new Date() },
    });
  }
  return { checked: modules.length, brokenNow };
}

async function findForgottenDrafts() {
  const cutoff = new Date(Date.now() - FORGOTTEN_DRAFT_DAYS * 24 * 60 * 60 * 1000);
  const [courses, modules] = await Promise.all([
    prisma.course.findMany({
      where: { isPublished: false, createdAt: { lte: cutoff } },
      select: { id: true, title: true, createdAt: true, createdVia: true },
    }),
    prisma.courseModule.findMany({
      where: { isActive: false, createdAt: { lte: cutoff } },
      select: { id: true, title: true, createdAt: true, createdVia: true, course: { select: { title: true } } },
    }),
  ]);
  return { courses, modules };
}

async function summarizeActivity() {
  const since = new Date(Date.now() - ACTIVITY_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const [coursesCreated, modulesCreated, commentsHidden, suggestionsCreated, suggestionsPending] = await Promise.all([
    prisma.course.count({ where: { createdVia: 'deerflow', createdAt: { gte: since } } }),
    prisma.courseModule.count({ where: { createdVia: 'deerflow', createdAt: { gte: since } } }),
    prisma.courseComment.count({ where: { isApproved: false, updatedAt: { gte: since } } }),
    prisma.aiSuggestion.count({ where: { createdAt: { gte: since } } }),
    prisma.aiSuggestion.count({ where: { status: 'pending' } }),
  ]);
  return { coursesCreated, modulesCreated, commentsHidden, suggestionsCreated, suggestionsPending };
}

async function runWeeklyDigest() {
  logger.info('[WeeklyDigest] Génération du rapport hebdomadaire e-learning...');
  const [linkResult, forgotten, activity] = await Promise.all([
    checkModuleLinks(),
    findForgottenDrafts(),
    summarizeActivity(),
  ]);

  const adminEmail = env.DEFAULT_ADMIN_EMAIL || env.EMAIL_FROM;
  await emailService.sendWeeklyElearningDigest({
    email: adminEmail,
    activity,
    brokenLinks: linkResult.brokenNow,
    linksChecked: linkResult.checked,
    forgottenCourses: forgotten.courses.map((c) => ({ title: c.title, daysAgo: Math.floor((Date.now() - c.createdAt.getTime()) / 86400000), createdVia: c.createdVia })),
    forgottenModules: forgotten.modules.map((m) => ({ title: `${m.course.title} — ${m.title}`, daysAgo: Math.floor((Date.now() - m.createdAt.getTime()) / 86400000), createdVia: m.createdVia })),
  });
  logger.info('[WeeklyDigest] Rapport envoyé.');
}

export function initWeeklyElearningDigest() {
  // Lundi 08:00 — une fois par semaine, un seul email plutôt que plusieurs
  // alertes séparées (liens morts, brouillons oubliés, activité DeerFlow).
  nodeCron.schedule('0 8 * * 1', async () => {
    try {
      await runWeeklyDigest();
    } catch (error) {
      logger.error('[WeeklyDigest] Erreur lors de la génération du rapport:', error);
    }
  });
  logger.info('[WeeklyDigest] Planificateur initialisé (hebdomadaire, lundi 08:00)');
}
