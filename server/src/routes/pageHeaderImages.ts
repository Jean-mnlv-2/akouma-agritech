import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authRequired, adminOnly } from '../middleware/authRequired';
import { csrfRequired } from '../middleware/csrf';

const prisma = new PrismaClient();
export const pageHeaderImagesRouter = Router();

const PageKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9_-]+$/i, 'pageKey must be alphanumeric/_/-');

const UpsertSchema = z.object({
  pageKey: PageKeySchema,
  imageUrl: z.string().trim().min(1).max(2048),
  altText: z.string().trim().max(255).optional().nullable(),
  title: z.string().trim().max(255).optional().nullable(),
  subtitle: z.string().trim().max(500).optional().nullable(),
  ctaLabel: z.string().trim().max(100).optional().nullable(),
  ctaUrl: z.string().trim().max(2048).optional().nullable(),
  order: z.coerce.number().int().min(0).max(9999).optional(),
  isActive: z.boolean().optional(),
});

// PUBLIC: list active images for a page (used by every public page)
pageHeaderImagesRouter.get('/', async (req: Request, res: Response) => {
  const pageKey = typeof req.query.pageKey === 'string' ? req.query.pageKey : '';
  const parsed = PageKeySchema.safeParse(pageKey);
  if (!parsed.success) return res.status(400).json({ error: 'invalid pageKey' });
  const items = await prisma.pageHeaderImage.findMany({
    where: { pageKey: parsed.data, isActive: true },
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
  });
  res.json({ data: items });
});

// ADMIN list (all pages or filter)
pageHeaderImagesRouter.get('/admin', authRequired, adminOnly, async (req: Request, res: Response) => {
  const pageKey = typeof req.query.pageKey === 'string' ? req.query.pageKey : undefined;
  const where = pageKey ? { pageKey } : undefined;
  const items = await prisma.pageHeaderImage.findMany({
    where,
    orderBy: [{ pageKey: 'asc' }, { order: 'asc' }, { id: 'asc' }],
  });
  res.json({ data: items });
});

// ADMIN distinct page keys (for dropdown helper)
pageHeaderImagesRouter.get('/admin/keys', authRequired, adminOnly, async (_req: Request, res: Response) => {
  const rows = await prisma.pageHeaderImage.groupBy({ by: ['pageKey'] });
  res.json({ data: rows.map((r: { pageKey: string }) => r.pageKey) });
});

pageHeaderImagesRouter.post('/', authRequired, adminOnly, csrfRequired, async (req: Request, res: Response) => {
  const parsed = UpsertSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  const created = await prisma.pageHeaderImage.create({ data: parsed.data });
  res.status(201).json({ data: created });
});

pageHeaderImagesRouter.put('/:id', authRequired, adminOnly, csrfRequired, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid id' });
  const parsed = UpsertSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  try {
    const updated = await prisma.pageHeaderImage.update({ where: { id }, data: parsed.data });
    res.json({ data: updated });
  } catch {
    res.status(404).json({ error: 'not found' });
  }
});

pageHeaderImagesRouter.patch('/:id/toggle', authRequired, adminOnly, csrfRequired, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid id' });
  const existing = await prisma.pageHeaderImage.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'not found' });
  const updated = await prisma.pageHeaderImage.update({ where: { id }, data: { isActive: !existing.isActive } });
  res.json({ data: updated });
});

// Bulk reorder slides for a given pageKey (drag & drop persistence)
const ReorderSchema = z.object({
  pageKey: PageKeySchema,
  orderedIds: z.array(z.coerce.number().int().positive()).min(1).max(200),
});

pageHeaderImagesRouter.post('/reorder', authRequired, adminOnly, csrfRequired, async (req: Request, res: Response) => {
  const parsed = ReorderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  const { pageKey, orderedIds } = parsed.data;
  await prisma.$transaction(
    orderedIds.map((id: number, idx: number) =>
      prisma.pageHeaderImage.updateMany({ where: { id, pageKey }, data: { order: idx } })
    )
  );
  const items = await prisma.pageHeaderImage.findMany({
    where: { pageKey },
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
  });
  res.json({ data: items });
});

pageHeaderImagesRouter.delete('/:id', authRequired, adminOnly, csrfRequired, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid id' });
  try {
    await prisma.pageHeaderImage.delete({ where: { id } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'not found' });
  }
});