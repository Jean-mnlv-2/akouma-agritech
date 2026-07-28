import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { authRequired, moduleAccess, invalidateAuthCache } from '../middleware/authRequired';
import { emailService } from '../utils/email';
import { prisma } from '../db';
const ALLOWED_ROLES = ['admin', 'supervisor', 'customer'] as const;
const isAllowedRole = (value: unknown): value is (typeof ALLOWED_ROLES)[number] =>
  typeof value === 'string' && (ALLOWED_ROLES as readonly string[]).includes(value);
export const profilesRouter = Router();

// List profiles (compat)
profilesRouter.get('/', authRequired, moduleAccess('users'), async (req: Request, res: Response) => {
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
        createdAt: true
      }
    });
    
    // On vérifie le rôle directement depuis le token décodé par authRequired
    const userRole = req.user?.role;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[GET /profiles] Request by ${userRole}. Total users: ${users.length}`);
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
    }));
    
    res.json({ data });
  } catch (error: any) {
    console.error('[GET /profiles] Error:', error);
    res.status(500).json({ error: 'failed_to_list_profiles', details: error?.message });
  }
});

profilesRouter.post('/', authRequired, moduleAccess('users'), async (req: Request, res: Response) => {
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
  // SÉCURITÉ: `role`/`allowedModules` ne sont modifiables que par un admin.
  // Un superviseur autorisé sur le module "users" (gestion des profils
  // clients) ne doit jamais pouvoir s'auto-promouvoir admin ou s'accorder
  // d'autres modules via ce même endpoint.
  const isAdmin = req.user?.role === 'admin';
  const providedRole = isAdmin && isAllowedRole(role) ? role : null;
  const normalizedModules = isAdmin && Array.isArray(allowedModules || allowed_modules) ? (allowedModules || allowed_modules) : [];

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
        ...(isAdmin ? { allowedModules: normalizedModules } : {}),
      },
      select: { id: true, email: true, fullName: true, isActive: true, role: true, createdAt: true, allowedModules: true },
    });
  } else {
    // Create new user - use reset token instead of temp password
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const passwordHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 12);

    result = await prisma.user.create({
      data: {
        email,
        fullName,
        isActive: normalizedIsActive,
        role: providedRole ?? 'customer',
        passwordHash,
        allowedModules: normalizedModules,
        resetToken,
        resetTokenExpiry,
      },
      select: { id: true, email: true, fullName: true, isActive: true, role: true, createdAt: true, allowedModules: true },
    });

    // Envoyer l'email si c'est un superviseur ou un admin
    if (result.role === 'supervisor' || result.role === 'admin') {
      emailService.sendSupervisorWelcomeEmail(result.email, result.fullName || result.email, resetToken);
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
  }});
});

profilesRouter.put('/:id', authRequired, moduleAccess('users'), async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { email, first_name, last_name, firstName, lastName, is_active, isActive, role, allowed_modules, allowedModules } = req.body || {};
    const fullName = [first_name ?? firstName, last_name ?? lastName].filter(Boolean).join(' ').trim() || null;
    const normalizedIsActive = typeof isActive === 'boolean'
      ? isActive
      : (typeof is_active === 'string' ? is_active === 'true' : is_active);
    // SÉCURITÉ: voir POST ci-dessus — seul un admin peut changer role/allowedModules.
    const isAdmin = req.user?.role === 'admin';
    const normalizedRole = isAdmin && isAllowedRole(role) ? role : undefined;
    const normalizedModules = isAdmin && Array.isArray(allowedModules || allowed_modules) ? (allowedModules || allowed_modules) : undefined;

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
        allowedModules: true
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
    } });
  } catch (e: any) {
    res.status(400).json({ error: 'update_failed', details: e?.message });
  }
});

profilesRouter.delete('/:id', authRequired, moduleAccess('users'), async (req: Request, res: Response) => {
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
