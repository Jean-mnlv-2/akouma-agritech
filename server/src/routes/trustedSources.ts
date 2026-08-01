import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authRequired, adminOnly } from '../middleware/authRequired';
import { validate } from '../middleware/validate';
import { csrfRequired } from '../middleware/csrf';
import { handlePrismaWriteError } from '../utils/prismaErrors';
import { prisma } from '../db';

export const trustedSourcesRouter = Router();

// Registre des centres de recherche/institutions dont DeerFlow doit
// prioritairement s'inspirer (voir TrustedSource dans schema.prisma) —
// même restriction que Documents RAG / Produits phytosanitaires : pas de
// délégation superviseur, contenu qui conditionne la crédibilité de tout
// le contenu généré automatiquement.
trustedSourcesRouter.use(authRequired, adminOnly);

trustedSourcesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const sources = await prisma.trustedSource.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ data: sources });
  } catch (error) {
    console.error('[trusted-sources] List error:', error);
    res.status(500).json({ error: 'Failed to list trusted sources' });
  }
});

const sourceSchema = z.object({
  name: z.string().trim().min(1).max(200),
  url: z.string().trim().url().max(500).optional().nullable(),
  description: z.string().trim().max(1000).optional().nullable(),
  region: z.string().trim().max(100).optional().nullable(),
  isActive: z.boolean().optional().default(true),
}).strict();

trustedSourcesRouter.post('/', csrfRequired, validate(sourceSchema), async (req: Request, res: Response) => {
  try {
    const created = await prisma.trustedSource.create({ data: req.body });
    res.status(201).json({ data: created });
  } catch (error) {
    handlePrismaWriteError(error, res);
  }
});

const updateSourceSchema = sourceSchema.partial();

trustedSourcesRouter.put('/:id', csrfRequired, validate(updateSourceSchema), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const updated = await prisma.trustedSource.update({ where: { id }, data: req.body });
    res.json({ data: updated });
  } catch (error) {
    handlePrismaWriteError(error, res);
  }
});

trustedSourcesRouter.delete('/:id', csrfRequired, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.trustedSource.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    handlePrismaWriteError(error, res);
  }
});
