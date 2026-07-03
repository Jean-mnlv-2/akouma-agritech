import type { Request, Response, NextFunction } from 'express';
import { env } from '../utils/env';
import { logger } from '../utils/logger';

export function internalApiAuth(req: Request, res: Response, next: NextFunction) {
  // Get the token from Authorization header or request body
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader?.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : undefined;
  const tokenFromBody = req.body?.internalApiToken;

  const token = tokenFromHeader || tokenFromBody;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Token missing' });
  }

  if (token !== env.INTERNAL_API_TOKEN) {
    logger.warn('Invalid internal API token attempt');
    return res.status(403).json({ error: 'Unauthorized: Invalid token' });
  }

  next();
}
