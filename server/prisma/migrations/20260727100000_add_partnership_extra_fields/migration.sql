-- Champs collectés par le formulaire public "Devenir Partenaire" mais
-- jusqu'ici silencieusement ignorés par le backend (schéma incomplet).
ALTER TABLE "Partnership" ADD COLUMN "partnershipType" TEXT;
ALTER TABLE "Partnership" ADD COLUMN "budget" TEXT;
ALTER TABLE "Partnership" ADD COLUMN "timeline" TEXT;
