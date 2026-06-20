import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authRequired } from '../middleware/authRequired';
import { validate } from '../middleware/validate';

const prisma = new PrismaClient();
export const chatRouter = Router();

const GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const DEFAULT_MODEL = 'google/gemini-3-flash-preview';
const MAX_HISTORY = 30;
const MAX_MESSAGE_LENGTH = 4000;

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
chatRouter.get('/threads', async (req, res) => {
  const userId = req.user!.id;
  const threads = await prisma.chatThread.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
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
chatRouter.delete('/threads/:id', async (req, res) => {
  const userId = req.user!.id;
  const existing = await prisma.chatThread.findFirst({ where: { id: req.params.id, userId } });
  if (!existing) return res.status(404).json({ error: 'not_found' });
  await prisma.chatThread.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// Stream a chat completion
const messageSchema = z.object({ content: z.string().min(1).max(MAX_MESSAGE_LENGTH) }).strict();
chatRouter.post('/threads/:id/messages', validate(messageSchema), async (req, res) => {
  const userId = req.user!.id;
  const threadId = req.params.id;

  const thread = await prisma.chatThread.findFirst({ where: { id: threadId, userId } });
  if (!thread) return res.status(404).json({ error: 'not_found' });

  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ai_unavailable', message: 'LOVABLE_API_KEY non configurée.' });
  }

  const userContent = req.body.content as string;

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
    ...history.map(m => ({ role: m.role, content: m.content })),
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

  let assistantText = '';

  try {
    const upstream = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
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
      res.end();
      return;
    }

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