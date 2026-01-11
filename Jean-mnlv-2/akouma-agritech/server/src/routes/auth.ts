import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../utils/env';
import { prisma } from '../lib/prisma';
import { authLimiter, signUpLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';
import { signInSchema, signUpSchema } from '../schemas/auth.schema';

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
    sameSite: 'lax',
    secure: env.isProduction(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

authRouter.post('/sign-in', authLimiter, validate(signInSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });
  
  if (env.isDevelopment()) {
    console.log('[AUTH] Login successful:', { 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      isActive: user.isActive 
    });
  }
  
  const token = signToken({ sub: user.id, role: user.role });
  setAuthCookie(res, token);
  res.json({ user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, isActive: user.isActive } });
});

authRouter.post('/sign-up', signUpLimiter, validate(signUpSchema), async (req: Request, res: Response) => {
  const { email, password, fullName } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: 'email already used' });
  const passwordHash = await bcrypt.hash(password, 12);

  const safeFullName = typeof fullName === 'string' && fullName.trim().length > 0 ? fullName.trim() : null;

  const created = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName: safeFullName,
      role: 'customer',
      isActive: true,
    },
  });

  if (env.isDevelopment()) {
    console.log('[AUTH] User created:', {
      id: created.id,
      email: created.email,
      role: created.role,
    });
  }

  const token = signToken({ sub: created.id, role: created.role });
  setAuthCookie(res, token);
  res.status(201).json({ user: { id: created.id, email: created.email, fullName: created.fullName, role: created.role, isActive: created.isActive } });
});

authRouter.post('/sign-out', async (req: Request, res: Response) => {
  res.clearCookie('auth_token', { path: '/' });
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
    res.json({ user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, isActive: user.isActive } });
  } catch (error) {
    if (env.isDevelopment()) {
      console.error('[AUTH] Session error:', error);
    }
    return res.json({ user: null });
  }
});


