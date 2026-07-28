import { PrismaClient } from '@prisma/client';
import { env } from './utils/env';

/**
 * Client Prisma unique partagé par tout le processus.
 * Une instance par fichier épuise le pool de connexions PostgreSQL sous charge
 * (chaque `new PrismaClient()` ouvre son propre pool) : ne jamais instancier
 * PrismaClient ailleurs que dans ce fichier.
 */
export const prisma = new PrismaClient({
  log: env.isDevelopment() ? ['warn', 'error'] : ['error'],
});
