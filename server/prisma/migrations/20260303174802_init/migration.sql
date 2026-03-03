-- AlterTable
ALTER TABLE "public"."contact_settings" ADD COLUMN     "business_hours" TEXT,
ADD COLUMN     "map_url" TEXT,
ADD COLUMN     "support_email" VARCHAR(255);
