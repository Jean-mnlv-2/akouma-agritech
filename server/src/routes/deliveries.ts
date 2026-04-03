import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';
import * as deliveryService from '../services/deliveryService';

const prisma = new PrismaClient();
export const deliveriesRouter = Router();

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