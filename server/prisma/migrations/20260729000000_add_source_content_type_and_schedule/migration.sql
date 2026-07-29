-- AlterTable
ALTER TABLE "NewsSource" ADD COLUMN "contentType" TEXT NOT NULL DEFAULT 'news';
ALTER TABLE "NewsSource" ADD COLUMN "scheduleTimes" TEXT[] DEFAULT ARRAY[]::TEXT[];
