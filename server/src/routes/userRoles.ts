import { Router, Request, Response } from 'express';
import { authRequired, adminOnly } from '../middleware/authRequired';
// SÉCURITÉ: contrairement à profiles.ts (superviseurs autorisés sur le module
// "users"), l'attribution de rôles reste strictement admin-only : l'ouvrir
// aux superviseurs permettrait à l'un d'eux de se (ou de) promouvoir admin.
import { prisma } from '../db';
const ALLOWED_ROLES = ['admin', 'supervisor', 'customer'] as const;
export const userRolesRouter = Router();

userRolesRouter.get('/', authRequired, adminOnly, async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({ select: { id: true, role: true } });
  const data = users.map(u => ({ user_id: u.id, role: u.role, assigned_by: u.id }));
  res.json({ data });
});

userRolesRouter.post('/', authRequired, adminOnly, async (req: Request, res: Response) => {
  const { user_id, role } = req.body || {};
  if (!user_id || !role) return res.status(400).json({ error: 'user_id and role required' });
  if (!ALLOWED_ROLES.includes(role)) return res.status(400).json({ error: 'invalid role' });
  const updated = await prisma.user.update({ where: { id: String(user_id) }, data: { role } });
  res.status(201).json({ data: { user_id: updated.id, role: updated.role, assigned_by: updated.id } });
});

userRolesRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { role } = req.body || {};
  if (!role) return res.status(400).json({ error: 'role required' });
  if (!ALLOWED_ROLES.includes(role)) return res.status(400).json({ error: 'invalid role' });
  const updated = await prisma.user.update({ where: { id }, data: { role } });
  res.json({ data: { user_id: updated.id, role: updated.role, assigned_by: updated.id } });
});

userRolesRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = String(req.params.id);
  // No-op delete in compat; set role to 'customer'
  const updated = await prisma.user.update({ where: { id }, data: { role: 'customer' } });
  res.json({ data: { user_id: updated.id, role: updated.role, assigned_by: updated.id } });
});
