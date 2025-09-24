import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
export const authRouter = Router();

function signToken(payload: object) {
  const secret = process.env.JWT_SECRET || 'dev_secret';
  return jwt.sign(payload as any, secret, { expiresIn: '7d' });
}

function setAuthCookie(res: any, token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('auth_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

authRouter.post('/sign-in', async (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });
  
  console.log('[AUTH] Login successful:', { 
    id: user.id, 
    email: user.email, 
    role: user.role, 
    isActive: user.isActive 
  });
  
  const token = signToken({ sub: user.id, role: user.role });
  setAuthCookie(res, token);
  res.json({ user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, isActive: user.isActive } });
});

authRouter.post('/sign-up', async (req: Request, res: Response) => {
  const { email, password, fullName } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: 'email already used' });
  const passwordHash = await bcrypt.hash(password, 12);
  
  // Créer l'utilisateur avec le rôle admin par défaut
  const created = await prisma.user.create({ 
    data: { 
      email, 
      passwordHash, 
      fullName: fullName || null,
      role: 'admin',  // Rôle admin par défaut
      isActive: true
    } 
  });
  
  console.log('[AUTH] User created with admin role:', { 
    id: created.id, 
    email: created.email, 
    role: created.role 
  });
  
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret') as any;
    const user = await prisma.user.findUnique({ 
      where: { id: decoded.sub },
      select: { id: true, email: true, fullName: true, role: true, isActive: true }
    });
    if (!user || !user.isActive) return res.json({ user: null });
    res.json({ user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, isActive: user.isActive } });
  } catch (error) {
    console.error('[AUTH] Session error:', error);
    return res.json({ user: null });
  }
});


