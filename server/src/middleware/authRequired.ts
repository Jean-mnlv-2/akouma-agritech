import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authRequired(req: Request, res: Response, next: NextFunction) {
  const token = (req.cookies?.auth_token as string | undefined) || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : undefined);
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret') as any;
    (req as any).user = { id: decoded.sub, role: decoded.role };
    next();
  } catch {
    return res.status(401).json({ error: 'unauthorized' });
  }
}

export function adminOnly(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as { id: string; role: string } | undefined;
  if (!user) return res.status(401).json({ error: 'unauthorized' });
  if (user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  next();
}

export function supervisorOnly(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as { id: string; role: string } | undefined;
  if (!user) return res.status(401).json({ error: 'unauthorized' });
  if (!(user.role === 'admin' || user.role === 'supervisor')) return res.status(403).json({ error: 'forbidden' });
  next();
}


