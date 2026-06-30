-- Add missing columns to News
ALTER TABLE "News" ADD COLUMN "category" TEXT DEFAULT 'Général';
ALTER TABLE "News" ADD COLUMN "isFeatured" BOOLEAN DEFAULT false;
ALTER TABLE "News" ADD COLUMN "isCopyProtected" BOOLEAN DEFAULT false;

-- Add missing columns to ShopProduct
ALTER TABLE "ShopProduct" ADD COLUMN "isNew" BOOLEAN DEFAULT false;
ALTER TABLE "ShopProduct" ADD COLUMN "gallery" TEXT[] DEFAULT '{}';
ALTER TABLE "ShopProduct" ADD COLUMN "features" TEXT[] DEFAULT '{}';
ALTER TABLE "ShopProduct" ADD COLUMN "specifications" JSONB DEFAULT '{}';

-- Add missing columns to Seed
ALTER TABLE "Seed" ADD COLUMN "availability" TEXT DEFAULT 'En stock';
ALTER TABLE "Seed" ADD COLUMN "careInstructions" TEXT;
ALTER TABLE "Seed" ADD COLUMN "diseases" TEXT[] DEFAULT '{}';
ALTER TABLE "Seed" ADD COLUMN "features" TEXT[] DEFAULT '{}';
ALTER TABLE "Seed" ADD COLUMN "fertilizer" TEXT;
ALTER TABLE "Seed" ADD COLUMN "fullDescription" TEXT;
ALTER TABLE "Seed" ADD COLUMN "germination" TEXT;
ALTER TABLE "Seed" ADD COLUMN "harvestTime" TEXT;
ALTER TABLE "Seed" ADD COLUMN "moisture" TEXT;
ALTER TABLE "Seed" ADD COLUMN "origin" TEXT;
ALTER TABLE "Seed" ADD COLUMN "packaging" TEXT;
ALTER TABLE "Seed" ADD COLUMN "plantingDepth" TEXT;
ALTER TABLE "Seed" ADD COLUMN "plantingInstructions" TEXT;
ALTER TABLE "Seed" ADD COLUMN "purity" TEXT;
ALTER TABLE "Seed" ADD COLUMN "soilType" TEXT;
ALTER TABLE "Seed" ADD COLUMN "spacing" TEXT;
ALTER TABLE "Seed" ADD COLUMN "totalReviews" INTEGER DEFAULT 0;
ALTER TABLE "Seed" ADD COLUMN "unit" TEXT DEFAULT 'kg';
ALTER TABLE "Seed" ADD COLUMN "variety" TEXT;
ALTER TABLE "Seed" ADD COLUMN "watering" TEXT;
ALTER TABLE "Seed" ADD COLUMN "yield" TEXT;
ALTER TABLE "Seed" ADD COLUMN "isFeatured" BOOLEAN DEFAULT false;
ALTER TABLE "Seed" ADD COLUMN "isCopyProtected" BOOLEAN DEFAULT false;
ALTER TABLE "Seed" ADD COLUMN "gallery" TEXT[] DEFAULT '{}';
