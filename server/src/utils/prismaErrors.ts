import { Response } from 'express';
import { Prisma } from '@prisma/client';

/**
 * Traduit une erreur Prisma en réponse HTTP appropriée (409 conflit de
 * contrainte unique, 404 enregistrement introuvable, 500 sinon) plutôt que de
 * laisser l'exception non interceptée remonter jusqu'au process. En Express 4,
 * une promesse rejetée dans un handler async sans try/catch ne passe PAS par
 * le middleware d'erreur : elle devient une "unhandled rejection" qui peut
 * arrêter tout le serveur (voir `process.on('unhandledRejection', ...)` dans
 * index.ts, qui ne fait que logger — il ne remplace pas un try/catch local).
 */
export function handlePrismaWriteError(e: unknown, res: Response): void {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === 'P2002') {
      res.status(409).json({ error: 'Une entrée avec cette valeur unique (ex: slug) existe déjà' });
      return;
    }
    if (e.code === 'P2025') {
      res.status(404).json({ error: 'Ressource introuvable' });
      return;
    }
  }
  const message = e instanceof Error ? e.message : 'Erreur serveur';
  res.status(500).json({ error: message });
}
