import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { env } from '../utils/env';
import { authRequired, adminOnly } from '../middleware/authRequired';
import { validate } from '../middleware/validate';
import { antiReplay, timingSafeEqualStr } from '../middleware/webhookReplay';
import { audit, actorFromRequest } from '../utils/audit';
import * as deliveryService from '../services/deliveryService';

const prisma = new PrismaClient();
export const deliveriesRouter = Router();

const webhookSchema = z.object({
  id: z.union([z.string().min(1).max(255), z.number()]),
  status: z.string().min(1).max(50),
  commandeId: z.union([z.string().max(255), z.number(), z.null()]).optional(),
}).passthrough();

// Guard: avoid noisy 500s when delivery API is not configured
function isDeliveryConfigured(): boolean {
  return !!(env.DELIVERY_API_URL && env.DELIVERY_API_PUBLIC_KEY && env.DELIVERY_API_SECRET_KEY);
}

deliveriesRouter.use((req, res, next) => {
  if (!isDeliveryConfigured()) {
    return res.status(503).json({
      error: 'Service de livraison non configuré (DELIVERY_API_URL / clés API manquantes).',
      configured: false,
      data: [],
    });
  }
  next();
});

// GET /api/deliveries - List all deliveries
deliveriesRouter.get('/', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const { page, limit, status, isDelegated } = req.query;
    const deliveries = await deliveryService.getDeliveries({
      page,
      limit,
      status,
      isDelegated,
    });
    res.json(deliveries);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch deliveries';
    res.status(500).json({ error: message });
  }
});

// GET /api/deliveries/livreurs - List available livreurs
deliveriesRouter.get('/livreurs', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const { page, limit, availability, search } = req.query;
    const livreurs = await deliveryService.getLivreurs({
      page,
      limit,
      availability: availability || 'DISPONIBLE',
      search,
    });
    res.json(livreurs);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch livreurs';
    res.status(500).json({ error: message });
  }
});

// POST /api/deliveries/assign - Assign a livreur to a delivery
deliveriesRouter.post('/assign', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const { livraisonId, livreurId } = req.body;

    if (!livraisonId || !livreurId) {
      return res.status(400).json({ error: 'livraisonId et livreurId sont requis' });
    }

    const updated = await deliveryService.assignLivreur(livraisonId, livreurId);
    
    // Also update our local order status if needed
    const order = await prisma.order.findUnique({
      where: { deliveryId: livraisonId },
    });

    if (order) {
      await prisma.order.update({
        where: { id: order.id },
        data: { deliveryStatus: updated.status },
      });
    }

    res.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to assign livreur';
    res.status(500).json({ error: message });
  }
});

deliveriesRouter.post('/estimate', authRequired, async (req: Request, res: Response) => {
  try {
    const { dropAddressId, items, cartTotal } = req.body;

    if (!dropAddressId) {
      return res.status(400).json({ error: 'dropAddressId est requis pour l\'estimation' });
    }

    const estimate = await deliveryService.getShippingEstimate({
      pickAddressId: env.DELIVERY_PICK_ADDRESS_ID,
      dropAddressId,
      items,
      cartTotal,
    });

    res.json({ data: estimate });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Échec de l\'estimation de livraison';
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/deliveries/webhook
 * Webhook receiver for real-time status updates from LeLivreur
 */
deliveriesRouter.post(
  '/webhook',
  antiReplay({
    source: 'lelivreur',
    timestampHeader: 'x-delivery-timestamp',
    nonceHeader: 'x-delivery-nonce',
    required: !!env.DELIVERY_API_SECRET_KEY,
  }),
  validate(webhookSchema),
  async (req: Request, res: Response) => {
  try {
    const { id, status, commandeId } = req.body as { id: string | number; status: string; commandeId?: string | number };

    // Verify HMAC signature if secret is configured
    if (env.DELIVERY_API_SECRET_KEY) {
      const signatureHeader = req.headers['x-delivery-signature'] || req.headers['x-lelivreur-signature'];
      if (!signatureHeader) {
        return res.status(401).json({ error: 'Signature manquante' });
      }

      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', env.DELIVERY_API_SECRET_KEY);
      const rawBody = JSON.stringify(req.body);
      hmac.update(rawBody);
      const computedSignature = hmac.digest('hex');

      // Check if signature matches
      const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
      if (!timingSafeEqualStr(String(signature), computedSignature)) {
        return res.status(403).json({ error: 'Signature invalide' });
      }
    }

    const orderNumberFromId = typeof commandeId === 'string' && commandeId.startsWith('KLM-') 
      ? commandeId.split('-').slice(0, 3).join('-')
      : null;

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { deliveryId: String(id) },
          ...(orderNumberFromId ? [{ orderNumber: orderNumberFromId }] : []),
          ...(Number.isInteger(Number(commandeId)) ? [{ id: Number(commandeId) }] : [])
        ]
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée pour ce webhook' });
    }

    // Idempotency check: don't process same event multiple times
    const existingEvent = await prisma.orderEvent.findFirst({
      where: {
        orderId: order.id,
        type: 'delivery_update',
        note: `Mise à jour webhook LeLivreur: Statut ${status}`,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });
    if (existingEvent) {
      return res.json({ success: true });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        deliveryStatus: status,
        deliveryId: String(id)
      }
    });

    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        type: 'delivery_update',
        status: order.status,
        paymentStatus: order.paymentStatus,
        note: `Mise à jour webhook LeLivreur: Statut ${status}`
      }
    });

    await audit({ action: 'delivery.webhook', entityType: 'order', entityId: order.id, metadata: { deliveryId: id, status } });

    res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors du traitement du webhook livraison';
    res.status(500).json({ error: message });
  }
},
);