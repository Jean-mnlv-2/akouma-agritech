-- Add affiliate fields to PromoCode
ALTER TABLE "PromoCode" ADD COLUMN "ownerEmail" TEXT;
ALTER TABLE "PromoCode" ADD COLUMN "ownerName" TEXT;
ALTER TABLE "PromoCode" ADD COLUMN "cashbackPercent" DECIMAL(5,2) DEFAULT 0;
ALTER TABLE "PromoCode" ADD COLUMN "cashbackBalance" DECIMAL(12,2) DEFAULT 0;
ALTER TABLE "PromoCode" ADD COLUMN "totalCashbackEarned" DECIMAL(12,2) DEFAULT 0;
