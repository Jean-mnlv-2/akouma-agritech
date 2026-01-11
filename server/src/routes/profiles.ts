import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

import { authRequired, adminOnly } from '../middleware/authRequired';

const ALLOWED_ROLES = ['admin', 'supervisor', 'customer'] as const;
const isAllowedRole = (value: unknown): value is (typeof ALLOWED_ROLES)[number] =>
  typeof value === 'string' && (ALLOWED_ROLES as readonly string[]).includes(value);
export const profilesRouter = Router();

// List profiles (compat)
profilesRouter.get('/', authRequired, adminOnly, async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  const data = users.map(u => ({
    id: u.id,
    email: u.email,
    first_name: (u.fullName || '').split(' ')[0] || null,
    last_name: (u.fullName || '').split(' ').slice(1).join(' ') || null,
    role: u.role,
    created_at: u.createdAt,
    is_active: u.isActive,
  }));
  res.json({ data });
});

profilesRouter.post('/', authRequired, adminOnly, async (req: Request, res: Response) => {
  const {
    user_id, id,
    email,
    first_name, last_name,
    firstName, lastName,
    is_active, isActive,
    role,
  } = req.body || {};

  if (!email) return res.status(400).json({ error: 'email required' });

  const normalizedIsActive = typeof isActive === 'boolean' ? isActive : (is_active !== false);
  const fullName = [first_name ?? firstName, last_name ?? lastName].filter(Boolean).join(' ').trim() || null;
  const providedRole = isAllowedRole(role) ? role : null;

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
      },
      select: { id: true, email: true, fullName: true, isActive: true, role: true, createdAt: true },
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
      },
      select: { id: true, email: true, fullName: true, isActive: true, role: true, createdAt: true },
    });
  }

  res.status(201).json({ data: {
    id: result.id,
    email: result.email,
    first_name: result.fullName?.split(' ')[0] || null,
    last_name: result.fullName?.split(' ').slice(1).join(' ') || null,
    is_active: result.isActive,
    role: result.role,
    created_at: result.createdAt,
  }});
});

profilesRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { email, first_name, last_name, firstName, lastName, is_active, isActive, role } = req.body || {};
    const fullName = [first_name ?? firstName, last_name ?? lastName].filter(Boolean).join(' ').trim() || null;
    const normalizedIsActive = typeof isActive === 'boolean'
      ? isActive
      : (typeof is_active === 'string' ? is_active === 'true' : is_active);
    const normalizedRole = isAllowedRole(role) ? role : undefined;

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(email ? { email } : {}),
        ...(fullName !== null ? { fullName } : {}),
        ...(typeof normalizedIsActive === 'boolean' ? { isActive: normalizedIsActive } : {}),
        ...(normalizedRole ? { role: normalizedRole } : {}),
      }
    });
    res.json({ data: {
      id: updated.id,
      email: updated.email,
      first_name: updated.fullName?.split(' ')[0] || null,
      last_name: updated.fullName?.split(' ').slice(1).join(' ') || null,
      is_active: updated.isActive,
      role: updated.role,
      created_at: updated.createdAt,
    } });
  } catch (e: any) {
    res.status(400).json({ error: 'update_failed', details: e?.message });
  }
});

profilesRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    await prisma.user.delete({ where: { id } });
    res.json({ success: true });
  } catch (e: any) {
    // Foreign key constraint: fallback to soft delete (deactivate)
    try {
      await prisma.user.update({ where: { id }, data: { isActive: false } });
      res.json({ success: true, softDeleted: true });
    } catch (e2: any) {
      res.status(400).json({ error: 'delete_failed', details: e2?.message });
    }
  }
});
