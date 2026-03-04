-- AlterTable
ALTER TABLE "LegalPage" ADD COLUMN     "effectiveDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "type" TEXT DEFAULT 'legal',
ADD COLUMN     "version" TEXT DEFAULT '1.0';
