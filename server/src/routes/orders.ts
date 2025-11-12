import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';

const prisma = new PrismaClient();
export const ordersRouter = Router();

// Generate unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `AKO-${timestamp}-${random}`;
}

// GET /api/orders - Get all orders (admin) or user's orders
ordersRouter.get('/', authRequired, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const userRole = (req as any).userRole;

    let orders;
    if (userRole === 'admin' || userRole === 'supervisor') {
      // Admin can see all orders
      orders = await prisma.order.findMany({
        include: {
          items: true,
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
      // Regular users can only see their own orders
      orders = await prisma.order.findMany({
        where: { userId },
        include: {
          items: true,
        },
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
    const userId = (req as any).userId;
    const userRole = (req as any).userRole;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
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

    // Check if user has permission to view this order
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
    const userId = (req as any).userId;
    const {
      items,
      subtotal,
      shipping,
      discount,
      total,
      shippingAddress,
      shippingCity,
      shippingCountry,
      shippingPhone,
      paymentMethod,
      notes,
    } = req.body || {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    if (subtotal == null || total == null) {
      return res.status(400).json({ error: 'Subtotal and total are required' });
    }

    // Create order with items
    const order = await prisma.order.create({
      data: {
        userId,
        orderNumber: generateOrderNumber(),
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: paymentMethod || null,
        subtotal,
        shipping: shipping || 0,
        discount: discount || 0,
        total,
        shippingAddress: shippingAddress || null,
        shippingCity: shippingCity || null,
        shippingCountry: shippingCountry || null,
        shippingPhone: shippingPhone || null,
        notes: notes || null,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            productType: item.productType || 'shop_product',
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            imageUrl: item.imageUrl || null,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    res.status(201).json({ data: order });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});

// PUT /api/orders/:id - Update order status (admin only)
ordersRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { status, paymentStatus } = req.body || {};

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const updated = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    res.json({ data: updated });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});

