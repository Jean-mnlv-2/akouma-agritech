import { Router, Request, Response } from 'express';
import { z } from 'zod';
import PDFDocument from 'pdfkit';
import { authRequired, adminOnly } from '../middleware/authRequired';
import { validate } from '../middleware/validate';
import { SubscriptionService } from '../services/subscriptionService';
import { logger } from '../utils/logger';
import { prisma } from '../db';
const subscriptionService = new SubscriptionService();
export const subscriptionsRouter = Router();

function formatMoney(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(value));
}

const subscribeSchema = z.object({ planId: z.string().min(1) }).strict();

// Get all active plans (public endpoint)
subscriptionsRouter.get('/plans', async (req: Request, res: Response) => {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ data: plans });
  } catch (error) {
    logger.error('[subscriptions] Get plans error:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// Get user's current subscription
subscriptionsRouter.get('/my-subscription', authRequired, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const subscription = await subscriptionService.getUserSubscription(userId);
    const isActive = subscription ? subscriptionService.isSubscriptionActive(subscription) : false;

    res.json({ 
      data: subscription,
      isActive,
    });
  } catch (error) {
    logger.error('[subscriptions] Get my subscription error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// Get user's daily usage
subscriptionsRouter.get('/usage', authRequired, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const budget = await prisma.chatDailyBudget.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    // Get user's PRO limit
    const { limit: proLimit } = await subscriptionService.getUserProLimit(userId);

    res.json({
      data: {
        freeUsage: budget?.freeUsage || 0,
        proUsage: budget?.proUsage || 0,
        proLimit,
        isUnlimited: proLimit === 0,
      },
    });
  } catch (error) {
    logger.error('[subscriptions] Get usage error:', error);
    res.status(500).json({ error: 'Failed to fetch usage' });
  }
});

// Get user's invoices
subscriptionsRouter.get('/invoices', authRequired, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const invoices = await prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { subscription: { include: { plan: true } } },
    });
    res.json({ data: invoices });
  } catch (error) {
    logger.error('[subscriptions] Get invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

subscriptionsRouter.get('/invoices/:id/pdf', authRequired, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        subscription: {
          include: { plan: true },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.userId !== userId && userRole !== 'admin' && userRole !== 'supervisor') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="facture-${invoice.invoiceNumber}.pdf"`);
    doc.pipe(res);

    doc.fontSize(22).fillColor('#1E5B37').text('FACTURE KILIMO', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).fillColor('#111111');
    doc.text(`Facture: ${invoice.invoiceNumber}`);
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('fr-FR')}`);
    doc.text(`Statut: ${invoice.status}`);
    doc.moveDown();
    doc.text(`Client: ${invoice.user.fullName || invoice.user.email}`);
    doc.text(`Email: ${invoice.user.email}`);
    doc.moveDown();
    doc.text(`Forfait: ${invoice.subscription.plan.displayName}`);
    doc.text(`Montant: ${formatMoney(Number(invoice.amount))} ${invoice.currency}`);
    doc.text(`Échéance: ${new Date(invoice.dueDate).toLocaleDateString('fr-FR')}`);
    if (invoice.paidAt) {
      doc.text(`Payée le: ${new Date(invoice.paidAt).toLocaleDateString('fr-FR')}`);
    }
    doc.moveDown(2);
    doc.fontSize(10).fillColor('#6b7280').text('Merci pour votre confiance.', { align: 'center' });
    doc.end();
  } catch (error) {
    logger.error('[subscriptions] Invoice PDF error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate invoice PDF' });
    }
  }
});

// Create a technical order to reuse the existing payment module
subscriptionsRouter.post('/checkout', authRequired, validate(subscribeSchema), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { planId } = req.body;
    const order = await subscriptionService.createCheckoutOrder(userId, planId);
    res.status(201).json({ data: order });
  } catch (error) {
    logger.error('[subscriptions] Checkout error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create checkout';
    res.status(400).json({ error: message });
  }
});

