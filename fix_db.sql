ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryStatus" TEXT DEFAULT 'pending';
CREATE UNIQUE INDEX IF NOT EXISTS "Order_deliveryId_key" ON "Order"("deliveryId");
