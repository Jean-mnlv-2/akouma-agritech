import { Router, Request, Response } from 'express';
import { authRequired, moduleAccess } from '../middleware/authRequired';
import { prisma } from '../db';

export const innovativeSolutionsRouter = Router();

const includeImpact = { donationImpact: { select: { id: true, slug: true, isActive: true } } } as const;

function parseFeatures(input: unknown): string[] | undefined {
  if (input == null) return undefined;
  if (Array.isArray(input)) return input.map((v) => String(v).trim()).filter(Boolean).slice(0, 6);
  return undefined;
}

// Public list
innovativeSolutionsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const items = await prisma.innovativeSolution.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
      include: includeImpact,
    });
    res.json({ data: items });
  } catch (error: any) {
    if (error?.code === 'P2021') return res.json({ data: [] });
    res.status(500).json({ error: error?.message || 'Failed to fetch innovative solutions' });
  }
});

// Admin list (all, including inactive)
innovativeSolutionsRouter.get('/admin', authRequired, moduleAccess('innovative-solutions'), async (_req: Request, res: Response) => {
  const items = await prisma.innovativeSolution.findMany({
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
    include: includeImpact,
  });
  res.json({ data: items });
});

innovativeSolutionsRouter.post('/', authRequired, moduleAccess('innovative-solutions'), async (req: Request, res: Response) => {
  const { title, slug, description, icon, features, order, isActive, donationImpactId } = req.body || {};
  if (!title || !slug || !description) return res.status(400).json({ error: 'missing fields' });

  let linkedImpactId: number | null = null;
  if (donationImpactId != null && donationImpactId !== '') {
    const impact = await prisma.donationImpact.findUnique({ where: { id: Number(donationImpactId) }, select: { id: true } });
    if (!impact) return res.status(400).json({ error: 'invalid donationImpactId' });
    linkedImpactId = impact.id;
  }

  const created = await prisma.innovativeSolution.create({
    data: {
      title,
      slug,
      description,
      icon: icon || null,
      features: parseFeatures(features) ?? [],
      order: order ?? 0,
      isActive: isActive ?? true,
      donationImpactId: linkedImpactId,
    },
    include: includeImpact,
  });
  res.status(201).json({ data: created });
});

innovativeSolutionsRouter.put('/:id', authRequired, moduleAccess('innovative-solutions'), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { title, slug, description, icon, features, order, isActive, donationImpactId } = req.body || {};

  let linkedImpactId: number | null | undefined;
  if (donationImpactId === '' || donationImpactId == null) {
    linkedImpactId = null;
  } else {
    const impact = await prisma.donationImpact.findUnique({ where: { id: Number(donationImpactId) }, select: { id: true } });
    if (!impact) return res.status(400).json({ error: 'invalid donationImpactId' });
    linkedImpactId = impact.id;
  }

  const updated = await prisma.innovativeSolution.update({
    where: { id },
    data: {
      title,
      slug,
      description,
      icon: icon || null,
      features: parseFeatures(features),
      order,
      isActive,
      donationImpactId: linkedImpactId,
    },
    include: includeImpact,
  });
  res.json({ data: updated });
});

innovativeSolutionsRouter.delete('/:id', authRequired, moduleAccess('innovative-solutions'), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.innovativeSolution.delete({ where: { id } });
  res.json({ success: true });
});
