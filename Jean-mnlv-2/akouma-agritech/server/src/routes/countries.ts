import { Router, Request, Response } from 'express';
import { authRequired, adminOnly } from '../middleware/authRequired';
import { prisma } from '../lib/prisma';

export const countriesRouter = Router();

countriesRouter.get('/', async (req: Request, res: Response) => {
  const countries = await prisma.country.findMany({ orderBy: { name: 'asc' } });
  res.json({ data: countries });
});

countriesRouter.post('/', authRequired, adminOnly, async (req: Request, res: Response) => {
  const { name, code, phoneCode } = req.body || {};
  if (!name || !code || !phoneCode) return res.status(400).json({ error: 'missing fields' });
  const created = await prisma.country.create({ data: { name, code, phoneCode } });
  res.status(201).json({ data: created });
});


