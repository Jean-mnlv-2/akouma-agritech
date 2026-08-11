import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../utils/env';
import { validate } from '../middleware/validate';
import { csrfRequired } from '../middleware/csrf';
import { authRequired, adminOnly } from '../middleware/authRequired';
import { isPushConfigured, sendToAll } from '../utils/pushService';
import { prisma } from '../db';

export const pushRouter = Router();

// Décode le JWT de session sans exiger d'être connecté — un visiteur non
// authentifié doit pouvoir s'abonner aux notifications (userId restera
// null), authRequired renverrait 401 et bloquerait ce cas.
function optionalUserId(req: Request): string | undefined {
  const token = req.cookies?.auth_token as string | undefined;
  if (!token) return undefined;
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { sub: string };
    return decoded.sub;
  } catch {
    return undefined;
  }
}

pushRouter.get('/vapid-public-key', (_req: Request, res: Response) => {
  if (!isPushConfigured()) return res.status(503).json({ error: 'Push notifications non configurées' });
  res.json({ publicKey: env.VAPID_PUBLIC_KEY });
});

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
}).strict();

pushRouter.post('/subscribe', csrfRequired, validate(subscribeSchema), async (req: Request, res: Response) => {
  if (!isPushConfigured()) return res.status(503).json({ error: 'Push notifications non configurées' });
  const { endpoint, keys } = req.body;
  const userId = optionalUserId(req);
  try {
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId, userAgent: req.headers['user-agent'] || null },
      update: { p256dh: keys.p256dh, auth: keys.auth, userId, userAgent: req.headers['user-agent'] || null },
    });
    res.status(201).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to save subscription' });
  }
});

const unsubscribeSchema = z.object({ endpoint: z.string().url() }).strict();

pushRouter.post('/unsubscribe', csrfRequired, validate(unsubscribeSchema), async (req: Request, res: Response) => {
  const { endpoint } = req.body;
  await prisma.pushSubscription.deleteMany({ where: { endpoint } }).catch(() => void 0);
  res.json({ success: true });
});

const broadcastSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(500),
  url: z.string().max(500).optional(),
}).strict();

// Envoi manuel par un admin (annonce, nouvel article, événement...) — pas de
// déclenchement automatique implicite ailleurs dans le code pour l'instant,
// volontairement : éviter le spam/la fatigue de notifications tant qu'aucun
// déclencheur précis n'a été validé.
pushRouter.post('/broadcast', authRequired, adminOnly, csrfRequired, validate(broadcastSchema), async (req: Request, res: Response) => {
  if (!isPushConfigured()) return res.status(503).json({ error: 'Push notifications non configurées' });
  const { title, body, url } = req.body;
  const result = await sendToAll({ title, body, url });
  res.json({ data: result });
});
