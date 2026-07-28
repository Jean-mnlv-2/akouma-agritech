import { Router, Request, Response } from 'express';
import { authRequired, moduleAccess } from '../middleware/authRequired';
import { prisma } from '../db';
export const legalPagesRouter = Router();

legalPagesRouter.get('/', async (req: Request, res: Response) => {
  // Le front (Privacy/Terms/Legal) filtre par slug : sans ce filtre, les 3
  // pages recevaient toutes la même ligne (la plus récemment créée), quel
  // que soit le slug demandé — risque de conformité (mauvais contenu légal
  // affiché). `isActive` est le seul champ de publication du modèle
  // (le paramètre `isPublished` envoyé par le front n'existe pas dessus).
  const { slug } = req.query;
  if (typeof slug === 'string' && slug.trim().length > 0) {
    const item = await prisma.legalPage.findFirst({
      where: { slug, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ data: item ? [item] : [] });
  }
  const items = await prisma.legalPage.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ data: items });
});

legalPagesRouter.post('/', authRequired, moduleAccess('legal'), async (req: Request, res: Response) => {
  const { title, content, slug, isActive, type, version, effectiveDate } = req.body || {};
  if (!title || !content || !slug) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.legalPage.create({ 
    data: { 
      title, 
      content, 
      slug, 
      isActive: isActive ?? true,
      type: type || 'legal',
      version: version || '1.0',
      effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date()
    } as any 
  });
  res.status(201).json({ data: created });
});

legalPagesRouter.put('/:id', authRequired, moduleAccess('legal'), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { title, content, slug, isActive, type, version, effectiveDate } = req.body || {};
  const updated = await prisma.legalPage.update({ 
    where: { id }, 
    data: { 
      title, 
      content, 
      slug, 
      isActive,
      type,
      version,
      effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined
    } as any 
  });
  res.json({ data: updated });
});

legalPagesRouter.delete('/:id', authRequired, moduleAccess('legal'), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.legalPage.delete({ where: { id } });
  res.json({ success: true });
});



