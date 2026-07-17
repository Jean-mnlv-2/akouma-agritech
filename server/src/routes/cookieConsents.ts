import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../utils/env';
import { validate } from '../middleware/validate';
import { authRequired, adminOnly } from '../middleware/authRequired';
import { createRateLimiter } from '../middleware/rateLimit';
import { audit, actorFromRequest } from '../utils/audit';

const prisma = new PrismaClient();
export const cookieConsentsRouter = Router();

const consentSchema = z.object({
  anonId: z.string().min(8).max(64),
  version: z.string().min(1).max(20),
  necessary: z.boolean(),
  analytics: z.boolean(),
  marketing: z.boolean(),
  preferences: z.boolean(),
  method: z.enum(['accept_all', 'reject_all', 'custom', 'revoked']),
  url: z.string().url().optional(),
  locale: z.string().max(10).optional(),
}).strict();

function hashIp(ip: string | undefined | null): string | null {
  if (!ip) return null;
  return crypto.createHash('sha256').update(ip + '::' + env.JWT_SECRET).digest('hex').slice(0, 32);
}

function getOptionalUserId(req: Request): string | null {
  const token = (req.cookies?.auth_token as string | undefined) ||
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : undefined);
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { sub: string };
    return decoded.sub || null;
  } catch {
    return null;
  }
}

const writeLimiter = createRateLimiter({ windowMs: 60_000, max: 20 });

// Public endpoint - anyone can record their consent choice
cookieConsentsRouter.post('/', writeLimiter, validate(consentSchema), async (req: Request, res: Response) => {
  const body = req.body as z.infer<typeof consentSchema>;
  const userId = getOptionalUserId(req);
  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() || req.ip;
  const ua = String(req.headers['user-agent'] || '').slice(0, 500);

  const created = await prisma.cookieConsent.create({
    data: {
      userId,
      anonId: body.anonId,
      version: body.version,
      necessary: true, // always required
      analytics: body.analytics,
      marketing: body.marketing,
      preferences: body.preferences,
      method: body.method,
      ipHash: hashIp(ip),
      userAgent: ua || null,
      url: body.url || null,
      locale: body.locale || null,
    },
  });

  await audit({
    action: 'cookie_consent.recorded',
    entityType: 'CookieConsent',
    entityId: created.id,
    actorId: userId,
    metadata: { method: body.method, version: body.version, categories: { analytics: body.analytics, marketing: body.marketing, preferences: body.preferences } },
  }).catch(() => void 0);

  res.status(201).json({ data: { id: created.id, createdAt: created.createdAt } });
});

// Authenticated user: retrieve their consent history
cookieConsentsRouter.get('/mine', authRequired, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const rows = await prisma.cookieConsent.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({ data: rows });
});

// Admin: paginated list with filtering
cookieConsentsRouter.get('/', authRequired, adminOnly, async (req: Request, res: Response) => {
  const limit = Math.min(500, Math.max(1, Number(req.query.limit || 100)));
  const offset = Math.max(0, Number(req.query.offset || 0));
  const method = req.query.method ? String(req.query.method) : undefined;
  const where: any = {};
  if (method) where.method = method;

  const [rows, total, stats] = await Promise.all([
    prisma.cookieConsent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.cookieConsent.count({ where }),
    prisma.cookieConsent.groupBy({
      by: ['method'],
      _count: { _all: true },
    }).catch(() => [] as any),
  ]);

  res.json({ data: rows, total, stats });
});

// Admin: purge a single consent entry (GDPR right to erasure requests)
cookieConsentsRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  await prisma.cookieConsent.delete({ where: { id: req.params.id } }).catch(() => void 0);
  const actor = actorFromRequest(req);
  await audit({
    action: 'cookie_consent.deleted',
    entityType: 'CookieConsent',
    entityId: req.params.id,
    actorId: actor.actorId,
    actorRole: actor.actorRole,
  }).catch(() => void 0);
  res.json({ success: true });
});