import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { authRequired } from '../middleware/authRequired';
import { csrfRequired } from '../middleware/csrf';
import { createRateLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { antiReplay, timingSafeEqualStr } from '../middleware/webhookReplay';
import { audit, actorFromRequest } from '../utils/audit';
import { env } from '../utils/env';
import { OrdersService } from '../services/ordersService';
import { logger } from '../utils/logger';
import { prisma } from '../db';
const ordersService = new OrdersService(prisma);
export const paymentsRouter = Router();

const initiateSchema = z.object({
  orderId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]),
}).strict();

const webhookSchema = z.object({
  tokenPay: z.string().min(1).max(255),
  statut: z.string().max(50).optional(),
}).passthrough(); // les fournisseurs envoient des champs supplémentaires

type AuthenticatedRequest = Request & {
  user?: { id?: string; role?: string };
  userId?: string;
};

/**
 * POST /api/payments/initiate
 * Initie un paiement Money Fusion après la création d'une commande.
 * Body: { orderId: number }
 */
const paymentsInitiateLimiter = createRateLimiter({ windowMs: 60_000, max: 20 });
paymentsRouter.post('/initiate', paymentsInitiateLimiter, authRequired, csrfRequired, validate(initiateSchema), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id ?? authReq.userId;
    const { orderId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    if (!orderId) {
      return res.status(400).json({ error: 'orderId est requis' });
    }

    const order = await prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: { items: true, user: { select: { id: true, fullName: true, email: true, phone: true } } },
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande introuvable' });
    }

    if (order.userId !== userId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Build Money Fusion payment payload
    const mfApiUrl = env.MONEYFUSION_API_URL;
    const mfToken = env.MONEYFUSION_TOKEN;
    const mfNotifUrl = env.MONEYFUSION_NOTIF_URL;

    if (!mfApiUrl || !mfToken) {
      logger.error('[payments] Money Fusion credentials not configured');
      return res.status(500).json({ error: 'Configuration de paiement manquante' });
    }

    const articles = order.items.map((item: any) => ({
      nom: item.name,
      montant: Number(item.price) * item.quantity,
    }));

    // Money Fusion (mobile money) exige un numéro pour router le paiement —
    // les achats sans livraison (cours, abonnements) n'ont pas de
    // shippingPhone : on retombe sur le téléphone du profil utilisateur.
    // Sans l'un ni l'autre, la demande échoue silencieusement côté Money
    // Fusion (statut:false, message générique) plutôt que de bloquer ici
    // avec un message clair — on préfère donc échouer tôt et explicitement.
    const payerPhone = (order.shippingPhone || order.user?.phone || '').replace(/\s+/g, '');
    if (!payerPhone) {
      logger.warn(`[payments] No phone number available for order #${order.orderNumber} — cannot initiate Money Fusion payment`);
      return res.status(400).json({ error: 'Un numéro de téléphone Mobile Money est requis pour ce paiement. Ajoutez-le à votre profil et réessayez.' });
    }

    const payload = {
      totalPrice: Number(order.total),
      devise: 'XOF',
      article: articles,
      personal_Info: [
        {
          userId: order.userId,
          orderId: String(order.id),
          orderNumber: order.orderNumber,
        },
      ],
      numeroSend: payerPhone,
      nomclient: order.user?.fullName || 'Client',
      return_url: `${env.FRONTEND_URL}/orders/${order.id}?payment=success`,
      cancel_url: `${env.FRONTEND_URL}/orders/${order.id}?payment=cancelled`,
      webhook_url: mfNotifUrl || `${env.API_PUBLIC_URL}/api/payments/webhook`,
    };

    const payUrl = `${mfApiUrl}${mfToken}/pay/`;

    logger.info(`[payments] Initiating Money Fusion payment for order #${order.orderNumber}`);

    const response = await fetch(payUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`[payments] Money Fusion error (${response.status})`, errorText?.substring?.(0, 500) ?? errorText);
      return res.status(502).json({ error: 'Erreur du service de paiement' });
    }

    const result = await response.json();

    // Money Fusion returns a payment URL to redirect the user to
    if (result.url || result.statut === 'success' || result.payment_url) {
      let paymentUrl = result.url || result.payment_url;
      const tokenPay = result.tokenPay || result.token || null;

      const allowedPaymentHosts = [
        new URL(mfApiUrl).hostname,

      ];
      
      try {
        const parsedUrl = new URL(paymentUrl);
        if (!allowedPaymentHosts.includes(parsedUrl.hostname) || parsedUrl.protocol !== 'https:') {
          logger.error('[payments] Payment URL validation failed', { paymentUrl, allowedHosts: allowedPaymentHosts });
          return res.status(502).json({ error: 'URL de paiement invalide' });
        }
      } catch (urlError) {
        logger.error('[payments] Payment URL parsing failed', urlError);
        return res.status(502).json({ error: 'URL de paiement invalide' });
      }

      // Store tokenPay on the order for webhook verification
      if (tokenPay) {
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentRef: tokenPay },
        });
      }

      return res.json({
        data: {
          paymentUrl,
          tokenPay,
          orderId: order.id,
          orderNumber: order.orderNumber,
        },
      });
    }

    logger.warn('[payments] Unexpected Money Fusion response', result);
    return res.status(502).json({ error: 'Réponse inattendue du service de paiement' });
  } catch (e) {
    logger.error('[payments] Error initiating payment', e);
    const message = e instanceof Error ? e.message : 'Erreur interne';
    res.status(500).json({ error: message });
  }
});

