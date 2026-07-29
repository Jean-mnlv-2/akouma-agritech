import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authRequired, adminOnly } from '../middleware/authRequired';
import { validate } from '../middleware/validate';
import { csrfRequired } from '../middleware/csrf';
import { RagSystem } from '../rag';
import { PHYTO_PRODUCT_TYPES, PHYTO_REGULATORY_STATUSES, PHYTO_TIERS } from '../config/phytosanitaryProducts';
import { handlePrismaWriteError } from '../utils/prismaErrors';
import { prisma } from '../db';

export const phytosanitaryProductsRouter = Router();

// Formulaire admin dédié pour caractériser un produit phytosanitaire —
// réservé aux admins (pas de délégation superviseur), même restriction que
// les Documents RAG : contenu technique/réglementaire sensible.
phytosanitaryProductsRouter.use(authRequired, adminOnly);

let ragSystem: RagSystem | null = null;
function getRagSystem(): RagSystem {
  if (!ragSystem) ragSystem = RagSystem.getInstance(prisma);
  return ragSystem;
}

phytosanitaryProductsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const products = await prisma.phytosanitaryProduct.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ data: products });
  } catch (error) {
    console.error('[phytosanitary-products] List error:', error);
    res.status(500).json({ error: 'Failed to list products' });
  }
});

phytosanitaryProductsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await prisma.phytosanitaryProduct.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ data: product });
  } catch (error) {
    console.error('[phytosanitary-products] Get error:', error);
    res.status(500).json({ error: 'Failed to get product' });
  }
});

// Caractérisation complète requise (matière active, type, cultures/ravageurs
// ciblés, description) — c'est cette précision qui permet ensuite au RAG de
// n'injecter un produit (nom commercial inclus) que si le contexte de la
// question correspond exactement ; sinon le produit n'est pas retenu du
// tout, quel que soit `commercialName` (optionnel — voir
// KilimoKnowledgeAdapter.formatPhytosanitaryProductContent).
const productSchema = z.object({
  activeIngredient: z.string().trim().min(2).max(200),
  productType: z.enum(PHYTO_PRODUCT_TYPES),
  targetCrops: z.array(z.string().trim().min(1)).min(1),
  targetPests: z.array(z.string().trim().min(1)).min(1),
  description: z.string().trim().min(10),
  dosage: z.string().trim().optional().nullable(),
  applicationMethod: z.string().trim().optional().nullable(),
  preHarvestInterval: z.string().trim().optional().nullable(),
  safetyPrecautions: z.string().trim().optional().nullable(),
  regulatoryStatus: z.enum(PHYTO_REGULATORY_STATUSES).optional().default('homologué'),
  commercialName: z.string().trim().optional().nullable(),
  tier: z.enum(PHYTO_TIERS).optional().default('standard'),
  isActive: z.boolean().optional().default(true),
}).strict();

phytosanitaryProductsRouter.post('/', csrfRequired, validate(productSchema), async (req: Request, res: Response) => {
  try {
    const product = await prisma.phytosanitaryProduct.create({ data: req.body });
    res.status(201).json({ data: product });
  } catch (error) {
    handlePrismaWriteError(error, res);
  }
});

const updateProductSchema = productSchema.partial();

phytosanitaryProductsRouter.put('/:id', csrfRequired, validate(updateProductSchema), async (req: Request, res: Response) => {
  try {
    const product = await prisma.phytosanitaryProduct.update({
      where: { id: req.params.id },
      data: { ...req.body, isIndexed: false }, // toute modification invalide l'index précédent
    });
    res.json({ data: product });
  } catch (error) {
    handlePrismaWriteError(error, res);
  }
});

phytosanitaryProductsRouter.delete('/:id', csrfRequired, async (req: Request, res: Response) => {
  try {
    const rag = getRagSystem();
    try {
      await rag.indexer.deleteSource(`phytosanitaryProduct-${req.params.id}`);
    } catch {
      // pas encore indexé, ignorer
    }
    await prisma.phytosanitaryProduct.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    handlePrismaWriteError(error, res);
  }
});

phytosanitaryProductsRouter.post('/:id/index', csrfRequired, async (req: Request, res: Response) => {
  try {
    const product = await prisma.phytosanitaryProduct.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const rag = getRagSystem();
    const { KilimoKnowledgeAdapter } = await import('../rag/adapters/KilimoKnowledgeAdapter');
    const adapter = new KilimoKnowledgeAdapter(prisma, rag.indexer);

    try {
      await rag.indexer.deleteSource(`phytosanitaryProduct-${req.params.id}`);
    } catch {
      // ignorer
    }
    await adapter.indexPhytosanitaryProducts();

    res.json({ success: true, message: 'Product indexed successfully' });
  } catch (error) {
    console.error('[phytosanitary-products] Index error:', error);
    res.status(500).json({ error: 'Failed to index product' });
  }
});
