import { Router, Request, Response } from 'express';
import { internalApiAuth } from '../middleware/internalApiAuth';
import { logger } from '../utils/logger';
import { prisma } from '../db';

export const internalKnowledgeBaseRouter = Router();

// Réservé à DeerFlow (agent interne), même middleware que les autres
// routeurs internes (internalNewsScraper.ts, internalElearning.ts).
internalKnowledgeBaseRouter.use(internalApiAuth);

/**
 * Un brouillon sans citation vérifiable n'est pas exploitable par un admin
 * pour juger de sa fiabilité avant activation — surtout pour du contenu
 * agronomique/réglementaire. `sources` est donc obligatoire (≥ 1 entrée),
 * chacune avec au moins un `name` (centre de recherche, institution, étude —
 * ex: IITA, CORAF, IRAD Cameroun, FAO, INRAB...). `url` est recommandée mais
 * pas exigée (toute source n'a pas de page web stable).
 */
function validateSources(sources: unknown): { name: string; url?: string }[] | null {
  if (!Array.isArray(sources) || sources.length === 0) return null;
  const cleaned: { name: string; url?: string }[] = [];
  for (const s of sources) {
    if (!s || typeof s !== 'object' || typeof (s as any).name !== 'string' || !(s as any).name.trim()) {
      return null;
    }
    const entry: { name: string; url?: string } = { name: (s as any).name.trim() };
    if (typeof (s as any).url === 'string' && (s as any).url.trim()) entry.url = (s as any).url.trim();
    cleaned.push(entry);
  }
  return cleaned;
}

// ================================
// Sujets existants — lecture seule, pour que DeerFlow évite de proposer un
// doublon avant de rédiger un nouveau brouillon (même principe que
// GET /status dans internalNewsScraper.ts pour les sources).
// ================================

// Registre admin des centres de recherche/institutions de confiance
// (TrustedSource) — DeerFlow doit prioritairement s'appuyer dessus pour
// rédiger un brouillon et le citer dans `sources`. Lecture seule : la liste
// elle-même reste gérée par un admin (voir server/src/routes/trustedSources.ts).
internalKnowledgeBaseRouter.get('/trusted-sources', async (_req: Request, res: Response) => {
  try {
    const sources = await prisma.trustedSource.findMany({
      where: { isActive: true },
      select: { id: true, name: true, url: true, description: true, region: true },
      orderBy: { name: 'asc' },
    });
    res.json({ data: sources });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch trusted sources' });
  }
});

internalKnowledgeBaseRouter.get('/topics', async (_req: Request, res: Response) => {
  try {
    const [documents, phytosanitaryProducts] = await Promise.all([
      prisma.document.findMany({
        select: { id: true, title: true, tier: true, sourceType: true, isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      prisma.phytosanitaryProduct.findMany({
        select: { id: true, activeIngredient: true, productType: true, targetCrops: true, tier: true, isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
    ]);
    res.json({ data: { documents, phytosanitaryProducts } });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch existing topics' });
  }
});

// ================================
// Documents RAG (AgriConsulting) — toujours créés en brouillon (isActive
// forcé à false côté serveur, jamais indexé tant qu'un admin ne l'active
// pas explicitement via l'interface Documents RAG).
// ================================

internalKnowledgeBaseRouter.post('/documents', async (req: Request, res: Response) => {
  try {
    const { title, content, description, sourceType, tier, metadata, sources, region } = req.body || {};
    if (!title || !content) return res.status(400).json({ error: 'title and content are required' });
    if (tier && tier !== 'standard' && tier !== 'premium') {
      return res.status(400).json({ error: 'tier must be "standard" or "premium"' });
    }
    const cleanedSources = validateSources(sources);
    if (!cleanedSources) {
      return res.status(400).json({ error: 'sources is required: a non-empty array of { name, url? } citing the research centers/institutions this content is drawn from' });
    }

    const created = await prisma.document.create({
      data: {
        title,
        content,
        description: description || null,
        sourceType: sourceType || 'guide',
        tier: tier || 'standard',
        metadata: metadata || {},
        sources: cleanedSources,
        region: typeof region === 'string' && region.trim() ? region.trim() : 'Afrique',
        isActive: false, // toujours brouillon, quoi que le payload envoie
        isIndexed: false,
      },
    });
    logger.info(`[internal-knowledge-base] Created draft document: id=${created.id}, title="${title}"`);
    res.status(201).json({ data: created });
  } catch (e) {
    logger.error('[internal-knowledge-base] Error creating document:', e);
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to create document' });
  }
});

// ================================
// Produits phytosanitaires — contenu réglementaire/sécurité sensible, même
// exigence de brouillon. `commercialName` n'est jamais indexé pour le RAG
// (voir schema.prisma) : DeerFlow peut l'omettre, un admin le complète si
// besoin lors de la relecture.
// ================================

internalKnowledgeBaseRouter.post('/phytosanitary-products', async (req: Request, res: Response) => {
  try {
    const {
      activeIngredient, productType, targetCrops, targetPests, description,
      dosage, applicationMethod, preHarvestInterval, safetyPrecautions,
      regulatoryStatus, tier, sources, region,
    } = req.body || {};
    if (!activeIngredient || !productType || !description) {
      return res.status(400).json({ error: 'activeIngredient, productType and description are required' });
    }
    if (tier && tier !== 'standard' && tier !== 'premium') {
      return res.status(400).json({ error: 'tier must be "standard" or "premium"' });
    }
    const cleanedSources = validateSources(sources);
    if (!cleanedSources) {
      return res.status(400).json({ error: 'sources is required: a non-empty array of { name, url? } citing the research centers/institutions this content is drawn from' });
    }

    const created = await prisma.phytosanitaryProduct.create({
      data: {
        activeIngredient,
        productType,
        targetCrops: Array.isArray(targetCrops) ? targetCrops : [],
        targetPests: Array.isArray(targetPests) ? targetPests : [],
        description,
        dosage: dosage || null,
        applicationMethod: applicationMethod || null,
        preHarvestInterval: preHarvestInterval || null,
        safetyPrecautions: safetyPrecautions || null,
        regulatoryStatus: regulatoryStatus || 'en évaluation', // jamais "homologué" par défaut pour un brouillon non vérifié
        tier: tier || 'standard',
        sources: cleanedSources,
        region: typeof region === 'string' && region.trim() ? region.trim() : 'Afrique',
        isActive: false, // toujours brouillon, quoi que le payload envoie
        isIndexed: false,
      },
    });
    logger.info(`[internal-knowledge-base] Created draft phytosanitary product: id=${created.id}, activeIngredient="${activeIngredient}"`);
    res.status(201).json({ data: created });
  } catch (e) {
    logger.error('[internal-knowledge-base] Error creating phytosanitary product:', e);
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to create phytosanitary product' });
  }
});
