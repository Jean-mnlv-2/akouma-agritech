-- Cartes admin-manageable de la section "Nos Solutions Innovantes" (page
-- d'accueil), avec un lien optionnel vers une cause de financement
-- (DonationImpact) pour le bouton "Soutenir ce projet".
CREATE TABLE "InnovativeSolution" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "features" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "donationImpactId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InnovativeSolution_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InnovativeSolution_slug_key" ON "InnovativeSolution"("slug");
CREATE INDEX "InnovativeSolution_isActive_idx" ON "InnovativeSolution"("isActive");
CREATE INDEX "InnovativeSolution_order_idx" ON "InnovativeSolution"("order");

ALTER TABLE "InnovativeSolution" ADD CONSTRAINT "InnovativeSolution_donationImpactId_fkey" FOREIGN KEY ("donationImpactId") REFERENCES "DonationImpact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
