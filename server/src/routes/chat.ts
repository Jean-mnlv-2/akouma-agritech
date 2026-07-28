import { Router } from 'express';
import { z } from 'zod';
import { authRequired, adminOnly } from '../middleware/authRequired';
import { validate } from '../middleware/validate';
import { createRateLimiter } from '../middleware/rateLimit';
import { RagSystem, ChatMessage as RagChatMessage } from '../rag';
import { SubscriptionService } from '../services/subscriptionService';
import { env } from '../utils/env';
import { parsePaginationAndSort } from '../utils/pagination';
import { prisma } from '../db';
const subscriptionService = new SubscriptionService();
export const chatRouter = Router();

// Initialize RAG system lazily
let ragSystem: RagSystem | null = null;
function getRagSystem(): RagSystem {
  if (!ragSystem) {
    ragSystem = RagSystem.getInstance(prisma);
  }
  return ragSystem;
}

// User-specific rate limiter for chat messages: 10 messages per minute
const chatMessageRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => {
    if (req.user && req.user.id) {
      return `user:${req.user.id}`;
    }
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    return String(ip);
  }
});

// Simple content moderation function
function isContentMalicious(content: string): { isMalicious: boolean; reason?: string } {
  const normalizedContent = content.toLowerCase();
  
  // Blocked keywords/phrases
  const blockedPatterns = [
    /\b(hack|hacked|hacking)\b/i,
    /\b(sql injection|xss|cross-site scripting)\b/i,
    /\b(phish|phishing)\b/i,
    /\b(scam|scammer)\b/i,
    /\b(password|pwd|passwd)\b.*\b\w{8,}\b/i,
    /\b(credit card|card number|cvv|ccv)\b/i,
    /\b(nude|porn|explicit)\b/i,
    /\b(violent|violence|kill|murder)\b/i,
    /\b(hate|hateful|racist|racism)\b/i,
  ];
  
  for (const pattern of blockedPatterns) {
    if (pattern.test(normalizedContent)) {
      return { isMalicious: true, reason: "Ce contenu est bloqué par nos filtres de sécurité." };
    }
  }
  
  return { isMalicious: false };
}

// Configuration
const MAX_HISTORY = 30;
const MAX_MESSAGE_LENGTH = 4000;

class ProQuotaExceededError extends Error {
  constructor(public readonly limit: number) {
    super('daily_pro_budget_exceeded');
    this.name = 'ProQuotaExceededError';
  }
}

function buildProUpgradeMessage(limit: number): string {
  return `Vous avez atteint votre quota quotidien de ${limit} requêtes avancées liées aux documents personnalisés. Les contenus standards KILIMO restent accessibles gratuitement. Pour continuer à exploiter les documents personnalisés de votre module Agriconsulting, merci de passer au Plan PRO ou de contacter l'équipe commerciale KILIMO.`;
}

/**
 * Track free usage separately from advanced Agriconsulting usage.
 * Free sources: seed, course, news.
 * Pro sources: custom documents and any future premium source type.
 */
async function checkAndUpdateBudget(
  userId: string,
  usesProSources: boolean
): Promise<{ ok: true; remaining?: number } | { ok: false; remaining: 0 }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get user's current PRO limit from subscription
  const { limit: proLimit } = await subscriptionService.getUserProLimit(userId);

  // Get or create budget entry
  let budget = await prisma.chatDailyBudget.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  if (!budget) {
    budget = await prisma.chatDailyBudget.create({
      data: {
        userId,
        date: today,
        freeUsage: usesProSources ? 0 : 1,
        proUsage: usesProSources ? 1 : 0,
      },
    });
    
    const remaining = usesProSources && proLimit !== 0 ? proLimit - 1 : undefined;
    return { 
      ok: true, 
      remaining,
    };
  }

  if (usesProSources && proLimit !== 0 && budget.proUsage >= proLimit) {
    return { ok: false, remaining: 0 };
  }

  // Increment appropriate usage counter
  budget = await prisma.chatDailyBudget.update({
    where: { id: budget.id },
    data: usesProSources 
      ? { proUsage: { increment: 1 } } 
      : { freeUsage: { increment: 1 } }
  });

  const remaining = usesProSources && proLimit !== 0 
    ? proLimit - budget.proUsage 
    : undefined;

  return { 
    ok: true,
    remaining,
  };
}

