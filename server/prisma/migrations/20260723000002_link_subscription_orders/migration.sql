-- Link paid subscription orders to subscription plans
ALTER TABLE "Order"
ADD COLUMN "subscriptionPlanId" TEXT;

CREATE INDEX "Order_subscriptionPlanId_idx" ON "Order"("subscriptionPlanId");

ALTER TABLE "Order"
ADD CONSTRAINT "Order_subscriptionPlanId_fkey"
FOREIGN KEY ("subscriptionPlanId") REFERENCES "Plan"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
