
-- Add sourceType field to News
ALTER TABLE "News" ADD COLUMN "sourceType" VARCHAR(50) DEFAULT 'manual';
