import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';
import { sertifierFetch, isSertifierConfigured, isValidSertifierId } from '../utils/sertifierClient';

const prisma = new PrismaClient();
export const certificatesRouter = Router();

// =============== Issuance Queue ===============
// Lightweight in-memory queue. Persists state via DB so retries survive restart
// (a separate worker drains 'pending' rows). For low/medium throughput this is
// sufficient; for higher scale, swap for BullMQ/Redis.

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 15_000;
let workerRunning = false;

function genCertNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `KLM-CERT-${ts}-${rand}`;
}

async function processOne(certificateId: number): Promise<void> {
  const cert = await prisma.certificate.findUnique({
    where: { id: certificateId },
    include: { user: true, course: true },
  });
  if (!cert) return;
  if (cert.status === 'sent') return;

  await prisma.certificate.update({
    where: { id: certificateId },
    data: { status: 'processing', attempts: { increment: 1 } },
  });

  try {
    const c = cert.course as any;
    if (!isSertifierConfigured()) throw new Error('SERTIFIER_SECRET_KEY non configurée');
    if (!isValidSertifierId(c.sertifierDesignId) || !isValidSertifierId(c.sertifierDetailId) || !isValidSertifierId(c.sertifierEmailTemplateId)) {
      throw new Error('IDs Sertifier manquants ou invalides pour ce cours');
    }
    if (!cert.user?.email) throw new Error('Email étudiant manquant');

    const campaign: any = await sertifierFetch('POST', '/campaign', {
      title: `KILIMO - ${cert.course.title} - ${cert.user.fullName || cert.user.email} - ${cert.certificateNumber}`,
      designId: c.sertifierDesignId,
      detailId: c.sertifierDetailId,
      emailTemplateId: c.sertifierEmailTemplateId,
      mailSubject: `Votre certificat KILIMO : ${cert.course.title}`,
      fromName: 'KILIMO E-Learning',
    });
    const campaignId = campaign?.id || campaign?.data?.id;

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

    await sertifierFetch('POST', '/campaign/send', { campaignId });

    let credentialId = credentials?.credentials?.[0]?.id || '';
    let credentialUrl = '';
    if (credentialId) {
      try {
        const cd: any = await sertifierFetch('GET', `/credential/${credentialId}`);
        credentialUrl = cd?.verificationUrl || cd?.url || cd?.data?.verificationUrl || '';
      } catch { /* ignore */ }
    }

    await prisma.certificate.update({
      where: { id: certificateId },
      data: {
        status: 'sent',
        campaignId: String(campaignId || ''),
        credentialId: String(credentialId || ''),
        credentialUrl,
        issuedAt: new Date(),
        lastError: null,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    const fresh = await prisma.certificate.findUnique({ where: { id: certificateId } });
    const failed = (fresh?.attempts ?? 1) >= MAX_ATTEMPTS;
    await prisma.certificate.update({
      where: { id: certificateId },
      data: { status: failed ? 'failed' : 'pending', lastError: msg },
    });
    if (!failed) {
      setTimeout(() => { drainQueue().catch(() => {}); }, RETRY_DELAY_MS);
    }
    console.error('[Certificates] Issue failed:', msg);
  }
}

async function drainQueue(): Promise<void> {
  if (workerRunning) return;
  workerRunning = true;
  try {
    while (true) {
      const next = await prisma.certificate.findFirst({
        where: { status: 'pending', attempts: { lt: MAX_ATTEMPTS } },
        orderBy: { createdAt: 'asc' },
      });
      if (!next) break;
      await processOne(next.id);
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

// Student: request issuance for a course they completed
certificatesRouter.post('/request', authRequired, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { courseId, score } = req.body || {};
    if (!userId || !courseId) return res.status(400).json({ error: 'Missing fields' });

    const course = await prisma.course.findUnique({ where: { id: Number(courseId) } });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const enrollment = await prisma.eLearningEnrollment.findUnique({
      where: { userId_courseId: { userId, courseId: Number(courseId) } } as any,
    });
    if (!enrollment) return res.status(403).json({ error: 'Not enrolled' });
    if ((enrollment.progress ?? 0) < 100 && !enrollment.completedAt) {
      return res.status(400).json({ error: 'Course not completed yet' });
    }

    // Idempotent: reuse if already exists
    let cert = await prisma.certificate.findUnique({
      where: { userId_courseId: { userId, courseId: Number(courseId) } } as any,
    });
    if (!cert) {
      cert = await prisma.certificate.create({
        data: {
          userId,
          courseId: Number(courseId),
          enrollmentId: enrollment.id,
          certificateNumber: genCertNumber(),
          score: score != null ? Number(score) : null,
          status: 'pending',
        },
      });
    } else if (cert.status === 'failed') {
      cert = await prisma.certificate.update({
        where: { id: cert.id },
        data: { status: 'pending', attempts: 0, lastError: null },
      });
    }
    drainQueue().catch(() => {});
    res.status(201).json({ data: cert });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed' });
  }
});

// Admin: list all certificates with filters
certificatesRouter.get('/admin', authRequired, adminOnly, async (req: Request, res: Response) => {
  const { status, courseId, userId } = req.query;
  const certs = await prisma.certificate.findMany({
    where: {
      ...(status ? { status: String(status) } : {}),
      ...(courseId ? { courseId: Number(courseId) } : {}),
      ...(userId ? { userId: String(userId) } : {}),
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
  await prisma.certificate.update({
    where: { id },
    data: { status: 'pending', attempts: 0, lastError: null },
  });
  drainQueue().catch(() => {});
  res.json({ success: true });
});

// Admin: queue stats
certificatesRouter.get('/queue/stats', authRequired, adminOnly, async (_req: Request, res: Response) => {
  const groups = await prisma.certificate.groupBy({ by: ['status'], _count: { _all: true } });
  const stats: Record<string, number> = { pending: 0, processing: 0, sent: 0, failed: 0 };
  for (const g of groups) stats[g.status] = g._count._all;
  res.json({ data: { stats, workerRunning, sertifierConfigured: isSertifierConfigured() } });
});
