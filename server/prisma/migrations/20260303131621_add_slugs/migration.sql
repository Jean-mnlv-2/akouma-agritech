/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Career` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Course` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `DonationImpact` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Event` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `LiveStream` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `News` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Partner` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Seed` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `ShopProduct` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `SuccessStory` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Career` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `DonationImpact` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `LiveStream` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `News` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Partner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Seed` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `ShopProduct` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `SuccessStory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Career" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Course" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."DonationImpact" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Event" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."LiveStream" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."News" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Partner" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Seed" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."ShopProduct" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."SuccessStory" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Career_slug_key" ON "public"."Career"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "public"."Course"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "DonationImpact_slug_key" ON "public"."DonationImpact"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "public"."Event"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "LiveStream_slug_key" ON "public"."LiveStream"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "News_slug_key" ON "public"."News"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_slug_key" ON "public"."Partner"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Seed_slug_key" ON "public"."Seed"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ShopProduct_slug_key" ON "public"."ShopProduct"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SuccessStory_slug_key" ON "public"."SuccessStory"("slug");
