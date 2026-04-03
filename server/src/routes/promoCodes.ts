import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';

const prisma = new PrismaClient();
const prismaAny = prisma as any;
type DiscountType = 'PERCENTAGE' | 'FIXED';
export const promoCodesRouter = Router();

function validateDiscount(type: DiscountType, value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('La valeur de réduction doit être positive');
  }
  if (type === 'PERCENTAGE' && value > 100) {
    throw new Error('Le pourcentage de réduction ne peut pas dépasser 100%');
  }
}

promoCodesRouter.get('/', authRequired, adminOnly, async (_req: Request, res: Response) => {
  try {
    const codes = await prismaAny.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: codes });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request';
    res.status(400).json({ error: message });
  }
});

promoCodesRouter.post('/', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const {
      code,
      description,
      discountType = 'PERCENTAGE',
      discountValue,
      maxUses,
      validFrom,
      validUntil,
      isActive = true,
      ownerEmail,
      ownerName,
      cashbackPercent,
    } = req.body || {};

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Le code est obligatoire' });
    }
    const type: DiscountType = discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE';
    const value = Number(discountValue);
    validateDiscount(type, value);

    const created = await prismaAny.promoCode.create({
      data: {
        code: code.toUpperCase().trim(),
        description: description ? String(description) : null,
        discountType: type,
        discountValue: value,
        maxUses: maxUses != null ? Number(maxUses) : null,
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        isActive: Boolean(isActive),
        ownerEmail: ownerEmail ? String(ownerEmail).trim() : null,
        ownerName: ownerName ? String(ownerName).trim() : null,
        cashbackPercent: cashbackPercent != null ? Number(cashbackPercent) : 0,
      },
    });

    res.status(201).json({ data: created });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request';
    res.status(400).json({ error: message });
  }
});

promoCodesRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Identifiant invalide' });
    }

    const {
      code,
      description,
      discountType,
      discountValue,
      maxUses,
      validFrom,
      validUntil,
      isActive,
      ownerEmail,
      ownerName,
      cashbackPercent,
    } = req.body || {};

    const data: any = {};
    if (code) data.code = String(code).toUpperCase().trim();
    if (description !== undefined) data.description = description ? String(description) : null;
    if (discountType) {
      const type: DiscountType = discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE';
      const value = Number(discountValue ?? 0);
      validateDiscount(type, value);
      data.discountType = type;
      data.discountValue = value;
    } else if (discountValue != null) {
      const existing = await prismaAny.promoCode.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: 'Code promo introuvable' });
      validateDiscount(existing.discountType as DiscountType, Number(discountValue));
      data.discountValue = Number(discountValue);
    }
    if (maxUses !== undefined) data.maxUses = maxUses != null ? Number(maxUses) : null;
    if (validFrom !== undefined) data.validFrom = validFrom ? new Date(validFrom) : null;
    if (validUntil !== undefined) data.validUntil = validUntil ? new Date(validUntil) : null;
    if (isActive !== undefined) data.isActive = Boolean(isActive);
    if (ownerEmail !== undefined) data.ownerEmail = ownerEmail ? String(ownerEmail).trim() : null;
    if (ownerName !== undefined) data.ownerName = ownerName ? String(ownerName).trim() : null;
    if (cashbackPercent !== undefined) data.cashbackPercent = Number(cashbackPercent) || 0;

    const updated = await prismaAny.promoCode.update({
      where: { id },
      data,
    });

    res.json({ data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request';
    res.status(400).json({ error: message });
  }
});

promoCodesRouter.patch('/:id/toggle', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Identifiant invalide' });
    }

    const promo = await prismaAny.promoCode.update({
      where: { id },
      data: {
        isActive: Boolean(req.body?.isActive),
      },
    });

    res.json({ data: promo });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request';
    res.status(400).json({ error: message });
  }
});

promoCodesRouter.post('/validate', async (req: Request, res: Response) => {
  try {
    const { code, subtotal } = req.body || {};
    const numericSubtotal = Number(subtotal);
    if (!code || !Number.isFinite(numericSubtotal) || numericSubtotal <= 0) {
      return res.status(400).json({ error: 'Code et sous-total requis' });
    }

    const now = new Date();
    const promo = await prismaAny.promoCode.findFirst({
      where: {
        code: String(code).toUpperCase().trim(),
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
      return res.status(404).json({ error: 'Code promo invalide ou expiré' });
    }

    if (promo.maxUses != null && promo.usesCount >= promo.maxUses) {
      return res.status(403).json({ error: 'Ce code promo a atteint le nombre maximal d’utilisations' });
    }

    const discountAmount = calculateDiscountAmount(numericSubtotal, {
      discountType: promo.discountType as DiscountType,
      discountValue: promo.discountValue,
    });

    if (discountAmount <= 0) {
      return res.status(400).json({ error: 'Ce code promo ne peut pas être appliqué' });
    }

    res.json({
      data: {
        code: promo.code,
        description: promo.description,
        discountType: promo.discountType,
        discountValue: Number(promo.discountValue),
        discountAmount,
        maxUses: promo.maxUses,
        usesCount: promo.usesCount,
        validFrom: promo.validFrom,
        validUntil: promo.validUntil,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request';
    res.status(400).json({ error: message });
  }
});

function calculateDiscountAmount(subtotal: number, promo: { discountType: DiscountType; discountValue: number }) {
  const value = Number(promo.discountValue);
  if (!Number.isFinite(value) || subtotal <= 0) return 0;
  if (promo.discountType === 'PERCENTAGE') {
    const rate = Math.min(Math.max(value, 0), 100);
    return Math.min(subtotal, (subtotal * rate) / 100);
  }
  return Math.min(subtotal, Math.max(value, 0));
}
