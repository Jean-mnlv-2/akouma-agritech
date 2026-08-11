import webpush from 'web-push';
import { env } from './env';
import { logger } from './logger';
import { prisma } from '../db';

export function isPushConfigured(): boolean {
  return !!env.VAPID_PUBLIC_KEY && !!env.VAPID_PRIVATE_KEY;
}

let configured = false;
function ensureConfigured() {
  if (configured || !isPushConfigured()) return;
  webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

interface SendResult {
  sent: number;
  removed: number;
  failed: number;
}

/**
 * Envoie une notification à un lot d'abonnements et nettoie au passage ceux
 * que le navigateur/OS a révoqués (410 Gone / 404) — sinon on continuerait
 * indéfiniment à cibler des endpoints morts à chaque envoi.
 */
export async function sendToSubscriptions(
  subscriptions: { id: number; endpoint: string; p256dh: string; auth: string }[],
  payload: PushPayload
): Promise<SendResult> {
  ensureConfigured();
  if (!isPushConfigured()) {
    logger.warn('[push] VAPID keys not configured — skipping send');
    return { sent: 0, removed: 0, failed: 0 };
  }

  const result: SendResult = { sent: 0, removed: 0, failed: 0 };
  const staleIds: number[] = [];

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        );
        result.sent += 1;
      } catch (error: any) {
        const statusCode = error?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          staleIds.push(sub.id);
          result.removed += 1;
        } else {
          logger.error(`[push] Failed to send to subscription ${sub.id}:`, error?.message || error);
          result.failed += 1;
        }
      }
    })
  );

  if (staleIds.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: staleIds } } }).catch(() => void 0);
  }

  return result;
}

export async function sendToAll(payload: PushPayload): Promise<SendResult> {
  const subscriptions = await prisma.pushSubscription.findMany();
  return sendToSubscriptions(subscriptions, payload);
}

export async function sendToUser(userId: string, payload: PushPayload): Promise<SendResult> {
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  return sendToSubscriptions(subscriptions, payload);
}
