DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DeliveryMethod') THEN
        CREATE TYPE "DeliveryMethod" AS ENUM ('PICKUP', 'DELIVERY');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "DeliveryPartner" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "baseRate" DECIMAL(12,2),
    "estimatedDelay" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "DeliveryPartner_isActive_idx" ON "DeliveryPartner"("isActive");
CREATE INDEX IF NOT EXISTS "DeliveryPartner_createdAt_idx" ON "DeliveryPartner"("createdAt");

ALTER TABLE "Order"
    ADD COLUMN IF NOT EXISTS "deliveryMethod" "DeliveryMethod" NOT NULL DEFAULT 'PICKUP',
    ADD COLUMN IF NOT EXISTS "deliveryPartnerId" INTEGER;

ALTER TABLE "Order"
    ALTER COLUMN "deliveryMethod" SET DEFAULT 'PICKUP';

UPDATE "Order" SET "deliveryMethod" = 'PICKUP' WHERE "deliveryMethod" IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'Order_deliveryPartnerId_fkey'
          AND conrelid = 'Order'::regclass
    ) THEN
        ALTER TABLE "Order"
            ADD CONSTRAINT "Order_deliveryPartnerId_fkey"
            FOREIGN KEY ("deliveryPartnerId")
            REFERENCES "DeliveryPartner"("id")
            ON UPDATE CASCADE
            ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Order_deliveryPartnerId_idx" ON "Order"("deliveryPartnerId");

DROP TRIGGER IF EXISTS "DeliveryPartner_updatedAt" ON "DeliveryPartner";
DO $$
BEGIN
    CREATE OR REPLACE FUNCTION set_delivery_partner_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW."updatedAt" = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER "DeliveryPartner_updatedAt"
    BEFORE UPDATE ON "DeliveryPartner"
    FOR EACH ROW EXECUTE FUNCTION set_delivery_partner_updated_at();
END $$;

