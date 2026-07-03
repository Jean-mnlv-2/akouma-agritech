-- Add auto-news fields to News model
ALTER TABLE "News" ADD COLUMN "sourceName" TEXT;
ALTER TABLE "News" ADD COLUMN "sourceUrl" TEXT;
ALTER TABLE "News" ADD COLUMN "scrapedAt" TIMESTAMP(3);
ALTER TABLE "News" ADD COLUMN "keywords" TEXT[] DEFAULT '{}';
ALTER TABLE "News" ADD COLUMN "language" TEXT DEFAULT 'fr';
ALTER TABLE "News" ADD COLUMN "originalId" TEXT;