// Subscribe to a free or trial plan
subscriptionsRouter.post('/subscribe', authRequired, validate(subscribeSchema), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { planId } = req.body;
    const [plan, user] = await Promise.all([
      prisma.plan.findFirst({ where: { id: planId, isActive: true } }),
      prisma.user.findUnique({ where: { id: userId }, select: { hasUsedTrial: true } }),
    ]);

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Un plan payant ne peut être activé sans paiement que via un essai — et
    // uniquement le premier (cf. hasUsedTrial dans subscriptionService).
    const trialAvailable = plan.trialDays > 0 && !user?.hasUsedTrial;
    if (Number(plan.price) > 0 && !trialAvailable) {
      return res.status(400).json({
        error: 'payment_required',
        message: 'Ce forfait nécessite un paiement préalable.',
      });
    }

    const subscription = await subscriptionService.createSubscription(userId, planId);
    
    // If plan is paid (price > 0) and not a trial, initiate payment
    if (Number(subscription.plan.price) > 0 && !subscription.isTrial) {
      // TODO: Integrate with Money Fusion payment system (similar to orders)
      // For now, we'll just create the subscription and invoice
      logger.info(`[subscriptions] Created paid subscription for user: ${userId}, plan: ${subscription.plan.name}`);
    } else {
      logger.info(`[subscriptions] Created free/trial subscription for user: ${userId}, plan: ${subscription.plan.name}`);
    }

    res.status(201).json({ data: subscription });
  } catch (error) {
    logger.error('[subscriptions] Subscribe error:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// Cancel subscription
subscriptionsRouter.post('/cancel', authRequired, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const subscription = await subscriptionService.cancelSubscription(userId);

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json({ data: subscription });
  } catch (error) {
    logger.error('[subscriptions] Cancel error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Admin: Get all plans (including inactive)
subscriptionsRouter.get('/admin/plans', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ data: plans });
  } catch (error) {
    logger.error('[subscriptions] Admin get plans error:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// Admin: Create a plan
const createPlanSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  currency: z.string().default('XOF'),
  dailyProMessageLimit: z.number().min(0),
  hasCustomDocuments: z.boolean().default(false),
  hasPrioritySupport: z.boolean().default(false),
  hasApiAccess: z.boolean().default(false),
  maxCustomDocuments: z.number().min(0).default(0),
  trialDays: z.number().min(0).default(0),
  sortOrder: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
}).strict();
subscriptionsRouter.post('/admin/plans', authRequired, adminOnly, validate(createPlanSchema), async (req: Request, res: Response) => {
  try {
    const plan = await prisma.plan.create({
      data: req.body,
    });
    res.status(201).json({ data: plan });
  } catch (error) {
    logger.error('[subscriptions] Create plan error:', error);
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

// Admin: Update a plan
const updatePlanSchema = createPlanSchema.partial();
subscriptionsRouter.put('/admin/plans/:id', authRequired, adminOnly, validate(updatePlanSchema), async (req: Request, res: Response) => {
  try {
    const plan = await prisma.plan.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ data: plan });
  } catch (error) {
    logger.error('[subscriptions] Update plan error:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// Admin: Delete (deactivate) a plan
subscriptionsRouter.delete('/admin/plans/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const plan = await prisma.plan.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ data: plan });
  } catch (error) {
    logger.error('[subscriptions] Deactivate plan error:', error);
    res.status(500).json({ error: 'Failed to deactivate plan' });
  }
});

// Admin: Get all subscriptions
subscriptionsRouter.get('/admin/subscriptions', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      include: { user: true, plan: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: subscriptions });
  } catch (error) {
    logger.error('[subscriptions] Admin get subscriptions error:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Admin: Get subscription analytics
subscriptionsRouter.get('/admin/analytics', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const days = Number(req.query.days || 30);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const analytics = await prisma.subscriptionAnalytics.findMany({
      where: { date: { gte: startDate } },
      orderBy: { date: 'asc' },
    });

    // Get current stats
    const totalSubscribers = await prisma.subscription.count({
      where: { status: 'active' },
    });

    const totalRevenue = await prisma.invoice.aggregate({
      where: { status: 'paid' },
      _sum: { amount: true },
    });

    res.json({
      data: analytics,
      summary: {
        totalSubscribers,
        totalRevenue: totalRevenue._sum.amount?.toNumber() || 0,
      },
    });
  } catch (error) {
    logger.error('[subscriptions] Admin get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});
