-- AlterTable
ALTER TABLE "DeliveryPartner" ADD COLUMN "code" TEXT NOT NULL DEFAULT 'manual';

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryPartner_code_key" ON "DeliveryPartner"("code");
