-- Empêche la réinitialisation infinie de l'essai gratuit (annuler puis
-- se réabonner rendait un nouvel essai à chaque fois).
ALTER TABLE "User" ADD COLUMN "hasUsedTrial" BOOLEAN NOT NULL DEFAULT false;
