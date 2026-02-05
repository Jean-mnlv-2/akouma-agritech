import { Router, Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';
import { eventEmitter } from '../services/eventEmitter';

const prisma = new PrismaClient();

type DiscountType = 'PERCENTAGE' | 'FIXED';
type DeliveryMethod = 'PICKUP' | 'DELIVERY';

const DELIVERY_METHOD = {
  PICKUP: 'PICKUP' as const,
  DELIVERY: 'DELIVERY' as const,
} as const;

const DELIVERY_METHOD_VALUES: DeliveryMethod[] = ['PICKUP', 'DELIVERY'];

export const ordersRouter = Router();

// Generate unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `AKO-${timestamp}-${random}`;
}

function calculateShipping(subtotal: number, deliveryMethod: DeliveryMethod, partner?: { baseRate: Prisma.Decimal | null }): number {
  if (deliveryMethod === 'PICKUP') return 0;
  if (partner?.baseRate != null) {
    const rate = Number(partner.baseRate);
    if (Number.isFinite(rate) && rate >= 0) {
      return rate;
    }
  }
  if (!Number.isFinite(subtotal)) return 0;
  return subtotal > 50000 ? 0 : 5000;
}

function calculateDiscountAmount(subtotal: number, promo: { discountType: DiscountType; discountValue: Prisma.Decimal }): number {
  const amount = Number(promo.discountValue);
  if (promo.discountType === 'PERCENTAGE') {
    const rate = Math.min(Math.max(amount, 0), 100);
    return Math.min(subtotal, (subtotal * rate) / 100);
  }
  return Math.min(subtotal, Math.max(amount, 0));
}

async function resolvePromoCode(tx: Prisma.TransactionClient, code: string, subtotal: number) {
  if (!code) return { promo: null, discountAmount: 0 };

  const now = new Date();
  const promo = await tx.promoCode.findFirst({
    where: {
      code: code.toUpperCase(),
      isActive: true,
      AND: [
        {
          OR: [
            { validFrom: null },
            { validFrom: { lte: now } },
          ],
        },
        {
          OR: [
            { validUntil: null },
            { validUntil: { gte: now } },
          ],
        },
      ],
    },
  });

  if (!promo) {
    throw new Error('Code promo invalide ou expiré');
  }
  if (promo.maxUses != null && promo.usesCount >= promo.maxUses) {
    throw new Error('Ce code promo a atteint le nombre maximal d’utilisations');
  }

  const discountAmount = calculateDiscountAmount(subtotal, { discountType: promo.discountType as DiscountType, discountValue: promo.discountValue });
  if (discountAmount <= 0) {
    throw new Error('Ce code promo ne peut pas être appliqué');
  }

  return { promo, discountAmount };
}

async function createOrderEvent(tx: Prisma.TransactionClient, orderId: number, type: string, status?: string | null, paymentStatus?: string | null, note?: string | null) {
  await tx.orderEvent.create({
    data: {
      orderId,
      type,
      status: status || undefined,
      paymentStatus: paymentStatus || undefined,
      note: note || undefined,
    },
  });
}

