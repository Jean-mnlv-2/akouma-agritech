-- AlterTable Career
ALTER TABLE "public"."Career" ADD COLUMN "slug" TEXT;
UPDATE "public"."Career" SET "slug" = 'career-' || id;
ALTER TABLE "public"."Career" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Career_slug_key" ON "public"."Career"("slug");

-- AlterTable Course
ALTER TABLE "public"."Course" ADD COLUMN "slug" TEXT;
UPDATE "public"."Course" SET "slug" = 'course-' || id;
ALTER TABLE "public"."Course" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Course_slug_key" ON "public"."Course"("slug");

-- AlterTable DonationImpact
ALTER TABLE "public"."DonationImpact" ADD COLUMN "slug" TEXT;
UPDATE "public"."DonationImpact" SET "slug" = 'impact-' || id;
ALTER TABLE "public"."DonationImpact" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "DonationImpact_slug_key" ON "public"."DonationImpact"("slug");

-- AlterTable Event
ALTER TABLE "public"."Event" ADD COLUMN "slug" TEXT;
UPDATE "public"."Event" SET "slug" = 'event-' || id;
ALTER TABLE "public"."Event" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Event_slug_key" ON "public"."Event"("slug");

-- AlterTable LiveStream
ALTER TABLE "public"."LiveStream" ADD COLUMN "slug" TEXT;
UPDATE "public"."LiveStream" SET "slug" = 'live-' || id;
ALTER TABLE "public"."LiveStream" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "LiveStream_slug_key" ON "public"."LiveStream"("slug");

-- AlterTable News
ALTER TABLE "public"."News" ADD COLUMN "slug" TEXT;
UPDATE "public"."News" SET "slug" = 'news-' || id;
ALTER TABLE "public"."News" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "News_slug_key" ON "public"."News"("slug");

-- AlterTable Partner
ALTER TABLE "public"."Partner" ADD COLUMN "slug" TEXT;
UPDATE "public"."Partner" SET "slug" = 'partner-' || id;
ALTER TABLE "public"."Partner" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Partner_slug_key" ON "public"."Partner"("slug");

-- AlterTable Seed
ALTER TABLE "public"."Seed" ADD COLUMN "slug" TEXT;
UPDATE "public"."Seed" SET "slug" = 'seed-' || id;
ALTER TABLE "public"."Seed" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Seed_slug_key" ON "public"."Seed"("slug");

-- AlterTable ShopProduct
ALTER TABLE "public"."ShopProduct" ADD COLUMN "slug" TEXT;
UPDATE "public"."ShopProduct" SET "slug" = 'product-' || id;
ALTER TABLE "public"."ShopProduct" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "ShopProduct_slug_key" ON "public"."ShopProduct"("slug");

-- AlterTable SuccessStory
ALTER TABLE "public"."SuccessStory" ADD COLUMN "slug" TEXT;
UPDATE "public"."SuccessStory" SET "slug" = 'story-' || id;
ALTER TABLE "public"."SuccessStory" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "SuccessStory_slug_key" ON "public"."SuccessStory"("slug");
