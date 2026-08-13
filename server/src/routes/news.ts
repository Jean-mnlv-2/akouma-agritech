import { Router, Request, Response } from 'express';
import { authRequired, moduleAccess } from '../middleware/authRequired';
import { csrfRequired } from '../middleware/csrf';
import { logger } from '../utils/logger';
import { handlePrismaWriteError } from '../utils/prismaErrors';
import { RagSystem } from '../rag';
import { prisma } from '../db';
export const newsRouter = Router();

// Réindexation RAG ciblée (un seul article), déclenchée juste après une
// création/modification côté admin — voir KilimoKnowledgeAdapter.indexOneNews
// pour la logique complète (indexe si publié, purge sinon). Fire-and-forget :
// on ne fait pas attendre l'admin le temps d'un appel embedding Ollama, mais
// une vraie erreur reste loggée (contrairement au best-effort deleteSource
// ci-dessous, où "rien à supprimer" est un cas normal attendu).
function reindexNewsAsync(id: number): void {
  import('../rag/adapters/KilimoKnowledgeAdapter')
    .then(({ KilimoKnowledgeAdapter }) => {
      const adapter = new KilimoKnowledgeAdapter(prisma, RagSystem.getInstance(prisma).indexer);
      return adapter.indexOneNews(id);
    })
    .catch((e) => logger.error(`[RAG] Échec réindexation news-${id}`, e));
}

newsRouter.get('/', async (req: Request, res: Response) => {
  const isPublishedParam = req.query.is_published as string | undefined;
  const category = req.query.category as string | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 9;

  const isPublished = typeof isPublishedParam === 'string' ? isPublishedParam === 'true' : undefined;
  
  const where: any = {};
  if (typeof isPublished === 'boolean') where.isPublished = isPublished;
  
  if (category && category !== 'all') {
    where.category = {
      equals: category,
      mode: 'insensitive'
    };
  }

  try {
    const [items, total] = await Promise.all([
      prisma.news.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.news.count({ where })
    ]);

    res.json({ 
      data: items,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (e) {
    logger.error('Error in news GET /', e);
    const error = e instanceof Error ? e.message : 'Internal Server Error';
    res.status(500).json({ error });
  }
});

newsRouter.get('/slug/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const item = await prisma.news.findUnique({ where: { slug } as any });
    if (!item) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ data: item });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});

newsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const item = await prisma.news.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ data: item });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});

newsRouter.post('/', authRequired, moduleAccess('news'), csrfRequired, async (req: Request, res: Response) => {
  try {
    const { title, slug, content, excerpt, imageUrl, author, category, isPublished, isFeatured, isCopyProtected } = req.body || {};
    if (!title || !slug || !content) return res.status(400).json({ error: 'missing fields' });
    const created = await prisma.news.create({
      data: {
        title, slug, content, excerpt, imageUrl, author, category,
        isPublished: Boolean(isPublished),
        isFeatured: Boolean(isFeatured),
        isCopyProtected: Boolean(isCopyProtected),
        sourceType: "manual"
      } as any,
    });
    if (created.isPublished) reindexNewsAsync(created.id);
    res.status(201).json({ data: created });
  } catch (e) {
    handlePrismaWriteError(e, res);
  }
});

newsRouter.put('/:id', authRequired, moduleAccess('news'), csrfRequired, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { title, slug, content, excerpt, imageUrl, author, category, isPublished, isFeatured, isCopyProtected } = req.body || {};
    const updated = await prisma.news.update({
      where: { id },
      data: {
        title, slug, content, excerpt, imageUrl, author, category,
        isPublished: isPublished === undefined ? undefined : Boolean(isPublished),
        isFeatured: isFeatured === undefined ? undefined : Boolean(isFeatured),
        isCopyProtected: isCopyProtected === undefined ? undefined : Boolean(isCopyProtected)
        // Don't change sourceType when editing
      } as any,
    });
    // Toujours déclenché (pas seulement quand isPublished passe à true) :
    // couvre aussi bien la dépublication (purge immédiate) que l'édition de
    // contenu d'un article déjà publié (les embeddings doivent refléter le
    // nouveau texte, pas rester périmés jusqu'au prochain cron).
    reindexNewsAsync(id);
    res.json({ data: updated });
  } catch (e) {
    handlePrismaWriteError(e, res);
  }
});

newsRouter.delete('/:id', authRequired, moduleAccess('news'), csrfRequired, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.news.delete({ where: { id } });
    // Best-effort : purge la source RAG associée (voir seeds.ts pour la rationale).
    RagSystem.getInstance(prisma).indexer.deleteSource(`news-${id}`).catch(() => void 0);
    res.json({ success: true });
  } catch (e) {
    handlePrismaWriteError(e, res);
  }
});



