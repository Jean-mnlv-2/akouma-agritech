import { Prisma, PrismaClient } from '@prisma/client';
import { env } from '../utils/env';
import * as deliveryService from './deliveryService';
import { logger } from '../utils/logger';
import { emailService } from '../utils/email';
import { randomUUID, createHash } from 'crypto';

export type DeliveryMethod = 'PICKUP' | 'DELIVERY';
export const DeliveryMethod: { PICKUP: 'PICKUP'; DELIVERY: 'DELIVERY' } = {
  PICKUP: 'PICKUP',
  DELIVERY: 'DELIVERY',
};

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
  shippingState?: string | null;
  shippingZipCode?: string | null;
  shippingCountry?: string | null;
  shippingPhone?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
  promoCode?: string | null;
  deliveryMethod: DeliveryMethod;
  deliveryPartnerId?: number | null;
  shippingFee?: number | null;
};

export class OrdersService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `KLM-${timestamp}-${random}`;
  }

  calculateShipping(subtotal: number, deliveryMethod: DeliveryMethod, partner?: { baseRate: any | null }): number {
    // Si retrait sur place, c'est gratuit
    if (deliveryMethod === 'PICKUP') return 0;

    // Si le panier est vide ou invalide, pas de frais calculables
    if (!Number.isFinite(subtotal) || subtotal <= 0) return 0;

    if (partner?.baseRate != null) {
      const rate = Number(partner.baseRate);
      if (Number.isFinite(rate) && rate >= 0) {
        return rate;
      }
    }

    return 0;
  }

  calculateDiscountAmount(subtotal: number, promo: { discountType: DiscountType; discountValue: any }): number {
    const amount = Number(promo.discountValue);
    if (promo.discountType === 'PERCENTAGE') {
      const rate = Math.min(Math.max(amount, 0), 100);
      return Math.min(subtotal, (subtotal * rate) / 100);
    }
    return Math.min(subtotal, Math.max(amount, 0));
  }

  private async resolvePromoCode(tx: any, code: string, subtotal: number) {
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
    tx: any,
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
    // SÉCURITÉ: ne JAMAIS faire confiance aux prix envoyés par le client.
    // On recharge chaque produit depuis la base et on recalcule tout côté serveur.
    const trustedItems: NormalizedOrderItem[] = [];
    for (const raw of payload.items) {
      const qty = Math.max(0, Math.floor(Number(raw.quantity)));
      if (!qty || !Number.isFinite(qty)) {
        throw new Error('Quantité invalide');
      }
      const productId = Number(raw.productId);
      if (!Number.isFinite(productId)) {
        throw new Error('Produit invalide');
      }
      const type = String(raw.productType || 'shop_product');
      let dbPrice: number | null = null;
      let dbName = '';
      let dbImage: string | null = null;
      if (type === 'course') {
        const c = await this.prisma.course.findUnique({ where: { id: productId } });
        if (!c) throw new Error('Cours introuvable');
        dbPrice = Number(c.price); dbName = c.title; dbImage = c.thumbnailUrl ?? null;
      } else if (type === 'seed') {
        const s = await this.prisma.seed.findUnique({ where: { id: productId } });
        if (!s) throw new Error('Semence introuvable');
        dbPrice = Number(s.price); dbName = s.name; dbImage = s.imageUrl ?? null;
      } else {
        const p = await this.prisma.shopProduct.findUnique({ where: { id: productId } });
        if (!p || p.isActive === false) throw new Error('Produit indisponible');
        dbPrice = Number(p.price); dbName = p.name; dbImage = p.imageUrl ?? null;
      }
      if (!Number.isFinite(dbPrice) || (dbPrice ?? 0) < 0) {
        throw new Error('Prix produit invalide');
      }
      trustedItems.push({
        productId,
        productType: type,
        name: dbName,
        price: dbPrice as number,
        quantity: qty,
        imageUrl: dbImage,
      });
    }

    const computedSubtotal = trustedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (computedSubtotal <= 0) {
      throw new Error('Le panier est vide.');
    }

    let deliveryPartnerRecord: { id: number; name: string; baseRate: any | null } | null = null;
    let deliveryPartnerNumericId: number | null = null;

    if (payload.deliveryMethod === DeliveryMethod.DELIVERY) {
      // Si aucun partenaire n'est fourni, on essaie d'assigner "Le Livreur" par défaut
      let targetPartnerId = payload.deliveryPartnerId;
      
      if (targetPartnerId == null) {
        const defaultPartner = await deliveryService.ensurePartnerExists();
        if (defaultPartner) {
          targetPartnerId = defaultPartner.id;
        }
      }

      if (targetPartnerId != null) {
        const numericPartnerId = Number(targetPartnerId);
        if (Number.isFinite(numericPartnerId)) {
          deliveryPartnerRecord = await this.prisma.deliveryPartner.findFirst({
            where: { id: numericPartnerId, isActive: true },
          });
          if (deliveryPartnerRecord) {
            deliveryPartnerNumericId = deliveryPartnerRecord.id;
          }
        }
      }
    }

    // SÉCURITÉ: les frais d'expédition sont toujours calculés côté serveur.
    // La valeur éventuellement transmise par le client est ignorée.
    const shippingAmount = this.calculateShipping(
      computedSubtotal,
      payload.deliveryMethod,
      deliveryPartnerRecord || undefined,
    );

    const order = await this.prisma.$transaction(async (tx: any) => {
      let promoRecord: { id: number; code: string; cashbackPercent: number; ownerEmail: string | null; ownerName: string | null } | null = null;
      let discountAmount = 0;

      if (payload.promoCode) {
        const resolved = await this.resolvePromoCode(tx, payload.promoCode, computedSubtotal);
        promoRecord = resolved.promo
          ? { id: resolved.promo.id, code: resolved.promo.code, cashbackPercent: Number(resolved.promo.cashbackPercent || 0), ownerEmail: resolved.promo.ownerEmail || null, ownerName: resolved.promo.ownerName || null }
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
          shippingState: payload.shippingState || null,
          shippingZipCode: payload.shippingZipCode || null,
          shippingCountry: payload.shippingCountry || null,
          shippingPhone: payload.shippingPhone || null,
          notes: payload.notes || null,
          promoCodeId: promoRecord?.id,
          deliveryMethod: payload.deliveryMethod,
          deliveryPartnerId: deliveryPartnerNumericId,
          items: {
            create: trustedItems.map((item) => ({
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
        // Increment usage count
        await tx.promoCode.update({
          where: { id: promoRecord.id },
          data: {
            usesCount: { increment: 1 },
          },
        });

        // Calculate and credit cashback to the promo owner
        if (promoRecord.cashbackPercent > 0 && promoRecord.ownerEmail) {
          const cashbackAmount = Math.round((computedSubtotal * promoRecord.cashbackPercent) / 100);
          if (cashbackAmount > 0) {
            const updatedPromo = await tx.promoCode.update({
              where: { id: promoRecord.id },
              data: {
                cashbackBalance: { increment: cashbackAmount },
                totalCashbackEarned: { increment: cashbackAmount },
              },
            });
            // Log the cashback transaction
            await (tx as any).cashbackTransaction.create({
              data: {
                promoCodeId: promoRecord.id,
                type: 'EARN',
                amount: cashbackAmount,
                description: `Cashback sur commande`,
                orderId: created.id,
                balanceAfter: Number(updatedPromo.cashbackBalance),
              },
            });
          }
        }
      }

      return created;
    });

    // Send cashback notification to promo owner asynchronously
    const promoData = await this.prisma.$transaction(async (tx: any) => {
      const o = await tx.order.findUnique({ where: { id: order.id }, include: { promoCode: true } });
      return o?.promoCode;
    });
    if (promoData?.ownerEmail && Number(promoData.cashbackPercent) > 0) {
      emailService.sendPromoCashbackNotification({
        ownerEmail: promoData.ownerEmail,
        ownerName: promoData.ownerName || 'Partenaire',
        promoCode: promoData.code,
        cashbackAmount: Math.round((computedSubtotal * Number(promoData.cashbackPercent)) / 100),
        newBalance: Number(promoData.cashbackBalance),
        orderNumber: order.orderNumber,
      }).catch((err: any) => logger.error('[OrdersService] Failed to send cashback notification:', err));
    }

    return order;
  }

  async processPostPayment(orderId: number) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true, user: true },
      });

      if (!order) {
        logger.error(`[OrdersService] Order not found for post-payment processing: ${orderId}`);
        return;
      }

      if (order.paymentStatus !== 'paid') {
        logger.warn(`[OrdersService] Order ${order.orderNumber} is not paid, skipping processing`);
        return;
      }

      // Traitement pour les cours E-learning
      const courseItems = order.items.filter((item: any) => item.productType === 'course');
      for (const item of courseItems) {
        const existingEnrollment = await this.prisma.eLearningEnrollment.findUnique({
          where: { userId_courseId: { userId: order.userId, courseId: Number(item.productId) } }
        });
        if (!existingEnrollment) {
          await this.prisma.eLearningEnrollment.create({
            data: {
              userId: order.userId,
              courseId: Number(item.productId),
            }
          });
          logger.info(`[OrdersService] Created E-learning enrollment for user ${order.userId} in course ${item.productId}`);
        } else {
          logger.info(`[OrdersService] E-learning enrollment already exists for user ${order.userId} in course ${item.productId}`);
        }
      }

      if (order.deliveryMethod === DeliveryMethod.DELIVERY) {
        if (order.deliveryId) {
          logger.info(`[OrdersService] Order ${order.orderNumber} already has a delivery ID: ${order.deliveryId}`);
        } else {
          logger.info(`[OrdersService] Creating delivery for order ${order.orderNumber}`);

          const orderUuid = createHash('md5').update(`ORDER-${order.id}`).digest('hex');
          const reinforcedCommandeId = `${order.orderNumber}-${orderUuid}`;

          // Create delivery directly
          const delivery = await deliveryService.createDelivery({
            commandeId: reinforcedCommandeId,
            referenceExterne: order.orderNumber,
            pickAddressId: env.DELIVERY_PICK_ADDRESS_ID, 
            dropAddressId: `${order.shippingAddress}, ${order.shippingZipCode || ''} ${order.shippingCity}, ${order.shippingState || ''}, ${order.shippingCountry}`.replace(/ ,/g, '').replace(/,,/g, ','),
            customerPhone: order.shippingPhone || (order.user as any)?.phone,
            items: order.items.filter((item: any) => item.productType !== 'course').map((item: any) => ({
              id: String(item.productId),
              quantity: item.quantity,
              unitPrice: Number(item.price),
              name: item.name
            })),
            notes: order.notes,
            distanceKm: 0,
            etaMinutes: 1,
          });

          // Update order with delivery info
          await this.prisma.order.update({
            where: { id: order.id },
            data: {
              deliveryId: delivery.id,
              deliveryStatus: delivery.status,
            },
          });

          await this.createOrderEvent(
            this.prisma as any,
            order.id,
            'delivery_created',
            order.status,
            order.paymentStatus,
            `Livraison créée avec l'ID: ${delivery.id}`,
          );

          logger.info(`[OrdersService] Delivery created successfully for order ${order.orderNumber}: ${delivery.id}`);
        }
      } else {
        logger.info(`[OrdersService] Order ${order.orderNumber} is PICKUP, no delivery to create`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[OrdersService] Failed to process post-payment for order ${orderId}: ${message}`);
    }
  }
}
