-- AlterTable
ALTER TABLE "public"."Seed" ADD COLUMN     "availability" TEXT DEFAULT 'En stock',
ADD COLUMN     "careInstructions" TEXT,
ADD COLUMN     "category" TEXT DEFAULT 'Général',
ADD COLUMN     "diseases" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "fertilizer" TEXT,
ADD COLUMN     "fullDescription" TEXT,
ADD COLUMN     "germination" TEXT,
ADD COLUMN     "harvestTime" TEXT,
ADD COLUMN     "moisture" TEXT,
ADD COLUMN     "origin" TEXT,
ADD COLUMN     "packaging" TEXT,
ADD COLUMN     "plantingDepth" TEXT,
ADD COLUMN     "plantingInstructions" TEXT,
ADD COLUMN     "purity" TEXT,
ADD COLUMN     "rating" DECIMAL(2,1) NOT NULL DEFAULT 0,
ADD COLUMN     "soilType" TEXT,
ADD COLUMN     "spacing" TEXT,
ADD COLUMN     "totalReviews" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unit" TEXT DEFAULT 'kg',
ADD COLUMN     "variety" TEXT,
ADD COLUMN     "watering" TEXT,
ADD COLUMN     "yield" TEXT;

-- CreateTable
CREATE TABLE "public"."Review" (
    "id" SERIAL NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "userId" TEXT NOT NULL,
    "seedId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_seedId_key" ON "public"."Review"("userId", "seedId");

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_seedId_fkey" FOREIGN KEY ("seedId") REFERENCES "public"."Seed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
