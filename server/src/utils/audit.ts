import { Request } from 'express';
import { logger } from './logger';
import { prisma } from '../db';
export type AuditEntry = {
  actorId?: string | null;
  actorRole?: string | null;
  action: string; // ex: 'order.update', 'enrollment.create', 'certificate.request'
  entityType: string; // ex: 'order', 'enrollment', 'task', 'schedule', 'certificate'
  entityId?: string | number | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Persist an audit trail entry. Never throws — audit failures must not break
 * the calling business logic.
 */
export async function audit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        actorRole: entry.actorRole ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId != null ? String(entry.entityId) : null,
        ip: entry.ip ?? null,
        userAgent: entry.userAgent ?? null,
        metadata: entry.metadata ? (entry.metadata as any) : undefined,
      },
    });
  } catch (e) {
    logger.error('[audit] failed to write audit log', e instanceof Error ? e.message : String(e));
  }
}

/** Helper extracting actor info from an authenticated Express request. */
export function actorFromRequest(req: Request): { actorId: string | null; actorRole: string | null; ip: string | null; userAgent: string | null } {
  const user = (req as any).user as { id?: string; role?: string } | undefined;
  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
    || req.socket?.remoteAddress
    || null;
  const userAgent = (req.headers['user-agent'] as string | undefined) || null;
  return {
    actorId: user?.id ?? null,
    actorRole: user?.role ?? null,
    ip,
    userAgent,
  };
}