async function verifyWebhookPayment(tokenPay: string): Promise<{ paid: boolean; raw?: unknown } | null> {
  const mfNotifUrl = env.MONEYFUSION_NOTIF_URL;
  if (!mfNotifUrl) return null;
  const checkUrl = `${mfNotifUrl}${tokenPay}`;
  const response = await fetch(checkUrl);
  if (!response.ok) return null;
  const result = await response.json().catch(() => null);
  const statut = (result as any)?.statut;
  const paid = statut === 'paid' || statut === 'successful' || statut === 'success';
  return { paid, raw: result };
}

/**
 * POST /api/payments/webhook
 * Webhook appelé par Money Fusion après le paiement.
 */
paymentsRouter.post(
  '/webhook',
  antiReplay({
    source: 'moneyfusion',
    timestampHeader: 'x-webhook-timestamp',
    nonceHeader: 'x-webhook-nonce',
    required: !!env.MONEYFUSION_WEBHOOK_SECRET, // exigé quand la signature partagée est configurée
  }),
  validate(webhookSchema),
  async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    logger.info('[payments] Webhook received');

    const webhookSecret = env.MONEYFUSION_WEBHOOK_SECRET;
    if (webhookSecret) {
      const provided = String(req.headers['x-webhook-secret'] || '');
      // Comparaison à temps constant : `!==` fuit la longueur du préfixe correct
      // via le temps de réponse (timing attack), ce qui permet en théorie de
      // reconstituer le secret octet par octet.
      if (!provided || !timingSafeEqualStr(provided, webhookSecret)) {
        return res.status(401).json({ error: 'Webhook non autorisé' });
      }
    }

    const { tokenPay, statut } = body;

    // Find the order by paymentRef
    const order = await prisma.order.findFirst({
      where: { paymentRef: tokenPay },
    });

    if (!order) {
      console.warn(`[payments] No order found for tokenPay: ${tokenPay}`);
      return res.status(404).json({ error: 'Commande introuvable' });
    }

    // Sécurisation: ne JAMAIS faire confiance au champ `statut` du corps.
    // Le paiement n'est confirmé que si le fournisseur (Money Fusion) le confirme via
    // une revalidation HTTP signée, OU si le webhook est signé avec un secret partagé
    // ET expose un statut explicite (ex: en environnement de test).
    const revalidated = await verifyWebhookPayment(tokenPay);
    if (!revalidated && !webhookSecret) {
      logger.error('[payments] Webhook rejected: aucune méthode de vérification configurée');
      return res.status(500).json({ error: 'Configuration webhook manquante' });
    }

    // Si la revalidation externe est disponible, elle fait foi.
    // Sinon (uniquement quand un secret signé est présent), on accepte le statut du body.
    const isPaid = revalidated
      ? revalidated.paid === true
      : (statut === 'paid' || statut === 'successful' || statut === 'success');

    // Idempotence: si la commande est déjà marquée payée, ne pas rejouer le traitement.
    if (order.paymentStatus === 'paid' && isPaid) {
      logger.info(`[payments] Webhook idempotent ignoré pour ${order.orderNumber}`);
      return res.json({ status: 'ok', idempotent: true });
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: isPaid ? 'paid' : 'failed',
          status: isPaid ? 'confirmed' : order.status,
        },
      });

      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          type: 'payment',
          status: isPaid ? 'confirmed' : order.status,
          paymentStatus: isPaid ? 'paid' : 'failed',
          note: `Money Fusion webhook: ${statut} (token: ${tokenPay})`,
        },
      });
    });

    logger.info(`[payments] Order #${order.orderNumber} payment ${isPaid ? 'confirmed' : 'failed'}`);

    // Trigger post-payment processing asynchronously
    if (isPaid) {
      ordersService.processPostPayment(order.id).catch((err) => {
        logger.error(`[payments] Error in processPostPayment for order ${order.id}`, err);
      });
    }

    if (isPaid) {
      await audit({ action: 'payment.webhook.confirmed', entityType: 'order', entityId: order.id, metadata: { tokenPay, statut } });
    } else {
      await audit({ action: 'payment.webhook.failed', entityType: 'order', entityId: order.id, metadata: { tokenPay, statut } });
    }

    res.json({ status: 'ok' });
  } catch (e) {
    logger.error('[payments] Webhook error', e);
    res.status(500).json({ error: 'Erreur interne' });
  }
},
);

