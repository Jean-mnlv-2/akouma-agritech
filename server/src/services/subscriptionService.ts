import { Plan, Subscription } from '@prisma/client';
import { logger } from '../utils/logger';
import { env } from '../utils/env';
import { emailService } from '../utils/email';
import { prisma } from '../db';
function addOneMonth(date: Date): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  return next;
}

export class SubscriptionService {
  /**
   * Ensure default plans exist in the database
   */
  async ensureDefaultPlans(): Promise<void> {
    const defaultPlans = [
      {
        name: 'free',
        displayName: 'Gratuit',
        description: 'Accès aux fonctionnalités de base avec des limitations',
        price: 0,
        currency: 'XOF',
        dailyProMessageLimit: 10,
        hasCustomDocuments: false,
        hasPrioritySupport: false,
        hasApiAccess: false,
        maxCustomDocuments: 0,
        trialDays: 0,
        sortOrder: 0,
        isActive: true,
      },
      {
        name: 'starter',
        displayName: 'Starter',
        description: 'Essai gratuit de 7 jours avec accès aux documents personnalisés',
        price: 5000,
        currency: 'XOF',
        dailyProMessageLimit: 20,
        hasCustomDocuments: true,
        hasPrioritySupport: false,
        hasApiAccess: false,
        maxCustomDocuments: 5,
        trialDays: 7,
        sortOrder: 1,
        isActive: true,
      },
      {
        name: 'pro',
        displayName: 'Pro',
        description: 'Accès complet avec support prioritaire',
        price: 15000,
        currency: 'XOF',
        dailyProMessageLimit: 100,
        hasCustomDocuments: true,
        hasPrioritySupport: true,
        hasApiAccess: false,
        maxCustomDocuments: 20,
        trialDays: 0,
        sortOrder: 2,
        isActive: true,
      },
      {
        name: 'enterprise',
        displayName: 'Entreprise',
        description: 'Solution complète avec API dédiée et support premium',
        price: 50000,
        currency: 'XOF',
        dailyProMessageLimit: 0, // 0 = unlimited
        hasCustomDocuments: true,
        hasPrioritySupport: true,
        hasApiAccess: true,
        maxCustomDocuments: 0, // 0 = unlimited
        trialDays: 0,
        sortOrder: 3,
        isActive: true,
      },
    ];

    for (const planData of defaultPlans) {
      const existing = await prisma.plan.findUnique({
        where: { name: planData.name },
      });

      if (!existing) {
        await prisma.plan.create({
          data: planData,
        });
        logger.info(`[SubscriptionService] Created plan: ${planData.name}`);
      } else {
        await prisma.plan.update({
          where: { name: planData.name },
          data: planData,
        });
        logger.info(`[SubscriptionService] Updated plan: ${planData.name}`);
      }
    }
  }

  /**
   * Get a user's current subscription
   */
  async getUserSubscription(userId: string): Promise<(Subscription & { plan: Plan }) | null> {
    return prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
  }

  /**
   * Check if a user's subscription is active
   */
  isSubscriptionActive(subscription: (Subscription & { plan: Plan }) | null): boolean {
    if (!subscription || subscription.status !== 'active') {
      return false;
    }

    const now = new Date();

    // Check if trial is active
    if (subscription.isTrial && subscription.trialEndDate && now < subscription.trialEndDate) {
      return true;
    }

    // Check if paid subscription is active
    if (subscription.currentPeriodEnd && now < subscription.currentPeriodEnd) {
      return true;
    }

    return false;
  }

  /**
   * Get user's daily PRO message limit
   */
  async getUserProLimit(userId: string): Promise<{ limit: number; isPro: boolean }> {
    const subscription = await this.getUserSubscription(userId);
    const defaultLimit = Number(process.env.CHAT_DAILY_PRO_BUDGET || 10);

    if (!this.isSubscriptionActive(subscription)) {
      return { limit: defaultLimit, isPro: false };
    }

    return {
      limit: subscription!.plan.dailyProMessageLimit,
      isPro: subscription!.plan.dailyProMessageLimit !== defaultLimit,
    };
  }

