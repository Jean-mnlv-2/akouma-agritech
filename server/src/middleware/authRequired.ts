import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { env } from '../utils/env';

const prisma = new PrismaClient();

interface JwtPayload {
  sub: string;
  role: string;
}

// Lightweight in-memory cache to avoid hitting the DB on every authenticated request.
// We still re-check the DB every CACHE_TTL_MS so deactivated users / role changes
// take effect quickly without invalidating their JWT manually.
const CACHE_TTL_MS = 30_000;
type CachedUser = { role: string; isActive: boolean; expiresAt: number };
const userCache = new Map<string, CachedUser>();

async function loadUserStatus(userId: string): Promise<{ role: string; isActive: boolean } | null> {
  const now = Date.now();
  const cached = userCache.get(userId);
  if (cached && cached.expiresAt > now) {
    return { role: cached.role, isActive: cached.isActive };
  }
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isActive: true },
  });
  if (!dbUser) {
    userCache.delete(userId);
    return null;
  }
  userCache.set(userId, { role: dbUser.role, isActive: dbUser.isActive, expiresAt: now + CACHE_TTL_MS });
  return { role: dbUser.role, isActive: dbUser.isActive };
}

export function invalidateAuthCache(userId?: string) {
  if (userId) userCache.delete(userId);
  else userCache.clear();
}

export async function authRequired(req: Request, res: Response, next: NextFunction) {
  const token = (req.cookies?.auth_token as string | undefined) || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : undefined);
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch {
    return res.status(401).json({ error: 'unauthorized' });
  }
  try {
    const status = await loadUserStatus(decoded.sub);
    if (!status) return res.status(401).json({ error: 'unauthorized' });
    if (!status.isActive) {
      console.warn(`[auth] Rejected request from deactivated user ${decoded.sub}`);
      return res.status(401).json({ error: 'account_disabled' });
    }
    // Always trust the DB-stored role over the JWT claim (role may have changed).
    req.user = { id: decoded.sub, role: status.role };
    next();
  } catch (e) {
    console.error('[auth] Error verifying user status', e);
    return res.status(401).json({ error: 'unauthorized' });
  }
}

export function adminOnly(req: Request, res: Response, next: NextFunction) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'unauthorized' });
  if (user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  next();
}

export async function adminOrSupervisorWithUsers(req: Request, res: Response, next: NextFunction) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'unauthorized' });
  if (user.role === 'admin') return next();
  
  if (user.role === 'supervisor') {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (dbUser?.allowedModules.includes('users')) {
      return next();
    }
  }
  
  return res.status(403).json({ error: 'forbidden' });
}

export function supervisorOnly(req: Request, res: Response, next: NextFunction) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'unauthorized' });
  if (!(user.role === 'admin' || user.role === 'supervisor')) return res.status(403).json({ error: 'forbidden' });
  next();
}


