import { Router, Request, Response } from 'express';
import { authRequired, moduleAccess } from '../middleware/authRequired';
import { csrfRequired } from '../middleware/csrf';
import { prisma } from '../db';
const prismaAny = prisma as any;
export const deliveryPartnersRouter = Router();

function coerceBooleanInput(value: unknown): boolean | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return null;
}

deliveryPartnersRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const partners = await prismaAny.deliveryPartner.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    res.json({ data: partners });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request';
    res.status(400).json({ error: message });
  }
});

deliveryPartnersRouter.get('/admin', authRequired, moduleAccess('deliveries'), async (_req: Request, res: Response) => {
  try {
    const partners = await prismaAny.deliveryPartner.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: partners });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request';
    res.status(400).json({ error: message });
  }
});

deliveryPartnersRouter.post('/', authRequired, moduleAccess('deliveries'), csrfRequired, async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      contactName,
      phone,
      email,
      website,
      baseRate,
      estimatedDelay,
      isActive,
    } = req.body || {};

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Le nom du partenaire est requis.' });
    }

    const parsedBaseRate = baseRate === '' || baseRate == null ? null : Number(baseRate);
    if (parsedBaseRate != null && !Number.isFinite(parsedBaseRate)) {
      return res.status(400).json({ error: 'Le tarif de base doit être un nombre valide.' });
    }

    const normalizedIsActive = coerceBooleanInput(isActive);

    const partner = await prismaAny.deliveryPartner.create({
      data: {
        name: name.trim(),
        description: description ? String(description).trim() : null,
        contactName: contactName ? String(contactName).trim() : null,
        phone: phone ? String(phone).trim() : null,
        email: email ? String(email).trim() : null,
        website: website ? String(website).trim() : null,
        estimatedDelay: estimatedDelay ? String(estimatedDelay).trim() : null,
        baseRate: parsedBaseRate,
        isActive: normalizedIsActive ?? true,
      },
    });

    res.status(201).json({ data: partner });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request';
    res.status(400).json({ error: message });
  }
});

deliveryPartnersRouter.put('/:id', authRequired, moduleAccess('deliveries'), csrfRequired, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Identifiant invalide' });
    }

    const {
      name,
      description,
      contactName,
      phone,
      email,
      website,
      baseRate,
      estimatedDelay,
      isActive,
    } = req.body || {};

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Le nom du partenaire est requis.' });
    }

    const parsedBaseRate = baseRate === '' || baseRate == null ? null : Number(baseRate);
    if (parsedBaseRate != null && !Number.isFinite(parsedBaseRate)) {
      return res.status(400).json({ error: 'Le tarif de base doit être un nombre valide.' });
    }

    const normalizedIsActive = coerceBooleanInput(isActive);

    const partner = await prismaAny.deliveryPartner.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description ? String(description).trim() : null,
        contactName: contactName ? String(contactName).trim() : null,
        phone: phone ? String(phone).trim() : null,
        email: email ? String(email).trim() : null,
        website: website ? String(website).trim() : null,
        estimatedDelay: estimatedDelay ? String(estimatedDelay).trim() : null,
        baseRate: parsedBaseRate,
        isActive: normalizedIsActive ?? undefined,
      },
    });

    res.json({ data: partner });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request';
    res.status(400).json({ error: message });
  }
});

deliveryPartnersRouter.patch('/:id/toggle', authRequired, moduleAccess('deliveries'), csrfRequired, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Identifiant invalide' });
    }

    const existing = await prismaAny.deliveryPartner.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Partenaire introuvable' });
    }

    const updated = await prismaAny.deliveryPartner.update({
      where: { id },
      data: {
        isActive: !existing.isActive,
      },
    });

    res.json({ data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request';
    res.status(400).json({ error: message });
  }
});

deliveryPartnersRouter.delete('/:id', authRequired, moduleAccess('deliveries'), csrfRequired, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Identifiant invalide' });
    }

    await prismaAny.deliveryPartner.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request';
    res.status(400).json({ error: message });
  }
});

