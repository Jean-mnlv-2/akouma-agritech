import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { env } from '../utils/env';
import { emailService } from '../utils/email';
import { issueCsrfToken } from '../middleware/csrf';
import { logger } from '../utils/logger';
import { createRateLimiter } from '../middleware/rateLimit';
import { verifyRecaptcha } from '../middleware/recaptcha';
import { validate } from '../middleware/validate';
import { prisma } from '../db';
export const authRouter = Router();

// Password policy: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une lettre majuscule')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une lettre minuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Le mot de passe doit contenir au moins un caractère spécial');

const signUpSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: passwordSchema,
  fullName: z.string().optional(),
}).strict();

const resetPasswordSchema = z.object({
  token: z.string(),
  password: passwordSchema,
}).strict();

interface JwtPayload {
  sub: string;
  role: string;
}

// Access token court (1h) — refresh token 14j pour renouvellement silencieux.
const ACCESS_TOKEN_TTL = '1h';
const ACCESS_TOKEN_MAX_AGE_MS = 60 * 60 * 1000;
const REFRESH_TOKEN_TTL = '14d';
const REFRESH_TOKEN_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}
function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign({ ...payload, typ: 'refresh' }, env.JWT_SECRET, { expiresIn: REFRESH_TOKEN_TTL });
}

function setAuthCookie(res: Response, token: string): void {
  res.cookie('auth_token', token, {
    httpOnly: true,
    sameSite: env.isProduction() ? 'none' : 'lax',
    secure: env.isProduction(),
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    path: '/',
  });
}
function setRefreshCookie(res: Response, token: string): void {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    sameSite: env.isProduction() ? 'none' : 'lax',
    secure: env.isProduction(),
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    // Scope au strict minimum : uniquement les endpoints d'auth
    path: '/auth',
  });
}
function issueSession(res: Response, payload: JwtPayload): void {
  setAuthCookie(res, signAccessToken(payload));
  setRefreshCookie(res, signRefreshToken(payload));
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
  
  issueSession(res, { sub: user.id, role: user.role });
  const csrfToken = issueCsrfToken(res);
  res.json({ user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, isActive: user.isActive }, csrfToken });
});

authRouter.post('/sign-up', verifyRecaptcha('signup'), validate(signUpSchema), async (req: Request, res: Response) => {
  const { email, password, fullName } = req.body;
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

  issueSession(res, { sub: created.id, role: created.role });
  const csrfToken = issueCsrfToken(res);
  res.status(201).json({ user: { id: created.id, email: created.email, fullName: created.fullName, role: created.role, isActive: created.isActive }, csrfToken });
});

authRouter.post('/sign-out', async (req: Request, res: Response) => {
  res.clearCookie('auth_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/auth' });
  res.clearCookie('csrf_token', { path: '/' });
  res.json({ success: true });
});

// Renouvelle un access token via le refresh token (rotation).
const refreshLimiter = createRateLimiter({ windowMs: 60_000, max: 30 });
authRouter.post('/refresh', refreshLimiter, async (req: Request, res: Response) => {
  const refresh = req.cookies?.refresh_token as string | undefined;
  if (!refresh) return res.status(401).json({ error: 'no_refresh_token' });
  let decoded: JwtPayload & { typ?: string };
  try {
    decoded = jwt.verify(refresh, env.JWT_SECRET) as JwtPayload & { typ?: string };
  } catch {
    res.clearCookie('refresh_token', { path: '/auth' });
    return res.status(401).json({ error: 'invalid_refresh_token' });
  }
  if (decoded.typ !== 'refresh') {
    return res.status(401).json({ error: 'invalid_refresh_token' });
  }
  const user = await prisma.user.findUnique({
    where: { id: decoded.sub },
    select: { id: true, email: true, fullName: true, role: true, isActive: true },
  });
  if (!user || !user.isActive) {
    res.clearCookie('auth_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/auth' });
    return res.status(401).json({ error: 'account_disabled' });
  }
  // Rotation : nouveau access + nouveau refresh à chaque appel
  issueSession(res, { sub: user.id, role: user.role });
  const csrfToken = issueCsrfToken(res);
  res.json({ user, csrfToken });
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

authRouter.post('/reset-password', validate(resetPasswordSchema), async (req: Request, res: Response) => {
  const { token, password } = req.body;

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


