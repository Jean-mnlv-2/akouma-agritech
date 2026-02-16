import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { env } from '../utils/env';
import { AuthService } from '../services/authService';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const authService = new AuthService(prisma);
export const authRouter = Router();

function setAuthCookie(res: Response, token: string): void {
  res.cookie('auth_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

authRouter.post('/sign-in', async (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const { token, user } = await authService.signInWithEmail(email, password);
    if (env.isDevelopment()) {
      logger.info('[AUTH] Login successful', {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      });
    }
    setAuthCookie(res, token);
    res.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'invalid credentials';
    if (message === 'invalid credentials') {
      return res.status(401).json({ error: 'invalid credentials' });
    }
    if (message === 'account disabled') {
      return res.status(403).json({ error: 'account disabled' });
    }
    logger.error('[AUTH] sign-in error', error);
    res.status(500).json({ error: 'authentication failed' });
  }
});

authRouter.post('/sign-up', async (req: Request, res: Response) => {
  const { email, password, fullName } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const { token, user } = await authService.signUpWithEmail(email, password, fullName);
    if (env.isDevelopment()) {
      logger.info('[AUTH] User created', {
        id: user.id,
        email: user.email,
        role: user.role,
      });
    }
    setAuthCookie(res, token);
    res.status(201).json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'registration failed';
    if (message === 'email already used') {
      return res.status(409).json({ error: 'email already used' });
    }
    logger.error('[AUTH] sign-up error', error);
    res.status(500).json({ error: 'registration failed' });
  }
});

authRouter.post('/sign-out', async (req: Request, res: Response) => {
  res.clearCookie('auth_token', { path: '/' });
  res.json({ success: true });
});

authRouter.get('/session', async (req: Request, res: Response) => {
  const token = req.cookies?.auth_token as string | undefined;
  if (!token) return res.json({ user: null });
  try {
    const user = await authService.getUserFromToken(token);
    if (!user) return res.json({ user: null });
    res.json({ user });
  } catch (error) {
    if (env.isDevelopment()) {
      logger.error('[AUTH] Session error', error);
    }
    return res.json({ user: null });
  }
});