  /**
   * Generate invoice number
   */
  generateInvoiceNumber(): string {
    const prefix = 'INV';
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${dateStr}-${random}`;
  }

  /**
   * Create an invoice for a subscription
   */
  async createInvoice(
    subscriptionId: string,
    userId: string,
    amount: number,
    currency: string = 'XOF'
  ) {
    const invoiceNumber = this.generateInvoiceNumber();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // Payment due in 14 days

    return prisma.invoice.create({
      data: {
        subscriptionId,
        userId,
        amount,
        currency,
        invoiceNumber,
        dueDate,
        status: 'pending',
      },
    });
  }

  /**
   * Create a subscription for a user
   */
  async createSubscription(
    userId: string,
    planId: string
  ): Promise<Subscription & { plan: Plan }> {
    const [plan, user] = await Promise.all([
      prisma.plan.findUnique({ where: { id: planId, isActive: true } }),
      prisma.user.findUnique({ where: { id: userId }, select: { hasUsedTrial: true } }),
    ]);

    if (!plan) {
      throw new Error('Plan not found');
    }
    if (!user) {
      throw new Error('User not found');
    }

    const now = new Date();
    const startDate = now;
    const currentPeriodEnd = new Date(startDate);
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1); // 1 month subscription

    // Un essai gratuit ne peut être accordé qu'une seule fois par utilisateur —
    // sans quoi annuler puis se réabonner au même plan permettait un essai infini.
    const isTrial = plan.trialDays > 0 && !user.hasUsedTrial;
    const trialEndDate = isTrial
      ? new Date(startDate.getTime() + plan.trialDays * 24 * 60 * 60 * 1000)
      : null;

    const subscription = await prisma.$transaction(async (tx) => {
      // Delete existing subscription if any
      await tx.subscription.deleteMany({ where: { userId } });

      const created = await tx.subscription.create({
        data: {
          userId,
          planId,
          status: 'active',
          startDate,
          currentPeriodStart: startDate,
          currentPeriodEnd,
          isTrial,
          trialStartDate: isTrial ? startDate : null,
          trialEndDate,
        },
        include: { plan: true },
      });

      if (isTrial) {
        await tx.user.update({ where: { id: userId }, data: { hasUsedTrial: true } });
      }

      return created;
    });

    // Create invoice only if not a free plan
    const planPrice = Number(plan.price);
    if (planPrice > 0 && !isTrial) {
      await this.createInvoice(subscription.id, userId, planPrice, plan.currency);
    }

    return subscription;
  }

  /**
   * Create a technical order for a paid subscription plan so we can reuse
   * the existing Money Fusion payment flow.
   */
  async createCheckoutOrder(userId: string, planId: string) {
    const plan = await prisma.plan.findFirst({
      where: { id: planId, isActive: true },
    });

    if (!plan) {
      throw new Error('Plan introuvable');
    }

    const planPrice = Number(plan.price);
    if (!Number.isFinite(planPrice) || planPrice <= 0) {
      throw new Error('Ce forfait ne nécessite pas de paiement');
    }

    const existingPendingOrder = await prisma.order.findFirst({
      where: {
        userId,
        subscriptionPlanId: plan.id,
        paymentStatus: 'pending',
        status: 'pending',
      },
      include: { items: true, subscriptionPlan: true },
      orderBy: { createdAt: 'desc' },
    });

    if (existingPendingOrder) {
      return existingPendingOrder;
    }

    return prisma.order.create({
      data: {
        userId,
        subscriptionPlanId: plan.id,
        orderNumber: `SUB-${Date.now().toString(36).toUpperCase()}`,
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'money_fusion',
        deliveryMethod: 'PICKUP',
        subtotal: planPrice,
        shipping: 0,
        discount: 0,
        total: planPrice,
        notes: `Abonnement ${plan.displayName}`,
        items: {
          create: [
            {
              productId: 0,
              productType: 'subscription',
              name: `Forfait ${plan.displayName}`,
              price: planPrice,
              quantity: 1,
              imageUrl: null,
            },
          ],
        },
      },
      include: { items: true, subscriptionPlan: true },
    });
  }

  async activatePaidSubscriptionFromOrder(orderId: number): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        subscriptionPlan: true,
        items: true,
      },
    });

    if (!order || !order.subscriptionPlan) {
      return;
    }

    if (order.paymentStatus !== 'paid') {
      return;
    }

    const transactionRef = order.paymentRef || `order-${order.id}`;
    const existingTransaction = await prisma.subscriptionTransaction.findFirst({
      where: { transactionRef },
    });

    if (existingTransaction) {
      return;
    }

    const now = new Date();
    const nextPeriodEnd = addOneMonth(now);

    const subscription = await prisma.subscription.upsert({
      where: { userId: order.userId },
      create: {
        userId: order.userId,
        planId: order.subscriptionPlan.id,
        status: 'active',
        startDate: now,
        currentPeriodStart: now,
        currentPeriodEnd: nextPeriodEnd,
        isTrial: false,
        autoRenew: true,
      },
      update: {
        planId: order.subscriptionPlan.id,
        status: 'active',
        startDate: now,
        currentPeriodStart: now,
        currentPeriodEnd: nextPeriodEnd,
        isTrial: false,
        trialStartDate: null,
        trialEndDate: null,
        autoRenew: true,
      },
      include: { plan: true },
    });

    const invoice = await prisma.invoice.create({
      data: {
        subscriptionId: subscription.id,
        userId: order.userId,
        amount: Number(order.total),
        currency: 'XOF',
        status: 'paid',
        dueDate: now,
        paidAt: now,
        invoiceNumber: this.generateInvoiceNumber(),
        metadata: {
          orderId: order.id,
          paymentRef: order.paymentRef,
          planId: order.subscriptionPlan.id,
        },
      },
    });

    await prisma.subscriptionTransaction.create({
      data: {
        subscriptionId: subscription.id,
        userId: order.userId,
        amount: Number(order.total),
        currency: 'XOF',
        type: 'payment',
        paymentMethod: order.paymentMethod || 'money_fusion',
        transactionRef,
        status: 'paid',
        metadata: {
          orderId: order.id,
          invoiceId: invoice.id,
          planId: order.subscriptionPlan.id,
        },
      },
    });

    const invoicePdfUrl = `${env.API_PUBLIC_URL}/api/subscriptions/invoices/${invoice.id}/pdf`;

    await emailService.sendSubscriptionInvoiceEmail({
      email: order.user.email,
      userName: order.user.fullName || order.user.email,
      planName: order.subscriptionPlan.displayName,
      invoiceNumber: invoice.invoiceNumber,
      amount: Number(order.total),
      pdfUrl: invoicePdfUrl,
    });
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(userId: string): Promise<Subscription | null> {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return null;
    }

    return prisma.subscription.update({
      where: { userId },
      data: {
        status: 'cancelled',
        autoRenew: false,
      },
    });
  }

  /**
   * Send subscription notification
   */
  async sendNotification(
    userId: string,
    type: 'trial_ending' | 'renewal_reminder' | 'payment_failed' | 'expired',
    metadata: Record<string, any> = {}
  ) {
    return prisma.subscriptionNotification.create({
      data: {
        userId,
        type,
        metadata,
      },
    });
  }

  /**
   * Check for expiring trials and send notifications
   */
  async checkExpiringTrials(): Promise<void> {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const expiringTrials = await prisma.subscription.findMany({
      where: {
        isTrial: true,
        trialEndDate: {
          not: null,
          lte: threeDaysFromNow,
          gte: now,
        },
        status: 'active',
      },
      include: { user: true, plan: true },
    });

    for (const subscription of expiringTrials) {
      // Check if we already sent a notification
      const existingNotification = await prisma.subscriptionNotification.findFirst({
        where: {
          userId: subscription.userId,
          type: 'trial_ending',
          sentAt: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });

      if (!existingNotification) {
        await this.sendNotification(subscription.userId, 'trial_ending', {
          trialEndDate: subscription.trialEndDate,
          planName: subscription.plan.displayName,
        });
        await emailService.sendSubscriptionTrialEndingEmail({
          email: subscription.user.email,
          userName: subscription.user.fullName || subscription.user.email,
          planName: subscription.plan.displayName,
          trialEndDate: subscription.trialEndDate!,
          pricingUrl: `${env.FRONTEND_ORIGINS[0]}/pricing`,
        });
        logger.info(`[SubscriptionService] Sent trial ending notification to user: ${subscription.userId}`);
      }
    }
  }

  /**
   * Update subscription analytics
   */
  async updateAnalytics(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalSubscribers = await prisma.subscription.count({
      where: { status: 'active' },
    });

    const newSubscriptions = await prisma.subscription.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    const cancelledSubscriptions = await prisma.subscription.count({
      where: {
        status: 'cancelled',
        updatedAt: {
          gte: today,
        },
      },
    });

    const paidInvoices = await prisma.invoice.findMany({
      where: {
        status: 'paid',
        paidAt: {
          gte: today,
        },
      },
    });

    const revenue = paidInvoices.reduce((sum, inv) => sum + inv.amount.toNumber(), 0);

    await prisma.subscriptionAnalytics.upsert({
      where: { date: today },
      create: {
        date: today,
        totalSubscribers,
        newSubscriptions,
        cancelledSubscriptions,
        revenue,
        currency: 'XOF',
      },
      update: {
        totalSubscribers,
        newSubscriptions,
        cancelledSubscriptions,
        revenue,
      },
    });

    logger.info('[SubscriptionService] Updated subscription analytics');
  }
}
