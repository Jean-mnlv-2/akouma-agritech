-- Create CashbackTransaction table for tracking history
CREATE TABLE "CashbackTransaction" (
  "id" SERIAL PRIMARY KEY,
  "promoCodeId" INTEGER NOT NULL REFERENCES "PromoCode"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL DEFAULT 'EARN',
  "amount" DECIMAL(12, 2) NOT NULL,
  "description" TEXT,
  "orderId" INTEGER REFERENCES "Order"("id") ON DELETE SET NULL,
  "balanceAfter" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "CashbackTransaction_promoCodeId_idx" ON "CashbackTransaction"("promoCodeId");
CREATE INDEX "CashbackTransaction_createdAt_idx" ON "CashbackTransaction"("createdAt");
