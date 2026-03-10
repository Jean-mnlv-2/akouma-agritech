import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired } from '../middleware/authRequired';
import { env } from '../utils/env';

const prisma = new PrismaClient();
export const paymentsRouter = Router();

type AuthenticatedRequest = Request & {
  user?: { id?: string; role?: string };
  userId?: string;
};

/**
 * POST /api/payments/initiate
 * Initie un paiement Money Fusion après la création d'une commande.
 * Body: { orderId: number }
 */
paymentsRouter.post('/initiate', authRequired, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id ?? authReq.userId;
    const { orderId } = req.body || {};

    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    if (!orderId) {
      return res.status(400).json({ error: 'orderId est requis' });
    }

    const order = await prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: { items: true, user: { select: { id: true, fullName: true, email: true } } },
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
      console.error('[payments] Money Fusion credentials not configured');
      return res.status(500).json({ error: 'Configuration de paiement manquante' });
    }

    const articles = order.items.map((item) => ({
      nom: item.name,
      montant: Number(item.price) * item.quantity,
    }));

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
      numeroSend: order.shippingPhone?.replace(/\s+/g, '') || '',
      nomclient: order.user?.fullName || 'Client',
      return_url: `${env.FRONTEND_URL}/orders/${order.id}?payment=success`,
      cancel_url: `${env.FRONTEND_URL}/orders/${order.id}?payment=cancelled`,
      webhook_url: mfNotifUrl || `${env.API_PUBLIC_URL}/api/payments/webhook`,
    };

    const payUrl = `${mfApiUrl}${mfToken}/pay/`;

    console.log(`[payments] Initiating Money Fusion payment for order #${order.orderNumber}, URL: ${payUrl}`);

    const response = await fetch(payUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[payments] Money Fusion error (${response.status}):`, errorText);
      return res.status(502).json({ error: 'Erreur du service de paiement' });
    }

    const result = await response.json();

    // Money Fusion returns a payment URL to redirect the user to
    if (result.url || result.statut === 'success' || result.payment_url) {
      const paymentUrl = result.url || result.payment_url;
      const tokenPay = result.tokenPay || result.token || null;

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

    console.error('[payments] Unexpected Money Fusion response:', result);
    return res.status(502).json({ error: 'Réponse inattendue du service de paiement' });
  } catch (e) {
    console.error('[payments] Error initiating payment:', e);
    const message = e instanceof Error ? e.message : 'Erreur interne';
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/payments/webhook
 * Webhook appelé par Money Fusion après le paiement.
 */
paymentsRouter.post('/webhook', async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    console.log('[payments] Webhook received:', JSON.stringify(body));

    const { tokenPay, statut, personal_Info } = body;

    if (!tokenPay) {
      return res.status(400).json({ error: 'tokenPay manquant' });
    }

    // Find the order by paymentRef
    const order = await prisma.order.findFirst({
      where: { paymentRef: tokenPay },
    });

    if (!order) {
      console.warn(`[payments] No order found for tokenPay: ${tokenPay}`);
      return res.status(404).json({ error: 'Commande introuvable' });
    }

    const isPaid = statut === 'paid' || statut === 'successful' || statut === 'success';

    await prisma.$transaction(async (tx) => {
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

    console.log(`[payments] Order #${order.orderNumber} payment ${isPaid ? 'confirmed' : 'failed'}`);
    res.json({ status: 'ok' });
  } catch (e) {
    console.error('[payments] Webhook error:', e);
    res.status(500).json({ error: 'Erreur interne' });
  }
});

/**
 * GET /api/payments/status/:tokenPay
 * Vérifie le statut d'un paiement via Money Fusion.
 */
paymentsRouter.get('/status/:tokenPay', authRequired, async (req: Request, res: Response) => {
  try {
    const { tokenPay } = req.params;
    const mfNotifUrl = env.MONEYFUSION_NOTIF_URL;

    if (!mfNotifUrl || !tokenPay) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    const checkUrl = `${mfNotifUrl}${tokenPay}`;
    const response = await fetch(checkUrl);

    if (!response.ok) {
      return res.status(502).json({ error: 'Impossible de vérifier le paiement' });
    }

    const result = await response.json();
    res.json({ data: result });
  } catch (e) {
    console.error('[payments] Status check error:', e);
    res.status(500).json({ error: 'Erreur interne' });
  }
});
