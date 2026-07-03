import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authRequired } from '../middleware/authRequired';
import { validate } from '../middleware/validate';
import { createRateLimiter } from '../middleware/rateLimit';

const prisma = new PrismaClient();
export const chatRouter = Router();

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
const AI_PROVIDER = process.env.AI_PROVIDER || 'lovable'; // 'lovable' or 'ollama'
const LOVABLE_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const LOVABLE_DEFAULT_MODEL = process.env.LOVABLE_CHAT_MODEL || 'google/gemini-2.5-flash';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://ollama:11434';
const OLLAMA_DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';
const MAX_HISTORY = 30;
const MAX_MESSAGE_LENGTH = 4000;

// Budget IA quotidien par utilisateur (nombre de messages/jour).
// Défaut : 50 messages/jour/utilisateur (override via CHAT_DAILY_BUDGET).
const CHAT_DAILY_BUDGET = Number(process.env.CHAT_DAILY_BUDGET || 50);
const dailyUsage = new Map<string, { count: number; resetAt: number }>();
function checkDailyBudget(userId: string): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = dailyUsage.get(userId);
  if (!entry || entry.resetAt < now) {
    dailyUsage.set(userId, { count: 1, resetAt: now + 24 * 60 * 60 * 1000 });
    return { ok: true, remaining: CHAT_DAILY_BUDGET - 1 };
  }
  if (entry.count >= CHAT_DAILY_BUDGET) {
    return { ok: false, remaining: 0 };
  }
  entry.count += 1;
  return { ok: true, remaining: CHAT_DAILY_BUDGET - entry.count };
}

const SYSTEM_PROMPT = `Tu es KILIMO Assistant, l'assistant officiel de KILIMO, une plateforme agritech africaine.
Tu aides les utilisateurs sur :
- Les formations e-learning (catalogue, inscription, certification)
- La boutique (semences, produits agricoles, commandes, livraison)
- Le conseil agricole, les bonnes pratiques de culture et d'élevage
- Les partenariats, dons et opportunités de carrière

Règles :
- Réponds en français par défaut, ou dans la langue de l'utilisateur s'il écrit autrement.
- Sois concis, professionnel, chaleureux. Utilise le markdown (titres courts, listes, gras) pour structurer.
- Si tu ne sais pas, dis-le honnêtement et oriente vers le formulaire de contact (/contact).
- Ne donne jamais d'avis médical, financier ou juridique engageant.
- N'invente pas d'informations sur les prix exacts, stocks ou dates ; invite l'utilisateur à consulter la page concernée.`;

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

// Helper to stream from Lovable API
async function streamFromLovable(messages: any[], send: (event: string, data: unknown) => void) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    throw new Error('LOVABLE_API_KEY non configurée.');
  }

  const upstream = await fetch(LOVABLE_GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: LOVABLE_DEFAULT_MODEL,
      stream: true,
      messages,
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => '');
    if (upstream.status === 429) {
      send('error', { code: 'rate_limited', message: 'Trop de requêtes. Réessayez dans un instant.' });
    } else if (upstream.status === 402) {
      send('error', { code: 'credits_exhausted', message: 'Crédits IA épuisés. Contactez l\'administrateur.' });
    } else {
      send('error', { code: 'upstream_error', message: text.slice(0, 200) || 'Erreur du modèle.' });
    }
    return '';
  }

  let assistantText = '';
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const json = JSON.parse(payload);
        const delta = json?.choices?.[0]?.delta?.content;
        if (typeof delta === 'string' && delta.length > 0) {
          assistantText += delta;
          send('delta', { content: delta });
        }
      } catch {
        // ignore parse errors on keep-alive lines
      }
    }
  }
  return assistantText;
}

// Helper to stream from Ollama API
async function streamFromOllama(messages: any[], send: (event: string, data: unknown) => void) {
  const upstream = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_DEFAULT_MODEL,
      stream: true,
      messages,
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => '');
    send('error', { code: 'upstream_error', message: text.slice(0, 200) || 'Erreur Ollama.' });
    return '';
  }

  let assistantText = '';
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const json = JSON.parse(trimmed);
        const delta = json?.message?.content;
        if (typeof delta === 'string' && delta.length > 0) {
          assistantText += delta;
          send('delta', { content: delta });
        }
        if (json?.done) break;
      } catch {
        // ignore parse errors
      }
    }
  }
  return assistantText;
}

// Stream a chat completion
const messageSchema = z.object({ content: z.string().min(1).max(MAX_MESSAGE_LENGTH) }).strict();
chatRouter.post('/threads/:id/messages', chatMessageRateLimiter, validate(messageSchema), async (req, res) => {
  const userId = req.user!.id;
  const threadId = req.params.id;

  const thread = await prisma.chatThread.findFirst({ where: { id: threadId, userId } });
  if (!thread) return res.status(404).json({ error: 'not_found' });

  // Budget IA quotidien
  const budget = checkDailyBudget(userId);
  if (!budget.ok) {
    return res.status(429).json({
      error: 'daily_budget_exceeded',
      message: `Vous avez atteint votre limite quotidienne de ${CHAT_DAILY_BUDGET} messages IA. Réessayez demain.`,
    });
  }

  const userContent = req.body.content as string;

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

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
  ];

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
    let assistantText = '';

    if (AI_PROVIDER === 'ollama') {
      assistantText = await streamFromOllama(messages, send);
    } else {
      assistantText = await streamFromLovable(messages, send);
    }

    // Persist assistant message
    if (assistantText.trim().length > 0) {
      const saved = await prisma.chatMessage.create({
        data: { threadId, role: 'assistant', content: assistantText },
      });
      await prisma.chatThread.update({ where: { id: threadId }, data: { updatedAt: new Date() } });
      send('done', { id: saved.id });
    } else {
      send('error', { code: 'empty_response', message: 'Aucune réponse générée.' });
    }
  } catch (e: any) {
    console.error('[chat] stream error', e);
    send('error', { code: 'stream_failed', message: e?.message || 'Erreur réseau.' });
  } finally {
    res.end();
  }
});
