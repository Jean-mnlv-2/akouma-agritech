import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import { prisma } from '../db';
const DEFAULT_MAX_SKEW_SEC = 300; // 5 minutes
const NONCE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

// In-memory short-circuit cache (best-effort) before hitting the DB.
const memCache = new Map<string, number>();
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, exp] of memCache.entries()) {
    if (exp < now) memCache.delete(key);
  }
  // Best-effort DB cleanup (fire and forget)
  prisma.webhookNonce.deleteMany({ where: { expiresAt: { lt: new Date(now) } } }).catch(() => {});
}

/**
 * Anti-replay protection for webhook handlers.
 *
 * Reads a timestamp + nonce from configurable headers, rejects requests that
 * are too old (replay) or whose nonce has already been seen.
 *
 * Configuration is per-route via factory options.
 */
export function antiReplay(opts: {
  source: string;
  timestampHeader: string;
  nonceHeader: string;
  maxSkewSec?: number;
  required?: boolean; // if false, accept requests missing the headers (logged warning)
}) {
  const maxSkew = opts.maxSkewSec ?? DEFAULT_MAX_SKEW_SEC;
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rawTs = req.header(opts.timestampHeader);
      const rawNonce = req.header(opts.nonceHeader);

      if (!rawTs || !rawNonce) {
        if (opts.required) {
          return res.status(401).json({ error: 'webhook_replay_protection_required' });
        }
        logger.warn(`[webhook ${opts.source}] missing replay headers (allowed by config)`);
        return next();
      }

      const tsSec = Number(rawTs);
      if (!Number.isFinite(tsSec)) {
        return res.status(400).json({ error: 'invalid_timestamp' });
      }
      const nowSec = Math.floor(Date.now() / 1000);
      if (Math.abs(nowSec - tsSec) > maxSkew) {
        return res.status(401).json({ error: 'webhook_timestamp_out_of_window' });
      }

      const nonce = String(rawNonce).slice(0, 200);
      if (!/^[A-Za-z0-9_\-:.]+$/.test(nonce)) {
        return res.status(400).json({ error: 'invalid_nonce' });
      }

      const cacheKey = `${opts.source}:${nonce}`;
      const now = Date.now();
      sweep(now);

      if (memCache.has(cacheKey)) {
        return res.status(409).json({ error: 'webhook_replay_detected' });
      }

      // Persist nonce — unique constraint guarantees atomicity across processes.
      try {
        await prisma.webhookNonce.create({
          data: {
            source: opts.source,
            nonce,
            expiresAt: new Date(now + NONCE_TTL_MS),
          },
        });
      } catch (e: any) {
        // Unique constraint violation => replay.
        if (e?.code === 'P2002') {
          return res.status(409).json({ error: 'webhook_replay_detected' });
        }
        throw e;
      }

      memCache.set(cacheKey, now + NONCE_TTL_MS);
      next();
    } catch (e) {
      logger.error('[antiReplay] failed', e instanceof Error ? e.message : String(e));
      res.status(500).json({ error: 'replay_check_failed' });
    }
  };
}

/** Constant-time string equality (useful for HMAC compares). */
export function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}