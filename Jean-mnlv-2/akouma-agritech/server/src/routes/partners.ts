import { Router, Request, Response } from 'express';
import { authRequired, adminOnly } from '../middleware/authRequired';
import { prisma } from '../lib/prisma';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

export const partnersRouter = Router();
const uploadDir = path.resolve(process.cwd(), 'uploads', 'partners');
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: (error: any, destination: string) => void) => cb(null, uploadDir),
  filename: (_req: any, file: any, cb: (error: any, filename: string) => void) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname || '') || '.png';
    cb(null, `partner_${timestamp}${ext}`);
  },
});
const upload = multer({ storage });

// Public list
partnersRouter.get('/', async (_req: Request, res: Response) => {
  const items = await prisma.partner.findMany({ where: { isActive: true }, orderBy: [{ order: 'asc' }, { id: 'desc' }] });
  res.json({ data: items });
});

// Admin list (all)
partnersRouter.get('/admin', authRequired, adminOnly, async (_req: Request, res: Response) => {
  const items = await prisma.partner.findMany({ orderBy: [{ order: 'asc' }, { id: 'desc' }] });
  res.json({ data: items });
});

partnersRouter.post('/', authRequired, adminOnly, async (req: Request, res: Response) => {
  const { name, logo, logoUrl, imageUrl, type, description, year, website, contact, isActive, order } = req.body || {};
  if (!name) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.partner.create({ data: { name, logo, logoUrl, imageUrl, type, description, year, website, contact, isActive: isActive ?? true, order: order ?? 0 } });
  res.status(201).json({ data: created });
});

partnersRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, logo, logoUrl, imageUrl, type, description, year, website, contact, isActive, order } = req.body || {};
  const updated = await prisma.partner.update({ where: { id }, data: { name, logo, logoUrl, imageUrl, type, description, year, website, contact, isActive, order } });
  res.json({ data: updated });
});

partnersRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.partner.delete({ where: { id } });
  res.json({ success: true });
});

// Upload d'image/logo
partnersRouter.post('/upload', authRequired, adminOnly, upload.single('file'), async (req: Request, res: Response) => {
  const file = (req as any).file as any;
  if (!file) return res.status(400).json({ error: 'file missing' });
  const publicUrl = `/uploads/partners/${file.filename}`;
  res.json({ url: publicUrl });
});


