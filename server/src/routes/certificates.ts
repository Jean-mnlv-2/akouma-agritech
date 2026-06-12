import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authRequired, adminOnly } from '../middleware/authRequired';
import { validate } from '../middleware/validate';
import { audit, actorFromRequest } from '../utils/audit';
import { sertifierFetch, isSertifierConfigured, isValidSertifierId } from '../utils/sertifierClient';
import { emailService } from '../utils/email';

const requestCertSchema = z.object({
  courseId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]),
  score: z.number().min(0).max(100).optional(),
}).strict();

const prisma = new PrismaClient();
export const certificatesRouter = Router();

// =============== Issuance Queue ===============
// Lightweight in-memory queue. Persists state via DB so retries survive restart
// (a separate worker drains 'pending' rows). For low/medium throughput this is
// sufficient; for higher scale, swap for BullMQ/Redis.

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 15_000;
let workerRunning = false;
const inFlight = new Set<number>();

function genCertNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `KLM-CERT-${ts}-${rand}`;
}

type LogEntry = { ts: string; level: 'info' | 'warn' | 'error'; step: string; message?: string; durationMs?: number };
function appendLog(prev: unknown, entry: LogEntry): LogEntry[] {
  const arr = Array.isArray(prev) ? (prev as LogEntry[]) : [];
  arr.push(entry);
  return arr.slice(-200);
}

async function processOne(certificateId: number): Promise<void> {

  if (inFlight.has(certificateId)) return;
  inFlight.add(certificateId);
  try {
  const cert = await prisma.certificate.findUnique({
    where: { id: certificateId },
    include: { user: true, course: true },
  });
  if (!cert) return;
  if (cert.status === 'sent') return;
  if (cert.status === 'processing') return;

  // Atomic claim: only transition pending|failed -> processing
  const claim = await prisma.certificate.updateMany({
    where: { id: certificateId, status: { in: ['pending', 'failed'] } },
    data: { status: 'processing', attempts: { increment: 1 } },
  });
  if (claim.count === 0) return; // lost the race; another worker has it

  let log: LogEntry[] = Array.isArray(cert.executionLog) ? (cert.executionLog as unknown as LogEntry[]) : [];
  log = appendLog(log, { ts: new Date().toISOString(), level: 'info', step: 'claim', message: `Tentative ${(cert.attempts ?? 0) + 1}` });

  try {
    const c = cert.course as any;
    if (!isSertifierConfigured()) throw new Error('SERTIFIER_SECRET_KEY non configurée');
    if (!isValidSertifierId(c.sertifierDesignId) || !isValidSertifierId(c.sertifierDetailId) || !isValidSertifierId(c.sertifierEmailTemplateId)) {
      throw new Error('IDs Sertifier manquants ou invalides pour ce cours');
    }
    if (!cert.user?.email) throw new Error('Email étudiant manquant');

    let t0 = Date.now();
    const campaign: any = await sertifierFetch('POST', '/campaign', {
      title: `KILIMO - ${cert.course.title} - ${cert.user.fullName || cert.user.email} - ${cert.certificateNumber}`,
      designId: c.sertifierDesignId,
      detailId: c.sertifierDetailId,
      emailTemplateId: c.sertifierEmailTemplateId,
      mailSubject: `Votre certificat KILIMO : ${cert.course.title}`,
      fromName: 'KILIMO E-Learning',
    });
    const campaignId = campaign?.id || campaign?.data?.id;
    log = appendLog(log, { ts: new Date().toISOString(), level: 'info', step: 'campaign.create', message: `campaignId=${campaignId}`, durationMs: Date.now() - t0 });

    t0 = Date.now();
    const credentials: any = await sertifierFetch('POST', '/campaign/addCredentials', {
      campaignId,
      credentials: [{
        name: cert.user.fullName || cert.user.email,
        email: cert.user.email,
        attributes: {
          courseName: cert.course.title,
          score: cert.score != null ? `${cert.score}%` : 'N/A',
          completionDate: cert.completionDate.toISOString().slice(0, 10),
          certificateNumber: cert.certificateNumber,
          platform: 'KILIMO E-Learning',
        },
      }],
    });
    log = appendLog(log, { ts: new Date().toISOString(), level: 'info', step: 'campaign.addCredentials', durationMs: Date.now() - t0 });

    t0 = Date.now();
    await sertifierFetch('POST', '/campaign/send', { campaignId });
    log = appendLog(log, { ts: new Date().toISOString(), level: 'info', step: 'campaign.send', durationMs: Date.now() - t0 });

    let credentialId = credentials?.credentials?.[0]?.id || '';
    let credentialUrl = '';
    if (credentialId) {
      try {
        t0 = Date.now();
        const cd: any = await sertifierFetch('GET', `/credential/${credentialId}`);
        credentialUrl = cd?.verificationUrl || cd?.url || cd?.data?.verificationUrl || '';
        log = appendLog(log, { ts: new Date().toISOString(), level: 'info', step: 'credential.fetch', message: credentialUrl, durationMs: Date.now() - t0 });
      } catch (e) {
        log = appendLog(log, { ts: new Date().toISOString(), level: 'warn', step: 'credential.fetch', message: e instanceof Error ? e.message : 'fetch failed' });
      }
    }

    log = appendLog(log, { ts: new Date().toISOString(), level: 'info', step: 'done', message: 'Certificat émis avec succès' });
    await prisma.certificate.update({
      where: { id: certificateId },
      data: {
        status: 'sent',
        campaignId: String(campaignId || ''),
        credentialId: String(credentialId || ''),
        credentialUrl,
        issuedAt: new Date(),
        lastError: null,
        executionLog: log as any,
      },
    });
    try {
      const base = (process.env.FRONTEND_ORIGINS || '').split(',')[0].trim() || '';
      emailService.sendLearningEvent({
        email: cert.user.email,
        userName: cert.user.fullName || cert.user.email,
        courseTitle: cert.course.title,
        type: 'certificate-ready',
        certificateUrl: `${base}/api/certificates/${certificateId}/pdf`,
        verificationUrl: credentialUrl || `${base}/certificates/verify/${encodeURIComponent(cert.certificateNumber)}`,
      }).catch(() => {});
    } catch { /* ignore */ }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    const fresh = await prisma.certificate.findUnique({ where: { id: certificateId } });
    const failed = (fresh?.attempts ?? 1) >= MAX_ATTEMPTS;
    log = appendLog(log, { ts: new Date().toISOString(), level: 'error', step: failed ? 'failed' : 'retry', message: msg });
    await prisma.certificate.update({
      where: { id: certificateId },
      data: { status: failed ? 'failed' : 'pending', lastError: msg, executionLog: log as any },
    });
    if (!failed) {
      setTimeout(() => { drainQueue().catch(() => {}); }, RETRY_DELAY_MS);
    }
    console.error('[Certificates] Issue failed:', msg);
  }
  } finally {
    inFlight.delete(certificateId);
  }
}