/**
 * GET /api/payments/status/:tokenPay
 * Vérifie le statut d'un paiement via Money Fusion.
 */
paymentsRouter.get('/status/:tokenPay', authRequired, async (req: Request, res: Response) => {
  try {
    const { tokenPay } = req.params;
    const mfNotifUrl = env.MONEYFUSION_NOTIF_URL;

    if (!tokenPay) {
      return res.status(400).json({ error: 'tokenPay est requis' });
    }

    if (!mfNotifUrl) {
      logger.info(`[payments] MONEYFUSION_NOTIF_URL not set, checking local DB for token`);
      const order = await prisma.order.findFirst({
        where: { paymentRef: tokenPay },
        select: { id: true, paymentStatus: true, status: true, orderNumber: true }
      });

      if (!order) {
        return res.status(404).json({ error: 'Paiement introuvable localement' });
      }

      return res.json({ 
        data: { 
          statut: order.paymentStatus === 'paid' ? 'success' : 'pending',
          orderId: order.id,
          orderNumber: order.orderNumber,
          localStatus: order.status
        } 
      });
    }

    const checkUrl = `${mfNotifUrl}${tokenPay}`;
    logger.info('[payments] Checking payment status');
    const response = await fetch(checkUrl);

    if (!response.ok) {
      const order = await prisma.order.findFirst({ where: { paymentRef: tokenPay } });
      if (order) {
        return res.json({ data: { statut: order.paymentStatus === 'paid' ? 'success' : 'pending', source: 'local_fallback' } });
      }
      return res.status(502).json({ error: 'Impossible de vérifier le paiement' });
    }

    const result = await response.json();
    res.json({ data: result });
  } catch (e) {
    logger.error('[payments] Status check error', e);
    res.status(500).json({ error: 'Erreur interne' });
  }
});
