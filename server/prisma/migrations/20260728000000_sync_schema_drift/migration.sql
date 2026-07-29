-- Reconciles the migration history with schema.prisma. Several fields were
-- added directly via `prisma db push` over past sessions and never got a
-- migration file, so `prisma migrate deploy` on a fresh database silently
-- diverged from the application code (e.g. Course.category/instructorName
-- used by server/src/routes/courses.ts and internalElearning.ts did not
-- exist in any migration). Generated from
-- `prisma migrate diff --from-url <db> --to-schema-datamodel schema.prisma`
-- and reviewed by hand — two items from that diff were deliberately
-- EXCLUDED:
--   - `DROP INDEX "KnowledgeChunk_embedding_idx"` : false positive, this is
--     the hand-authored pgvector HNSW index (20260721160000_add_rag_knowledge_base)
--     which Prisma's schema representation can't model — dropping it would
--     silently degrade RAG similarity search to a full table scan.
--   - `News` column narrowing (TEXT -> VARCHAR(n)) : risks failing outright
--     on any existing row longer than the new limit, for a purely cosmetic
--     type-annotation match with no functional benefit. Left as TEXT.

-- Course: fields used by both the admin UI (courses.ts) and the new DeerFlow
-- internal API (internalElearning.ts) but missing from any prior migration.
ALTER TABLE "Course" ADD COLUMN "category" TEXT DEFAULT 'Agriculture',
ADD COLUMN "instructorBio" TEXT,
ADD COLUMN "instructorName" TEXT;

-- ELearningEnrollment: registration form fields (already sent by the
-- frontend registration flow) never persisted because the columns didn't
-- exist.
ALTER TABLE "ELearningEnrollment" ADD COLUMN "expectations" TEXT,
ADD COLUMN "experienceLevel" TEXT,
ADD COLUMN "organization" TEXT,
ADD COLUMN "professionalActivity" TEXT,
ADD COLUMN "sector" TEXT;

-- Order: delivery integration fields (AdminDeliveries.tsx / deliveryService.ts).
ALTER TABLE "Order" ADD COLUMN "deliveryId" TEXT,
ADD COLUMN "deliveryStatus" TEXT DEFAULT 'pending',
ADD COLUMN "shippingState" TEXT,
ADD COLUMN "shippingZipCode" TEXT;

CREATE UNIQUE INDEX "Order_deliveryId_key" ON "Order"("deliveryId");
CREATE INDEX "DeliveryPartner_code_idx" ON "DeliveryPartner"("code");

-- PromoCode: schema requires these NOT NULL (all default 0) — backfill any
-- existing NULL before enforcing, so this is safe on a populated database.
UPDATE "PromoCode" SET "cashbackPercent" = 0 WHERE "cashbackPercent" IS NULL;
UPDATE "PromoCode" SET "cashbackBalance" = 0 WHERE "cashbackBalance" IS NULL;
UPDATE "PromoCode" SET "totalCashbackEarned" = 0 WHERE "totalCashbackEarned" IS NULL;
ALTER TABLE "PromoCode" ALTER COLUMN "cashbackPercent" SET NOT NULL,
ALTER COLUMN "cashbackBalance" SET NOT NULL,
ALTER COLUMN "totalCashbackEarned" SET NOT NULL;

-- Document.metadata: schema declares it required (default "{}").
UPDATE "Document" SET "metadata" = '{}' WHERE "metadata" IS NULL;
ALTER TABLE "Document" ALTER COLUMN "metadata" SET NOT NULL;

-- SubscriptionAnalytics.date is always stored at midnight (see
-- subscriptionService.ts updateAnalytics: `today.setHours(0,0,0,0)`),
-- so narrowing TIMESTAMP -> DATE to match schema.prisma is lossless.
ALTER TABLE "SubscriptionAnalytics" ALTER COLUMN "date" SET DATA TYPE DATE;

-- Stale column, not in schema.prisma and unreferenced anywhere in server/src.
ALTER TABLE "User" DROP COLUMN IF EXISTS "tempPassword";

-- Certificate: align hand-authored constraint names with Prisma's default
-- naming (functionally identical constraints, plus add the missing
-- ON UPDATE CASCADE that schema.prisma's implicit relation actions expect).
ALTER TABLE "Certificate" DROP CONSTRAINT IF EXISTS "Certificate_course_fk";
ALTER TABLE "Certificate" DROP CONSTRAINT IF EXISTS "Certificate_user_fk";
ALTER TABLE "Certificate" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER INDEX "Certificate_user_course_unique" RENAME TO "Certificate_userId_courseId_key";

-- CashbackTransaction: add the missing ON UPDATE CASCADE (same relation
-- action drift as Certificate above).
ALTER TABLE "CashbackTransaction" DROP CONSTRAINT IF EXISTS "CashbackTransaction_orderId_fkey";
ALTER TABLE "CashbackTransaction" DROP CONSTRAINT IF EXISTS "CashbackTransaction_promoCodeId_fkey";
ALTER TABLE "CashbackTransaction" ADD CONSTRAINT "CashbackTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CashbackTransaction" ADD CONSTRAINT "CashbackTransaction_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
