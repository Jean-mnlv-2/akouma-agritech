import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import { authRequired, adminOnly } from '../middleware/authRequired';
import { validate } from '../middleware/validate';
import { audit, actorFromRequest } from '../utils/audit';
import { OrdersService, NormalizedOrderItem, DeliveryMethod } from '../services/ordersService';

const prisma = new PrismaClient();
const ordersService = new OrdersService(prisma);
export const ordersRouter = Router();

// NOTE: prix/frais/imageUrl envoyés par le client sont IGNORÉS par ordersService
// (rechargés depuis la DB). Le schéma les accepte pour compat front mais ils
// n'ont aucun effet sur le total.
const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]),
    productType: z.enum(['shop_product', 'course', 'seed']).optional(),
    name: z.string().max(255).optional(),
    price: z.union([z.number(), z.string()]).optional(),
    quantity: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]),
    imageUrl: z.string().max(2048).nullable().optional(),
  }).strict()).min(1).max(50),
  shippingAddress: z.string().max(500).nullable().optional(),
  shippingCity: z.string().max(120).nullable().optional(),
  shippingCountry: z.string().max(120).nullable().optional(),
  shippingPhone: z.string().max(40).nullable().optional(),
  paymentMethod: z.string().max(50).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  promoCode: z.string().max(50).nullable().optional(),
  deliveryMethod: z.string().max(20).optional(),
  deliveryPartnerId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/), z.null()]).optional(),
  shippingFee: z.union([z.number(), z.string(), z.null()]).optional(),
}).strict();

const updateOrderSchema = z.object({
  status: z.string().max(50).optional(),
  paymentStatus: z.string().max(50).optional(),
  note: z.string().max(2000).optional(),
}).strict();

type AuthenticatedUser = {
  id?: string;
  role?: string;
};

type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
  userId?: string;
  userRole?: string;
};

// GET /api/orders - Get all orders (admin) or user's orders
ordersRouter.get('/', authRequired, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const authUser: AuthenticatedUser = authReq.user || {};
    const userId = authUser.id ?? authReq.userId;
    const userRole = authUser.role ?? authReq.userRole;
    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const includeCommon = {
      items: true,
      promoCode: true,
      deliveryPartner: true,
      events: {
        orderBy: { createdAt: 'desc' },
      },
    } as const;

    let orders;
    if (userRole === 'admin' || userRole === 'supervisor') {
      orders = await prisma.order.findMany({
        include: {
          ...includeCommon,
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      orders = await prisma.order.findMany({
        where: { userId },
        include: includeCommon,
        orderBy: { createdAt: 'desc' },
      });
    }

    res.json({ data: orders });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});

// GET /api/orders/:id - Get a specific order
ordersRouter.get('/:id', authRequired, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const authReq = req as AuthenticatedRequest;
    const authUser: AuthenticatedUser = authReq.user || {};
    const userId = authUser.id ?? authReq.userId;
    const userRole = authUser.role ?? authReq.userRole;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        promoCode: true,
        events: {
          orderBy: { createdAt: 'desc' },
        },
        deliveryPartner: true,
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (userRole !== 'admin' && userRole !== 'supervisor' && order.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({ data: order });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});

// POST /api/orders - Create a new order
ordersRouter.post('/', authRequired, validate(createOrderSchema), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const authUser: AuthenticatedUser = authReq.user || {};
    const userId = authUser.id ?? authReq.userId;
    const {
      items,
      shippingAddress,
      shippingCity,
      shippingCountry,
      shippingPhone,
      paymentMethod,
      notes,
      promoCode,
      deliveryMethod,
      deliveryPartnerId,
      shippingFee,
    } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    type IncomingOrderItem = {
      productId: number | string;
      productType?: string;
      name?: string;
      price: number | string;
      quantity: number | string;
      imageUrl?: string | null;
    };

    const normalizedItems: NormalizedOrderItem[] = (items as IncomingOrderItem[]).map((item) => {
      const price = Number(item.price);
      const quantity = Number(item.quantity);
      if (!item.productId || !Number.isFinite(price) || !Number.isFinite(quantity)) {
        throw new Error('Invalid cart item');
      }
      return {
        productId: Number(item.productId),
        productType: item.productType || 'shop_product',
        name: String(item.name || ''),
        price,
        quantity,
        imageUrl: item.imageUrl ? String(item.imageUrl) : null,
      };
    });

    const rawDeliveryMethod = typeof deliveryMethod === 'string' ? deliveryMethod.trim().toUpperCase() : undefined;
    const allowedDeliveryMethods = Object.values(DeliveryMethod);
    const selectedDeliveryMethod = allowedDeliveryMethods.includes(rawDeliveryMethod as DeliveryMethod)
      ? (rawDeliveryMethod as DeliveryMethod)
      : DeliveryMethod.PICKUP;

    try {
      const result = await ordersService.createOrder({
        userId,
        items: normalizedItems,
        shippingAddress,
        shippingCity,
        shippingCountry,
        shippingPhone,
        paymentMethod: paymentMethod || null,
        notes: notes || null,
        promoCode: promoCode || null,
        deliveryMethod: selectedDeliveryMethod,
        deliveryPartnerId: deliveryPartnerId != null ? Number(deliveryPartnerId) : null,
        shippingFee: shippingFee != null ? Number(shippingFee) : null,
      });
      await audit({ ...actorFromRequest(req), action: 'order.create', entityType: 'order', entityId: (result as any)?.id, metadata: { itemCount: normalizedItems.length, deliveryMethod: selectedDeliveryMethod, promoCode: promoCode || undefined } });
      res.status(201).json({ data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bad request';
      if (message === 'Le panier est vide.' || message.startsWith('Code promo') || message.startsWith('Ce code promo')) {
        return res.status(400).json({ error: message });
      }
      if (message.startsWith('Un partenaire de livraison') || message.startsWith('Partenaire de livraison')) {
        const status = message.startsWith('Un partenaire') ? 400 : 404;
        return res.status(status).json({ error: message });
      }
      res.status(400).json({ error: message });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error: message });
  }
});

// PUT /api/orders/:id - Update order status (admin only)
ordersRouter.put('/:id', authRequired, adminOnly, validate(updateOrderSchema), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { status, paymentStatus, note } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const order = await tx.order.update({
        where: { id },
        data: updateData,
        include: {
          items: true,
          promoCode: true,
          deliveryPartner: true,
          events: {
            orderBy: { createdAt: 'desc' },
          },
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
      });

      if (status || paymentStatus || note) {
        await tx.orderEvent.create({
          data: {
            orderId: order.id,
            type: 'update',
            status: status || order.status,
            paymentStatus: paymentStatus || order.paymentStatus,
            note: note || undefined,
          },
        });
      }

      return order;
    });

    await audit({ ...actorFromRequest(req), action: 'order.update', entityType: 'order', entityId: id, metadata: { status, paymentStatus, note } });

    // Trigger post-payment processing if payment status was updated to 'paid'
    if (paymentStatus === 'paid') {
      ordersService.processPostPayment(updated.id).catch((err) => {
        console.error(`[orders] Error in processPostPayment for order ${updated.id}:`, err);
      });
    }

    res.json({ data: updated });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});

