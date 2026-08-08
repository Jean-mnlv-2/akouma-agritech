import { Router, Request, Response } from 'express';
import { authRequired, moduleAccess } from '../middleware/authRequired';
import { prisma } from '../db';
import { RagSystem } from '../rag';
export const donationImpactsRouter = Router();

// Un don "pending" n'est pas de l'argent effectivement reçu — même règle
// que /api/stats/public (voir Donations.tsx côté client).
const CONFIRMED_DONATION_FILTER = { status: { not: 'pending' } };

// Pour chaque cause dotée d'un objectif chiffré (targetAmount), calcule le
// montant réellement collecté à partir des dons confirmés qui lui sont liés
// et en déduit la progression — la valeur `progress` saisie à la main dans
// l'admin ne sert plus que de repli pour les causes sans objectif chiffré
// (ex. "1000 agriculteurs formés").
async function withComputedProgress<T extends { id: number; targetAmount: unknown; progress: number }>(
  items: T[]
): Promise<Array<T & { raisedAmount: number | null; donorsCount: number | null }>> {
  const fundedIds = items.filter((i) => i.targetAmount != null).map((i) => i.id);
  if (fundedIds.length === 0) {
    return items.map((i) => ({ ...i, raisedAmount: null, donorsCount: null }));
  }

  const grouped = await prisma.donation.groupBy({
    by: ['donationImpactId'],
    where: { ...CONFIRMED_DONATION_FILTER, donationImpactId: { in: fundedIds } },
    _sum: { amount: true },
    _count: { _all: true },
  });
  const byImpactId = new Map(grouped.map((g) => [g.donationImpactId, g]));

  return items.map((item) => {
    if (item.targetAmount == null) {
      return { ...item, raisedAmount: null, donorsCount: null };
    }
    const target = Number(item.targetAmount);
    const raised = Number(byImpactId.get(item.id)?._sum.amount || 0);
    const donorsCount = byImpactId.get(item.id)?._count._all || 0;
    const progress = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;
    return { ...item, raisedAmount: raised, donorsCount, progress };
  });
}

// Public list
donationImpactsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const items = await prisma.donationImpact.findMany({ where: { isActive: true }, orderBy: [{ order: 'asc' }, { id: 'desc' }] });
    res.json({ data: await withComputedProgress(items) });
  } catch (error: any) {
    // Si la table n'existe pas, retourner un tableau vide
    if (error?.code === 'P2021') {
      return res.json({ data: [] });
    }
    res.status(500).json({ error: error?.message || 'Failed to fetch donation impacts' });
  }
});

// Admin list
donationImpactsRouter.get('/admin', authRequired, moduleAccess('donations-content'), async (_req: Request, res: Response) => {
  const items = await prisma.donationImpact.findMany({ orderBy: [{ order: 'asc' }, { id: 'desc' }] });
  res.json({ data: await withComputedProgress(items) });
});

donationImpactsRouter.post('/', authRequired, moduleAccess('donations-content'), async (req: Request, res: Response) => {
  const { title, slug, description, icon, progress, target, targetAmount, order, isActive } = req.body || {};
  if (!title || !slug || !description) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.donationImpact.create({ data: { title, slug, description, icon, progress: progress ?? 0, target, targetAmount: targetAmount === '' ? null : targetAmount, order: order ?? 0, isActive: isActive ?? true } as any });
  res.status(201).json({ data: created });
});

donationImpactsRouter.put('/:id', authRequired, moduleAccess('donations-content'), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { title, slug, description, icon, progress, target, targetAmount, order, isActive } = req.body || {};
  const updated = await prisma.donationImpact.update({ where: { id }, data: { title, slug, description, icon, progress, target, targetAmount: targetAmount === '' ? null : targetAmount, order, isActive } as any });
  res.json({ data: updated });
});

donationImpactsRouter.delete('/:id', authRequired, moduleAccess('donations-content'), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.donationImpact.delete({ where: { id } });
  RagSystem.getInstance(prisma).indexer.deleteSource(`donationImpact-${id}`).catch(() => void 0);
  res.json({ success: true });
});


