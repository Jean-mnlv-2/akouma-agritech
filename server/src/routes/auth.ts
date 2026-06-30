import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { env } from '../utils/env';
import { emailService } from '../utils/email';
import { issueCsrfToken } from '../middleware/csrf';
import { logger } from '../utils/logger';
import { createRateLimiter } from '../middleware/rateLimit';
import { verifyRecaptcha } from '../middleware/recaptcha';

const prisma = new PrismaClient();
export const authRouter = Router();

interface JwtPayload {
  sub: string;
  role: string;
}

function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
}

function setAuthCookie(res: Response, token: string): void {
  res.cookie('auth_token', token, {
    httpOnly: true,
    sameSite: env.isProduction() ? 'none' : 'lax',
    secure: env.isProduction(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

const signInLimiterIp = createRateLimiter({ windowMs: 60_000, max: 20 });
const signInLimiterEmail = createRateLimiter({
  windowMs: 60_000,
  max: 10,
  keyGenerator: (req) => String((req.body?.email || 'unknown')).toLowerCase().trim(),
});
const forgotLimiterIp = createRateLimiter({ windowMs: 60_000, max: 10 });
const forgotLimiterEmail = createRateLimiter({
  windowMs: 60_000,
  max: 5,
  keyGenerator: (req) => String((req.body?.email || 'unknown')).toLowerCase().trim(),
});

authRouter.post('/sign-in', signInLimiterIp, signInLimiterEmail, verifyRecaptcha('login'), async (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) return res.status(401).json({ error: 'invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });
  
  if (env.isDevelopment()) {
    logger.info('[AUTH] Login successful', { id: user.id, role: user.role, isActive: user.isActive });
  }
  
  const token = signToken({ sub: user.id, role: user.role });
  setAuthCookie(res, token);
  const csrfToken = issueCsrfToken(res);
  res.json({ user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, isActive: user.isActive }, csrfToken });
});

authRouter.post('/sign-up', verifyRecaptcha('signup'), async (req: Request, res: Response) => {
  const { email, password, fullName } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const normalizedSignupEmail = email.toLowerCase().trim();
  const exists = await prisma.user.findUnique({ where: { email: normalizedSignupEmail } });
  if (exists) return res.status(409).json({ error: 'email already used' });
  const passwordHash = await bcrypt.hash(password, 12);

  const safeFullName = typeof fullName === 'string' && fullName.trim().length > 0 ? fullName.trim() : null;

  const created = await prisma.user.create({
    data: {
      email: normalizedSignupEmail,
      passwordHash,
      fullName: safeFullName,
      role: 'customer',
      isActive: true,
    },
  });

  if (env.isDevelopment()) {
    logger.info('[AUTH] User created', { id: created.id, role: created.role });
  }

  const token = signToken({ sub: created.id, role: created.role });
  setAuthCookie(res, token);
  const csrfToken = issueCsrfToken(res);
  res.status(201).json({ user: { id: created.id, email: created.email, fullName: created.fullName, role: created.role, isActive: created.isActive }, csrfToken });
});

authRouter.post('/sign-out', async (req: Request, res: Response) => {
  res.clearCookie('auth_token', { path: '/' });
  res.clearCookie('csrf_token', { path: '/' });
  res.json({ success: true });
});

authRouter.get('/session', async (req: Request, res: Response) => {
  const token = req.cookies?.auth_token as string | undefined;
  if (!token) return res.json({ user: null });
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const user = await prisma.user.findUnique({ 
      where: { id: decoded.sub },
      select: { id: true, email: true, fullName: true, role: true, isActive: true }
    });
    if (!user || !user.isActive) return res.json({ user: null });
    const csrfToken = issueCsrfToken(res);
    res.json({ user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, isActive: user.isActive }, csrfToken });
  } catch (error) {
    if (env.isDevelopment()) {
      logger.warn('[AUTH] Session error', error);
    }
    return res.json({ user: null });
  }
});

authRouter.post('/forgot-password', forgotLimiterIp, forgotLimiterEmail, verifyRecaptcha('forgot_password'), async (req: Request, res: Response) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email requis' });
  
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    // Ne pas révéler si l'utilisateur existe
    return res.json({ message: 'Si un compte existe pour cet e-mail, un lien de réinitialisation sera envoyé.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 3600000);

  await prisma.user.update({
    where: { email: user.email },
    data: {
      resetToken: token,
      resetTokenExpiry: expiry,
    },
  });

  try {
    await emailService.sendResetPasswordEmail(user.email, token);
    res.json({ message: 'Lien de réinitialisation envoyé.' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'e-mail' });
  }
});

authRouter.post('/reset-password', async (req: Request, res: Response) => {
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ error: 'Token et nouveau mot de passe requis' });

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() }
    }
  });

  if (!user) return res.status(400).json({ error: 'Token invalide ou expiré' });

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null
    }
  });

  res.json({ success: true, message: 'Mot de passe réinitialisé avec succès' });
});


