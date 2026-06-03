import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly, adminOrSupervisorWithUsers, invalidateAuthCache } from '../middleware/authRequired';
import { emailService } from '../utils/email';

const prisma = new PrismaClient();
const ALLOWED_ROLES = ['admin', 'supervisor', 'customer'] as const;
const isAllowedRole = (value: unknown): value is (typeof ALLOWED_ROLES)[number] =>
  typeof value === 'string' && (ALLOWED_ROLES as readonly string[]).includes(value);
export const profilesRouter = Router();

// List profiles (compat)
profilesRouter.get('/', authRequired, adminOrSupervisorWithUsers, async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({ 
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        allowedModules: true,
        tempPassword: true,
        createdAt: true
      }
    });
    
    // On vérifie le rôle directement depuis le token décodé par authRequired
    const userRole = req.user?.role;
    const isAdmin = userRole === 'admin';
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[GET /profiles] Request by ${userRole} (isAdmin: ${isAdmin}). Total users: ${users.length}`);
    }
    
    const data = users.map(u => ({
      id: u.id,
      email: u.email,
      first_name: (u.fullName || '').split(' ')[0] || null,
      last_name: (u.fullName || '').split(' ').slice(1).join(' ') || null,
      role: u.role,
      created_at: u.createdAt,
      is_active: u.isActive,
      allowed_modules: u.allowedModules || [],
      // S'assurer que temp_password est présent dans l'objet si admin
      temp_password: isAdmin ? (u.tempPassword || null) : undefined,
    }));
    
    res.json({ data });
  } catch (error: any) {
    console.error('[GET /profiles] Error:', error);
    res.status(500).json({ error: 'failed_to_list_profiles', details: error?.message });
  }
});

profilesRouter.post('/', authRequired, adminOnly, async (req: Request, res: Response) => {
  const {
    user_id, id,
    email,
    first_name, last_name,
    firstName, lastName,
    is_active, isActive,
    role,
    allowed_modules, allowedModules,
  } = req.body || {};

  if (!email) return res.status(400).json({ error: 'email required' });

  const normalizedIsActive = typeof isActive === 'boolean' ? isActive : (is_active !== false);
  const fullName = [first_name ?? firstName, last_name ?? lastName].filter(Boolean).join(' ').trim() || null;
  const providedRole = isAllowedRole(role) ? role : null;
  const normalizedModules = Array.isArray(allowedModules || allowed_modules) ? (allowedModules || allowed_modules) : [];

  const targetId = String(user_id || id || '');

  let result;
  if (targetId) {
    // Update existing user
    result = await prisma.user.update({
      where: { id: targetId },
      data: {
        email,
        fullName,
        isActive: normalizedIsActive,
        ...(providedRole ? { role: providedRole } : {}),
        allowedModules: normalizedModules,
      },
      select: { id: true, email: true, fullName: true, isActive: true, role: true, createdAt: true, allowedModules: true, tempPassword: true },
    });
  } else {
    // Create new user (optional provided password)
    const plainPassword: string | undefined = (req.body?.password && String(req.body.password)) || undefined;
    const passwordSource = plainPassword && plainPassword.length >= 6
      ? plainPassword
      : crypto.randomBytes(12).toString('hex');
    const passwordHash = await bcrypt.hash(passwordSource, 12);

    result = await prisma.user.create({
      data: {
        email,
        fullName,
        isActive: normalizedIsActive,
        role: providedRole ?? 'customer',
        passwordHash,
        allowedModules: normalizedModules,
        tempPassword: passwordSource,
      },
      select: { id: true, email: true, fullName: true, isActive: true, role: true, createdAt: true, allowedModules: true, tempPassword: true },
    });

    // Envoyer l'email si c'est un superviseur ou un admin
    if (result.role === 'supervisor' || result.role === 'admin') {
      emailService.sendSupervisorWelcomeEmail(result.email, result.fullName || result.email, passwordSource);
    }
  }

  res.status(201).json({ data: {
    id: result.id,
    email: result.email,
    first_name: result.fullName?.split(' ')[0] || null,
    last_name: result.fullName?.split(' ').slice(1).join(' ') || null,
    is_active: result.isActive,
    role: result.role,
    created_at: result.createdAt,
    allowed_modules: result.allowedModules || [],
    temp_password: result.tempPassword,
  }});
});

profilesRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { email, first_name, last_name, firstName, lastName, is_active, isActive, role, allowed_modules, allowedModules } = req.body || {};
    const fullName = [first_name ?? firstName, last_name ?? lastName].filter(Boolean).join(' ').trim() || null;
    const normalizedIsActive = typeof isActive === 'boolean'
      ? isActive
      : (typeof is_active === 'string' ? is_active === 'true' : is_active);
    const normalizedRole = isAllowedRole(role) ? role : undefined;
    const normalizedModules = Array.isArray(allowedModules || allowed_modules) ? (allowedModules || allowed_modules) : undefined;

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(email ? { email } : {}),
        ...(fullName !== null ? { fullName } : {}),
        ...(typeof normalizedIsActive === 'boolean' ? { isActive: normalizedIsActive } : {}),
        ...(normalizedRole ? { role: normalizedRole } : {}),
        ...(normalizedModules ? { allowedModules: normalizedModules } : {}),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
        role: true,
        createdAt: true,
        allowedModules: true,
        tempPassword: true
      }
    });
    invalidateAuthCache(id);
    res.json({ data: {
      id: updated.id,
      email: updated.email,
      first_name: updated.fullName?.split(' ')[0] || null,
      last_name: updated.fullName?.split(' ').slice(1).join(' ') || null,
      is_active: updated.isActive,
      role: updated.role,
      created_at: updated.createdAt,
      allowed_modules: updated.allowedModules || [],
      temp_password: updated.tempPassword,
    } });
  } catch (e: any) {
    res.status(400).json({ error: 'update_failed', details: e?.message });
  }
});

profilesRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    await prisma.user.delete({ where: { id } });
    invalidateAuthCache(id);
    res.json({ success: true });
  } catch (e: any) {
    // Foreign key constraint: fallback to soft delete (deactivate)
    try {
      await prisma.user.update({ where: { id }, data: { isActive: false } });
      invalidateAuthCache(id);
      res.json({ success: true, softDeleted: true });
    } catch (e2: any) {
      res.status(400).json({ error: 'delete_failed', details: e2?.message });
    }
  }
});
