import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { OrdersService } from '../services/ordersService';
import { env } from '../utils/env';

const prisma = new PrismaClient();
const ordersService = new OrdersService(prisma);
export const paymentsRouter = Router();

/**
 * Webhook pour recevoir les notifications de MoneyFusion
 */
paymentsRouter.post('/webhook/moneyfusion', async (req: Request, res: Response) => {
  const payload = req.body;
  
  // Dans un cas réel, on vérifierait une signature ou un secret
  // Ici on logue pour le debug
  console.log('[MoneyFusion Webhook] Received:', payload);

  const { event, tokenPay, Montant, personal_Info } = payload;

  // Récupérer l'orderId depuis personal_Info s'il existe
  let orderId: number | undefined;
  if (Array.isArray(personal_Info) && personal_Info.length > 0) {
    orderId = Number(personal_Info[0].orderId);
  }

  if (!orderId) {
    console.error('[MoneyFusion Webhook] No orderId found in personal_Info');
    return res.status(400).json({ error: 'orderId missing' });
  }

  try {
    let newStatus: 'paid' | 'failed' | 'pending' = 'pending';

    if (event === 'payin.session.completed') {
      newStatus = 'paid';
    } else if (event === 'payin.session.cancelled') {
      newStatus = 'failed';
    }

    await ordersService.updateOrderPayment(orderId, newStatus, tokenPay);
    
    res.json({ success: true });
  } catch (error) {
    console.error('[MoneyFusion Webhook] Processing error:', error);
    res.status(500).json({ error: 'internal error' });
  }
});

/**
 * Route pour que le frontend vérifie le statut manuellement (polling)
 */
paymentsRouter.get('/status/:token', async (req: Request, res: Response) => {
  const { token } = req.params;

  res.json({ message: "Utilisez l'URL de notification directe ou implémentez le proxy ici" });
});