chatRouter.use(authRequired);

// List threads
chatRouter.get("/threads", async (req, res) => {
  const userId = req.user!.id;
  const searchQuery = (req.query.search as string) || "";
  
  let where: any = { userId };
  
  if (searchQuery.trim()) {
    where = {
      ...where,
      OR: [
        { title: { contains: searchQuery, mode: "insensitive" } },
        {
          messages: {
            some: {
              content: { contains: searchQuery, mode: "insensitive" }
            }
          }
        }
      ]
    };
  }
  
  const threads = await prisma.chatThread.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });
  res.json({ data: threads });
});

// Create thread
const createThreadSchema = z.object({ title: z.string().min(1).max(120).optional() }).strict();
chatRouter.post('/threads', validate(createThreadSchema), async (req, res) => {
  const userId = req.user!.id;
  const thread = await prisma.chatThread.create({
    data: { userId, title: req.body.title || 'Nouvelle conversation' },
  });
  res.status(201).json({ data: thread });
});

// Get one thread with messages
chatRouter.get('/threads/:id', async (req, res) => {
  const userId = req.user!.id;
  const thread = await prisma.chatThread.findFirst({
    where: { id: req.params.id, userId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!thread) return res.status(404).json({ error: 'not_found' });
  res.json({ data: thread });
});

// Rename
const renameSchema = z.object({ title: z.string().min(1).max(120) }).strict();
chatRouter.put('/threads/:id', validate(renameSchema), async (req, res) => {
  const userId = req.user!.id;
  const existing = await prisma.chatThread.findFirst({ where: { id: req.params.id, userId } });
  if (!existing) return res.status(404).json({ error: 'not_found' });
  const thread = await prisma.chatThread.update({
    where: { id: req.params.id },
    data: { title: req.body.title },
  });
  res.json({ data: thread });
});

// Delete
chatRouter.delete("/threads/:id", async (req, res) => {
  const userId = req.user!.id;
  const existing = await prisma.chatThread.findFirst({ where: { id: req.params.id, userId } });
  if (!existing) return res.status(404).json({ error: "not_found" });
  await prisma.chatThread.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// Export conversation as JSON
chatRouter.get("/threads/:id/export/json", async (req, res) => {
  const userId = req.user!.id;
  const threadId = req.params.id;
  const thread = await prisma.chatThread.findFirst({
    where: { id: threadId, userId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!thread) return res.status(404).json({ error: "not_found" });
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="conversation-${thread.id}.json"`);
  res.json(thread);
});

// Stream a chat completion with RAG
const messageSchema = z.object({ content: z.string().min(1).max(MAX_MESSAGE_LENGTH) }).strict();
chatRouter.post('/threads/:id/messages', chatMessageRateLimiter, validate(messageSchema), async (req, res) => {
  const userId = req.user!.id;
  const threadId = req.params.id;
  const userContent = req.body.content as string;

  const thread = await prisma.chatThread.findFirst({ where: { id: threadId, userId } });
  if (!thread) return res.status(404).json({ error: 'not_found' });

  // Check for malicious/inappropriate content
  const moderation = isContentMalicious(userContent);
  if (moderation.isMalicious) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.write(`event: error\ndata: ${JSON.stringify({ code: 'content_moderation', message: moderation.reason })}\n\n`);
    res.end();
    return;
  }

  // Persist the user message immediately
  await prisma.chatMessage.create({
    data: { threadId, role: 'user', content: userContent },
  });

  // Auto-title from first user message
  if (thread.title === 'Nouvelle conversation') {
    const newTitle = userContent.replace(/\s+/g, ' ').trim().slice(0, 60);
    if (newTitle) {
      await prisma.chatThread.update({ where: { id: threadId }, data: { title: newTitle } });
    }
  }

  // Load recent history (cap)
  const history = await prisma.chatMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: 'asc' },
    take: MAX_HISTORY,
  });

  const conversationHistory: RagChatMessage[] = history.map(m => ({
    role: m.role as 'user' | 'assistant' | 'system',
    content: m.content,
    timestamp: m.createdAt,
  }));

  // SSE setup
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const rag = getRagSystem();
    const response = await rag.orchestrator.queryStream(
      {
        query: userContent,
        conversationHistory,
      },
      (chunk: string) => {
        send('delta', { content: chunk });
      },
      async ({ usesProSources }) => {
        const budgetCheck = await checkAndUpdateBudget(userId, usesProSources);
        if (!budgetCheck.ok) {
          const { limit } = await subscriptionService.getUserProLimit(userId);
          throw new ProQuotaExceededError(limit);
        }
      }
    );

    // Persist assistant message
    if (response.answer.trim().length > 0) {
      const saved = await prisma.chatMessage.create({
        data: { threadId, role: 'assistant', content: response.answer },
      });
      await prisma.chatThread.update({ where: { id: threadId }, data: { updatedAt: new Date() } });
      
      // Send done event with sources metadata
      send('done', { 
        id: saved.id,
        usesProSources: response.usesProSources,
        sources: response.sources.map(s => ({
          title: s.source.title,
          score: s.score,
          sourceType: s.source.sourceType,
        })),
      });
    } else {
      send('error', { code: 'empty_response', message: 'Aucune réponse générée.' });
    }
  } catch (e: any) {
    if (e instanceof ProQuotaExceededError) {
      send('error', {
        code: 'daily_pro_budget_exceeded',
        message: buildProUpgradeMessage(e.limit),
      });
      return;
    }
    console.error('[chat] RAG stream error', e);
    send('error', { code: 'stream_failed', message: e?.message || 'Erreur réseau.' });
  } finally {
    res.end();
  }
});

// ================================
// RAG Admin routes for knowledge base management
// ================================

// Sync all knowledge base
chatRouter.get('/admin/knowledge/sync', authRequired, adminOnly, async (req, res) => {
  try {
    const rag = getRagSystem();
    const { KilimoKnowledgeAdapter } = await import('../rag/adapters/KilimoKnowledgeAdapter');
    const adapter = new KilimoKnowledgeAdapter(prisma, rag.indexer);
    
    await adapter.indexAllContent();
    res.json({ success: true, message: 'Knowledge base synchronization started' });
  } catch (error) {
    console.error('[rag] Knowledge sync error:', error);
    res.status(500).json({ error: 'Failed to sync knowledge base' });
  }
});

// ================================
// Document CRUD routes
// ================================

// Get all documents
chatRouter.get('/admin/documents', authRequired, adminOnly, async (req, res) => {
  try {
    const documents = await prisma.document.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: documents });
  } catch (error) {
    console.error('[documents] Get all error:', error);
    res.status(500).json({ error: 'Failed to get documents' });
  }
});

// Get single document
chatRouter.get('/admin/documents/:id', authRequired, adminOnly, async (req, res) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id },
    });
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ data: document });
  } catch (error) {
    console.error('[documents] Get one error:', error);
    res.status(500).json({ error: 'Failed to get document' });
  }
});

// Create document
const createDocumentSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  description: z.string().optional(),
  sourceType: z.string().optional().default('manual'),
  metadata: z.record(z.any()).optional().default({}),
  isActive: z.boolean().optional().default(true),
}).strict();

chatRouter.post('/admin/documents', authRequired, adminOnly, validate(createDocumentSchema), async (req, res) => {
  try {
    const document = await prisma.document.create({
      data: req.body,
    });
    res.status(201).json({ data: document });
  } catch (error) {
    console.error('[documents] Create error:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

// Update document
const updateDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  description: z.string().optional(),
  sourceType: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
}).strict();

chatRouter.put('/admin/documents/:id', authRequired, adminOnly, validate(updateDocumentSchema), async (req, res) => {
  try {
    const document = await prisma.document.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        isIndexed: false,
      },
    });
    res.json({ data: document });
  } catch (error) {
    console.error('[documents] Update error:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// Delete document
chatRouter.delete('/admin/documents/:id', authRequired, adminOnly, async (req, res) => {
  try {
    // First delete from knowledge base
    const rag = getRagSystem();
    try {
      await rag.indexer.deleteSource(`document-${req.params.id}`);
    } catch (e) {
      // Ignore if not in index yet
    }
    
    // Then delete from DB
    await prisma.document.delete({
      where: { id: req.params.id },
    });
    
    res.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    console.error('[documents] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Index a single document
chatRouter.post('/admin/documents/:id/index', authRequired, adminOnly, async (req, res) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id },
    });
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const rag = getRagSystem();
    const { KilimoKnowledgeAdapter } = await import('../rag/adapters/KilimoKnowledgeAdapter');
    const adapter = new KilimoKnowledgeAdapter(prisma, rag.indexer);
    
    // Delete existing index if any
    try {
      await rag.indexer.deleteSource(`document-${req.params.id}`);
    } catch (e) {
      // Ignore
    }
    
    // Index the document
    await adapter.indexDocuments();
    
    res.json({ success: true, message: 'Document indexed successfully' });
  } catch (error) {
    console.error('[documents] Index error:', error);
    res.status(500).json({ error: 'Failed to index document' });
  }
});

// ================================
// Consumption Admin routes
// ================================

// Get chat consumption stats
chatRouter.get('/admin/consumption', authRequired, adminOnly, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where: any = {};

    if (startDate) {
      where.date = { ...where.date, gte: new Date(startDate as string) };
    }
    if (endDate) {
      where.date = { ...where.date, lte: new Date(endDate as string) };
    }

    const { page, pageSize, skip, take } = parsePaginationAndSort(req, { defaultPageSize: 50, maxPageSize: 200 });

    // Le résumé est calculé par agrégation SQL sur l'ensemble filtré, pas sur
    // la seule page chargée : avant ce correctif, "totalFreeUsage"/
    // "totalProUsage" ne portaient que sur les 100 premières lignes (`take:
    // 100` fixe), donnant un total silencieusement faux dès que le filtre
    // couvrait plus de lignes que la page.
    const [budgets, total, aggregate] = await Promise.all([
      prisma.chatDailyBudget.findMany({
        where,
        include: { user: { select: { id: true, email: true, fullName: true } } },
        orderBy: { date: 'desc' },
        skip,
        take,
      }),
      prisma.chatDailyBudget.count({ where }),
      prisma.chatDailyBudget.aggregate({ where, _sum: { freeUsage: true, proUsage: true } }),
    ]);

    const totalFreeUsage = aggregate._sum.freeUsage || 0;
    const totalProUsage = aggregate._sum.proUsage || 0;

    res.json({
      data: budgets,
      page,
      pageSize,
      total,
      summary: {
        totalFreeUsage,
        totalProUsage,
        totalUsage: totalFreeUsage + totalProUsage,
      },
    });
  } catch (error) {
    console.error('[consumption] Get error:', error);
    res.status(500).json({ error: 'Failed to get consumption stats' });
  }
});

// Get user consumption summary
chatRouter.get('/admin/consumption/users', authRequired, adminOnly, async (req, res) => {
  try {
    const { page, pageSize, skip, take } = parsePaginationAndSort(req, { defaultPageSize: 50, maxPageSize: 200 });

    // Agrégation + tri + pagination effectués en base : évite de charger tous
    // les utilisateurs et tout leur historique de budget en mémoire Node pour
    // ne garder ensuite que quelques dizaines de lignes triées.
    const [rows, totalRow] = await Promise.all([
      prisma.$queryRaw<Array<{
        id: string;
        email: string;
        fullName: string | null;
        totalFreeUsage: number;
        totalProUsage: number;
        lastActivity: Date | null;
      }>>`
        SELECT u.id, u.email, u."fullName",
               COALESCE(SUM(b."freeUsage"), 0)::int AS "totalFreeUsage",
               COALESCE(SUM(b."proUsage"), 0)::int AS "totalProUsage",
               MAX(b.date) AS "lastActivity"
        FROM "User" u
        INNER JOIN "ChatDailyBudget" b ON b."userId" = u.id
        GROUP BY u.id, u.email, u."fullName"
        ORDER BY (COALESCE(SUM(b."freeUsage"), 0) + COALESCE(SUM(b."proUsage"), 0)) DESC
        LIMIT ${take} OFFSET ${skip}
      `,
      prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(DISTINCT b."userId")::int AS count FROM "ChatDailyBudget" b
      `,
    ]);

    const userConsumption = rows.map((row) => ({
      id: row.id,
      email: row.email,
      fullName: row.fullName,
      totalFreeUsage: row.totalFreeUsage,
      totalProUsage: row.totalProUsage,
      totalUsage: row.totalFreeUsage + row.totalProUsage,
      lastActivity: row.lastActivity,
    }));

    res.json({ data: userConsumption, page, pageSize, total: totalRow[0]?.count ?? 0 });
  } catch (error) {
    console.error('[consumption] Users error:', error);
    res.status(500).json({ error: 'Failed to get user consumption' });
  }
});
