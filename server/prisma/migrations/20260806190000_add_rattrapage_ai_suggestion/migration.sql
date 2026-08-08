-- Brouillon de résolution proposé par DeerFlow pour une demande de
-- rattrapage — jamais appliqué seul, uniquement une suggestion que l'admin
-- peut reprendre en un clic ou ignorer.
ALTER TABLE "RattrapageRequest" ADD COLUMN "suggestedResolution" TEXT;
ALTER TABLE "RattrapageRequest" ADD COLUMN "suggestedByAi" BOOLEAN NOT NULL DEFAULT false;
