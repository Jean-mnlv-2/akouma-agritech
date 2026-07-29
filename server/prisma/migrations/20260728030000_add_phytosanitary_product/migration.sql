-- CreateTable
CREATE TABLE "PhytosanitaryProduct" (
    "id" TEXT NOT NULL,
    "activeIngredient" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "targetCrops" TEXT[],
    "targetPests" TEXT[],
    "description" TEXT NOT NULL,
    "dosage" TEXT,
    "applicationMethod" TEXT,
    "preHarvestInterval" TEXT,
    "safetyPrecautions" TEXT,
    "regulatoryStatus" TEXT NOT NULL DEFAULT 'homologué',
    "commercialName" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'standard',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isIndexed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhytosanitaryProduct_pkey" PRIMARY KEY ("id")
);
