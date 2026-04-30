import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../utils/env';

function parseCookie(req: Request, name: string): string | undefined {
  const raw = req.headers.cookie;
  if (!raw) return undefined;
  const parts = raw.split(';');
  for (const part of parts) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return undefined;
}

export function issueCsrfToken(res: Response): string {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie('csrf_token', token, {
    httpOnly: false,
    sameSite: env.isProduction() ? 'none' : 'lax',
    secure: env.isProduction(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
  return token;
}

/**
 * Double-submit CSRF protection for cookie-based auth.
 * - If request is authenticated via Bearer token, CSRF is not required.
 * - For unsafe methods, require header x-csrf-token to match csrf_token cookie.
 */
export function csrfRequired(req: Request, res: Response, next: NextFunction) {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next();

  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) return next();

  const headerToken = String(req.headers['x-csrf-token'] || '');
  const cookieToken = (req.cookies?.csrf_token as string | undefined) || parseCookie(req, 'csrf_token');

  if (!headerToken || !cookieToken) {
    return res.status(403).json({ error: 'csrf required' });
  }

  if (headerToken !== cookieToken) {
    return res.status(403).json({ error: 'csrf invalid' });
  }

  next();
}

