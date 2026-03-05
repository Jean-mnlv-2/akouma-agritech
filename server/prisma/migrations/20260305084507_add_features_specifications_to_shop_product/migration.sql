-- AlterTable
ALTER TABLE "ShopProduct" ADD COLUMN     "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "specifications" JSONB NOT NULL DEFAULT '{}';
