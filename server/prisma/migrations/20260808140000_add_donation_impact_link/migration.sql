-- Relie les dons à un projet/cause (DonationImpact) et donne à chaque
-- cause un objectif chiffré (targetAmount) pour permettre le calcul
-- automatique du montant collecté / de la progression à partir des dons
-- confirmés, au lieu d'une progression saisie manuellement par l'admin.
ALTER TABLE "DonationImpact" ADD COLUMN "targetAmount" DECIMAL(12,2);

ALTER TABLE "Donation" ADD COLUMN "donationImpactId" INTEGER;

CREATE INDEX "Donation_donationImpactId_idx" ON "Donation"("donationImpactId");

ALTER TABLE "Donation" ADD CONSTRAINT "Donation_donationImpactId_fkey" FOREIGN KEY ("donationImpactId") REFERENCES "DonationImpact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