// GET /api/orders - Get all orders (admin) or user's orders
ordersRouter.get('/', authRequired, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
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
    const userId = req.user?.id;
    const userRole = req.user?.role;

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
ordersRouter.post('/', authRequired, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
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
    } = req.body || {};

    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    const normalizedItems = items.map((item: Record<string, unknown>) => {
      const price = Number(item.price);
      const quantity = Number(item.quantity);
      if (!item.productId || !Number.isFinite(price) || !Number.isFinite(quantity)) {
        throw new Error('Invalid cart item');
      }
      return {
        productId: Number(item.productId),
        productType: (item.productType as string) || 'shop_product',
        name: String(item.name || ''),
        price,
        quantity,
        imageUrl: item.imageUrl ? String(item.imageUrl) : null,
      };
    });

    const computedSubtotal = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (computedSubtotal <= 0) {
      return res.status(400).json({ error: 'Le panier est vide.' });
    }

    const rawDeliveryMethod = typeof deliveryMethod === 'string' ? deliveryMethod.trim().toUpperCase() : undefined;
    const selectedDeliveryMethod = DELIVERY_METHOD_VALUES.includes(rawDeliveryMethod as DeliveryMethod)
      ? (rawDeliveryMethod as DeliveryMethod)
      : DELIVERY_METHOD.PICKUP;

    let deliveryPartnerRecord: { id: number; name: string; baseRate: Prisma.Decimal | null } | null = null;
    let deliveryPartnerNumericId: number | null = null;

    if (selectedDeliveryMethod === DELIVERY_METHOD.DELIVERY) {
      const numericPartnerId = Number(deliveryPartnerId);
      if (!Number.isFinite(numericPartnerId)) {
        return res.status(400).json({ error: 'Un partenaire de livraison valide est requis.' });
      }
      deliveryPartnerRecord = await prisma.deliveryPartner.findFirst({
        where: { id: numericPartnerId, isActive: true },
      });
      if (!deliveryPartnerRecord) {
        return res.status(404).json({ error: 'Partenaire de livraison introuvable ou inactif.' });
      }
      deliveryPartnerNumericId = deliveryPartnerRecord.id;
    }

    const shippingAmount = calculateShipping(computedSubtotal, selectedDeliveryMethod, deliveryPartnerRecord || undefined);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let promoRecord: { id: number; code: string } | null = null;
      let discountAmount = 0;

      if (promoCode) {
        const { promo, discountAmount: promoDiscount } = await resolvePromoCode(tx, promoCode, computedSubtotal);
        if (promo) {
          promoRecord = { id: promo.id, code: promo.code };
          discountAmount = promoDiscount;
        }
      }

      const total = Math.max(0, computedSubtotal - discountAmount + shippingAmount);

      const eventNotes: string[] = [];

      if (promoRecord) {
        eventNotes.push(`Code promo appliqué: ${promoRecord.code}`);
      }
      if (selectedDeliveryMethod === DELIVERY_METHOD.DELIVERY && deliveryPartnerRecord) {
        eventNotes.push(`Livraison: ${deliveryPartnerRecord.name}`);
      }

      const order = await tx.order.create({
        data: {
          userId,
          orderNumber: generateOrderNumber(),
          status: 'pending',
          paymentStatus: 'pending',
          paymentMethod: paymentMethod || null,
          subtotal: computedSubtotal,
          shipping: shippingAmount,
          discount: discountAmount,
          total,
          shippingAddress: shippingAddress || null,
          shippingCity: shippingCity || null,
          shippingCountry: shippingCountry || null,
          shippingPhone: shippingPhone || null,
          notes: notes || null,
          promoCodeId: promoRecord?.id,
          deliveryMethod: selectedDeliveryMethod,
          deliveryPartnerId: deliveryPartnerNumericId,
          items: {
            create: normalizedItems.map((item) => ({
              productId: item.productId,
              productType: item.productType,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              imageUrl: item.imageUrl,
            })),
          },
        },
        include: {
          items: true,
          promoCode: true,
          deliveryPartner: true,
        },
      });

      await createOrderEvent(
        tx,
        order.id,
        'created',
        order.status,
        order.paymentStatus,
        eventNotes.length > 0 ? eventNotes.join(' | ') : undefined,
      );

      if (promoRecord) {
        await tx.promoCode.update({
          where: { id: promoRecord.id },
          data: {
            usesCount: { increment: 1 },
          },
        });
      }

      return order;
    });

    res.status(201).json({ data: result });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error: message });
  }
});

// PUT /api/orders/:id - Update order status (admin only)
ordersRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { status, paymentStatus, note } = req.body || {};

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    // Récupérer l'ordre actuel pour détecter le changement de statut
    const currentOrder = await prisma.order.findUnique({
      where: { id },
      select: { paymentStatus: true },
    });

    if (!currentOrder) {
      return res.status(404).json({ error: 'Order not found' });
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
        await createOrderEvent(tx, order.id, 'update', status || order.status, paymentStatus || order.paymentStatus, note || undefined);
      }

      return order;
    });

    // ✅ ÉMISSION D'ÉVÉNEMENT : ORDER_PAID
    if (paymentStatus === 'paid' && currentOrder.paymentStatus !== 'paid') {
      await eventEmitter.emit({
        type: 'ORDER_PAID',
        data: {
          orderId: updated.id,
          orderNumber: updated.orderNumber,
          userId: updated.userId,
          total: Number(updated.total),
          paymentMethod: updated.paymentMethod || null,
        },
      });
    }

    res.json({ data: updated });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});
