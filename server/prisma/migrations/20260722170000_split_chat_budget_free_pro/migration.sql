-- Split chat usage into free and pro buckets.
-- Existing usage is preserved as free usage for backward compatibility.

ALTER TABLE "ChatDailyBudget"
ADD COLUMN "freeUsage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "proUsage" INTEGER NOT NULL DEFAULT 0;

UPDATE "ChatDailyBudget"
SET "freeUsage" = COALESCE("usage", 0)
WHERE "usage" IS NOT NULL;

ALTER TABLE "ChatDailyBudget"
DROP COLUMN "usage";
