-- Champs renseignés uniquement pour un item productType="course", reportés
-- sur l'ELearningEnrollment créée automatiquement après paiement.
ALTER TABLE "Order" ADD COLUMN "professionalActivity" TEXT;
ALTER TABLE "Order" ADD COLUMN "organization" TEXT;
ALTER TABLE "Order" ADD COLUMN "sector" TEXT;
ALTER TABLE "Order" ADD COLUMN "experienceLevel" TEXT;
ALTER TABLE "Order" ADD COLUMN "expectations" TEXT;
