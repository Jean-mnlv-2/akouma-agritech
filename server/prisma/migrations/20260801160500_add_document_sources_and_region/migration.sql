-- Citations vérifiables + portée géographique pour les Documents RAG et
-- Produits phytosanitaires, en particulier pour les brouillons DeerFlow.
ALTER TABLE "Document" ADD COLUMN "sources" JSONB;
ALTER TABLE "Document" ADD COLUMN "region" TEXT;
ALTER TABLE "PhytosanitaryProduct" ADD COLUMN "sources" JSONB;
ALTER TABLE "PhytosanitaryProduct" ADD COLUMN "region" TEXT;

-- Registre admin des centres de recherche/institutions de confiance.
CREATE TABLE "TrustedSource" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "description" TEXT,
    "region" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrustedSource_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TrustedSource_isActive_idx" ON "TrustedSource"("isActive");
