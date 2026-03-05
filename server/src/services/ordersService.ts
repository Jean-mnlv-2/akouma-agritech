import { DeliveryMethod, Prisma, PrismaClient } from '@prisma/client';

export type DiscountType = 'PERCENTAGE' | 'FIXED';

export type NormalizedOrderItem = {
  productId: number;
  productType: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
};

export type CreateOrderPayload = {
  userId: string;
  items: NormalizedOrderItem[];
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingCountry?: string | null;
  shippingPhone?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
  promoCode?: string | null;
  deliveryMethod: DeliveryMethod;
  deliveryPartnerId?: number | null;
};

export class OrdersService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `AKO-${timestamp}-${random}`;
  }

  calculateShipping(_subtotal: number, _deliveryMethod: DeliveryMethod, _partner?: { baseRate: Prisma.Decimal | null }): number {
    return 0;
    /* 
    if (deliveryMethod === 'PICKUP') return 0;
    if (partner?.baseRate != null) {
      const rate = Number(partner.baseRate);
      if (Number.isFinite(rate) && rate >= 0) {
        return rate;
      }
    }
    if (!Number.isFinite(subtotal)) return 0;
    if (subtotal > 50000) return 0;
    return 5000;
    */
  }

  calculateDiscountAmount(subtotal: number, promo: { discountType: DiscountType; discountValue: Prisma.Decimal }): number {
    const amount = Number(promo.discountValue);
    if (promo.discountType === 'PERCENTAGE') {
      const rate = Math.min(Math.max(amount, 0), 100);
      return Math.min(subtotal, (subtotal * rate) / 100);
    }
    return Math.min(subtotal, Math.max(amount, 0));
  }

  private async resolvePromoCode(tx: Prisma.TransactionClient, code: string, subtotal: number) {
    if (!code) {
      return { promo: null as null, discountAmount: 0 };
    }
    const now = new Date();
    const promo = await tx.promoCode.findFirst({
      where: {
        code: code.toUpperCase(),
        isActive: true,
        AND: [
          {
            OR: [{ validFrom: null }, { validFrom: { lte: now } }],
          },
          {
            OR: [{ validUntil: null }, { validUntil: { gte: now } }],
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
    const discountAmount = this.calculateDiscountAmount(subtotal, {
      discountType: promo.discountType as DiscountType,
      discountValue: promo.discountValue,
    });
    if (discountAmount <= 0) {
      throw new Error('Ce code promo ne peut pas être appliqué');
    }
    return { promo, discountAmount };
  }

  private async createOrderEvent(
    tx: Prisma.TransactionClient,
    orderId: number,
    type: string,
    status?: string | null,
    paymentStatus?: string | null,
    note?: string | null,
  ) {
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

  async createOrder(payload: CreateOrderPayload) {
    const computedSubtotal = payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (computedSubtotal <= 0) {
      throw new Error('Le panier est vide.');
    }

    let deliveryPartnerRecord: { id: number; name: string; baseRate: Prisma.Decimal | null } | null = null;
    let deliveryPartnerNumericId: number | null = null;

    if (payload.deliveryMethod === DeliveryMethod.DELIVERY) {
      const numericPartnerId = Number(payload.deliveryPartnerId);
      if (!Number.isFinite(numericPartnerId)) {
        throw new Error('Un partenaire de livraison valide est requis.');
      }
      deliveryPartnerRecord = await this.prisma.deliveryPartner.findFirst({
        where: { id: numericPartnerId, isActive: true },
      });
      if (!deliveryPartnerRecord) {
        throw new Error('Partenaire de livraison introuvable ou inactif.');
      }
      deliveryPartnerNumericId = deliveryPartnerRecord.id;
    }

    const shippingAmount = this.calculateShipping(computedSubtotal, payload.deliveryMethod, deliveryPartnerRecord || undefined);

    const order = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let promoRecord: { id: number; code: string } | null = null;
      let discountAmount = 0;

      if (payload.promoCode) {
        const resolved = await this.resolvePromoCode(tx, payload.promoCode, computedSubtotal);
        promoRecord = resolved.promo
          ? { id: resolved.promo.id, code: resolved.promo.code }
          : null;
        discountAmount = resolved.discountAmount;
      }

      const total = Math.max(0, computedSubtotal - discountAmount + shippingAmount);
      const eventNotes: string[] = [];

      if (promoRecord) {
        eventNotes.push(`Code promo appliqué: ${promoRecord.code}`);
      }
      if (payload.deliveryMethod === DeliveryMethod.DELIVERY && deliveryPartnerRecord) {
        eventNotes.push(`Livraison: ${deliveryPartnerRecord.name}`);
      }

      const created = await tx.order.create({
        data: {
          userId: payload.userId,
          orderNumber: this.generateOrderNumber(),
          status: 'pending',
          paymentStatus: 'pending',
          paymentMethod: payload.paymentMethod || null,
          subtotal: computedSubtotal,
          shipping: shippingAmount,
          discount: discountAmount,
          total,
          shippingAddress: payload.shippingAddress || null,
          shippingCity: payload.shippingCity || null,
          shippingCountry: payload.shippingCountry || null,
          shippingPhone: payload.shippingPhone || null,
          notes: payload.notes || null,
          promoCodeId: promoRecord?.id,
          deliveryMethod: payload.deliveryMethod,
          deliveryPartnerId: deliveryPartnerNumericId,
          items: {
            create: payload.items.map((item) => ({
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

      await this.createOrderEvent(
        tx,
        created.id,
        'created',
        created.status,
        created.paymentStatus,
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

      return created;
    });

    return order;
  }

  async updateOrderPayment(orderId: number, status: 'paid' | 'failed' | 'pending', token?: string) {
    return await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      });

      if (!order) throw new Error('Commande introuvable');

      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: status,
          status: status === 'paid' ? 'processing' : undefined,
        },
      });

      await this.createOrderEvent(
        tx,
        orderId,
        'payment_update',
        updated.status,
        updated.paymentStatus,
        `Statut paiement mis à jour via MoneyFusion: ${status}${token ? ` (Token: ${token})` : ''}`
      );

      return updated;
    });
  }
}
