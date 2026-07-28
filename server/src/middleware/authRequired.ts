import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../utils/env';
import { prisma } from '../db';
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

/**
 * Comme `authRequired`, mais ne rejette jamais la requête : renseigne
 * `req.user` si un cookie/jeton valide est présent, sinon laisse passer sans
 * utilisateur. Utile pour les routes publiques (catalogue semences, offres
 * d'emploi, événements) qui doivent rester accessibles sans connexion tout en
 * révélant le contenu non publié aux seuls admin/superviseur.
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const token = (req.cookies?.auth_token as string | undefined) || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : undefined);
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const status = await loadUserStatus(decoded.sub);
    if (status?.isActive) {
      req.user = { id: decoded.sub, role: status.role };
    }
  } catch {
    // Jeton invalide/expiré : traité comme un visiteur anonyme, pas une erreur.
  }
  next();
}

export function adminOnly(req: Request, res: Response, next: NextFunction) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'unauthorized' });
  if (user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  next();
}

export function supervisorOnly(req: Request, res: Response, next: NextFunction) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'unauthorized' });
  if (!(user.role === 'admin' || user.role === 'supervisor')) return res.status(403).json({ error: 'forbidden' });
  next();
}

/**
 * Autorise un admin (toujours) ou un superviseur dont `allowedModules`
 * contient `moduleKey` (à charger depuis la base, `req.user.role` seul ne
 * suffit pas — c'est exactement ce que l'UI admin (Admin.tsx) promet déjà à
 * l'utilisateur : sans ce contrôle backend, un superviseur voit les
 * formulaires de gestion pour un module qui lui a été accordé, mais toute
 * soumission échoue en 403 puisque les routes n'étaient protégées que par
 * `adminOnly`. Remplace `adminOnly` sur les routes d'écriture des modules
 * assignables (voir la liste `ADMIN_MODULES` côté frontend, src/lib/adminModules.ts,
 * qui doit rester synchronisée avec les clés utilisées ici).
 */
export function moduleAccess(moduleKey: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'unauthorized' });
    if (user.role === 'admin') return next();
    if (user.role === 'supervisor') {
      const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { allowedModules: true } });
      if (dbUser?.allowedModules.includes(moduleKey)) return next();
    }
    return res.status(403).json({ error: 'forbidden' });
  };
}


