import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';

const prisma = new PrismaClient();
export const newsletterSubscriptionsRouter = Router();

newsletterSubscriptionsRouter.get('/', authRequired, adminOnly, async (_req: Request, res: Response) => {
  const items = await prisma.newsletterSubscription.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ data: items });
});

newsletterSubscriptionsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'missing email' });
    
    // Vérifier si l'email existe déjà
    const existing = await prisma.newsletterSubscription.findUnique({ where: { email } });
    if (existing) {
      // Si l'email existe déjà, le réactiver s'il était désactivé
      if (!existing.isActive) {
        const updated = await prisma.newsletterSubscription.update({
          where: { email },
          data: { isActive: true }
        });
        return res.status(200).json({ data: updated, message: 'Email réactivé' });
      }
      // Sinon, retourner l'enregistrement existant
      return res.status(200).json({ data: existing, message: 'Déjà inscrit' });
    }
    
    // Créer un nouvel enregistrement
    const created = await prisma.newsletterSubscription.create({ data: { email, isActive: true } });
    res.status(201).json({ data: created });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});









