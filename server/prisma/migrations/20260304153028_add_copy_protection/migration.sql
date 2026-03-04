-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "isCopyProtected" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "News" ADD COLUMN     "isCopyProtected" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Seed" ADD COLUMN     "isCopyProtected" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ShopProduct" ADD COLUMN     "isCopyProtected" BOOLEAN NOT NULL DEFAULT false;