async function drainQueue(): Promise<void> {
  if (workerRunning) return;
  workerRunning = true;
  try {
    while (true) {
      try {
        const next = await prisma.certificate.findFirst({
          where: { status: 'pending', attempts: { lt: MAX_ATTEMPTS } },
          orderBy: { createdAt: 'asc' },
        });
        if (!next) break;
        await processOne(next.id);
      } catch (e) {
        console.error('[Certificates] Queue error:', e);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  } finally {
    workerRunning = false;
  }
}

// Enqueue on startup (catch-up for items left pending after a restart)
setTimeout(() => { drainQueue().catch(() => {}); }, 5_000);

// =============== Routes ===============

// Student: list my certificates
certificatesRouter.get('/my', authRequired, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  const certs = await prisma.certificate.findMany({
    where: { userId },
    include: { course: { select: { id: true, title: true, slug: true, thumbnailUrl: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ data: certs });
});

// Student: fetch a single certificate (must own it)
certificatesRouter.get('/:id', authRequired, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const role = (req as any).user?.role;
  const id = Number(req.params.id);
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  const cert = await prisma.certificate.findUnique({
    where: { id },
    include: { course: { select: { id: true, title: true, slug: true } } },
  });
  if (!cert) return res.status(404).json({ error: 'Not found' });
  if (cert.userId !== userId && role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  res.json({ data: cert });
});

// Student: request issuance for a course they completed
certificatesRouter.post('/request', authRequired, validate(requestCertSchema), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { courseId, score } = req.body;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const course = await prisma.course.findUnique({ where: { id: Number(courseId) } });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const enrollment = await prisma.eLearningEnrollment.findUnique({
      where: { userId_courseId: { userId, courseId: Number(courseId) } } as any,
    });
    if (!enrollment) return res.status(403).json({ error: 'Not enrolled' });
    if (enrollment.userId !== userId) return res.status(403).json({ error: 'forbidden' });
    if ((enrollment.progress ?? 0) < 100 && !enrollment.completedAt) {
      return res.status(400).json({ error: 'Course not completed yet' });
    }

    // Vérification supplémentaire: la progression doit aussi être vérifiable
    // côté serveur via les ModuleProgress complétés (un utilisateur ne peut
    // pas obtenir un certificat sans avoir terminé tous les modules).
    const totalModules = await prisma.courseModule.count({ where: { courseId: Number(courseId) } });
    if (totalModules > 0) {
      const completedModules = await prisma.moduleProgress.count({
        where: { enrollmentId: enrollment.id, completed: true },
      });
      if (completedModules < totalModules) {
        return res.status(400).json({ error: 'Course not completed yet (modules missing)' });
      }
    }

    // Anti-doublon: idempotent and concurrency-safe.
    // - If a certificate is already pending/processing/sent, return it as-is.
    // - If failed, reset to pending only if not already being retried.
    let cert;
    try {
      cert = await prisma.$transaction(async (tx) => {
        const existing = await tx.certificate.findUnique({
          where: { userId_courseId: { userId, courseId: Number(courseId) } } as any,
        });
        if (!existing) {
          return tx.certificate.create({
            data: {
              userId,
              courseId: Number(courseId),
              enrollmentId: enrollment.id,
              certificateNumber: genCertNumber(),
              score: score != null ? Number(score) : null,
              status: 'pending',
            },
          });
        }
        if (existing.status === 'processing' || existing.status === 'pending' || existing.status === 'sent') {
          return existing;
        }
        // failed -> reset
        return tx.certificate.update({
          where: { id: existing.id },
          data: { status: 'pending', attempts: 0, lastError: null },
        });
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'create failed';
      if (msg.includes('Unique constraint')) {
        cert = await prisma.certificate.findUnique({
          where: { userId_courseId: { userId, courseId: Number(courseId) } } as any,
        });
      } else {
        throw e;
      }
    }
    drainQueue().catch(() => {});
    if (cert) {
      await audit({ ...actorFromRequest(req), action: 'certificate.request', entityType: 'certificate', entityId: cert.id, metadata: { courseId: Number(courseId), score: score ?? null } });
    }
    // Fallback local : si Sertifier n'est pas configuré, on émet immédiatement le certificat
    // (PDF généré côté backend + email avec lien de téléchargement et vérification).
    if (cert && cert.status !== 'sent' && !isSertifierConfigured()) {
      try {
        const issued = await prisma.certificate.update({
          where: { id: cert.id },
          data: { status: 'sent', issuedAt: new Date(), lastError: null },
          include: { user: true, course: true },
        });
        const base = (process.env.FRONTEND_ORIGINS || '').split(',')[0].trim() || '';
        if (issued.user?.email && issued.course?.title) {
          emailService.sendLearningEvent({
            email: issued.user.email,
            userName: issued.user.fullName || issued.user.email,
            courseTitle: issued.course.title,
            type: 'certificate-ready',
            certificateUrl: `${base}/api/certificates/${issued.id}/pdf`,
            verificationUrl: `${base}/certificates/verify/${encodeURIComponent(issued.certificateNumber)}`,
          }).catch(() => {});
        }
        cert = issued;
      } catch (e) { /* ignore */ }
    }
    res.status(201).json({ data: cert });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed' });
  }
});

// Admin: list all certificates with filters
certificatesRouter.get('/admin', authRequired, adminOnly, async (req: Request, res: Response) => {
  const { status, courseId, userId, from, to } = req.query;
  const dateRange: any = {};
  if (from) dateRange.gte = new Date(String(from));
  if (to) dateRange.lte = new Date(String(to));
  const certs = await prisma.certificate.findMany({
    where: {
      ...(status ? { status: String(status) } : {}),
      ...(courseId ? { courseId: Number(courseId) } : {}),
      ...(userId ? { userId: String(userId) } : {}),
      ...(from || to ? { createdAt: dateRange } : {}),
    },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      course: { select: { id: true, title: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ data: certs });
});

// Admin: retry / re-queue a certificate
certificatesRouter.post('/:id/retry', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const updated = await prisma.certificate.updateMany({
    where: { id, status: { not: 'processing' } },
    data: { status: 'pending', attempts: 0, lastError: null },
  });
  if (updated.count === 0) {
    return res.status(409).json({ error: 'Certificate is currently being processed' });
  }
  drainQueue().catch(() => {});
  res.json({ success: true });
});

// Admin: fetch execution log for a certificate
certificatesRouter.get('/:id/log', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const cert = await prisma.certificate.findUnique({
    where: { id },
    select: { id: true, certificateNumber: true, status: true, attempts: true, lastError: true, executionLog: true, createdAt: true, updatedAt: true },
  });
  if (!cert) return res.status(404).json({ error: 'Not found' });
  res.json({ data: cert });
});

// Admin: queue stats
certificatesRouter.get('/queue/stats', authRequired, adminOnly, async (_req: Request, res: Response) => {
  const groups = await prisma.certificate.groupBy({ by: ['status'], _count: { _all: true } });
  const stats: Record<string, number> = { pending: 0, processing: 0, sent: 0, failed: 0 };
  for (const g of groups) stats[g.status] = g._count._all;
  res.json({ data: { stats, workerRunning, sertifierConfigured: isSertifierConfigured() } });
});
