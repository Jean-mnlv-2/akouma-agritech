-- Migration manuelle pour ajouter les codes promotionnels et l'historique des commandes
-- À exécuter dans la base PostgreSQL du projet après la création des tables Order / OrderItem

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PromoDiscountType') THEN
        CREATE TYPE "PromoDiscountType" AS ENUM ('PERCENTAGE', 'FIXED');
    END IF;
END $$;

-- Table des codes promotionnels
CREATE TABLE IF NOT EXISTS "PromoCode" (
    "id" SERIAL PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "discountType" "PromoDiscountType" NOT NULL DEFAULT 'PERCENTAGE',
    "discountValue" DECIMAL(12,2) NOT NULL,
    "maxUses" INTEGER,
    "usesCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "validFrom" TIMESTAMP,
    "validUntil" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "PromoCode_isActive_idx" ON "PromoCode"("isActive");
CREATE INDEX IF NOT EXISTS "PromoCode_code_idx" ON "PromoCode"("code");
CREATE INDEX IF NOT EXISTS "PromoCode_validFrom_idx" ON "PromoCode"("validFrom");
CREATE INDEX IF NOT EXISTS "PromoCode_validUntil_idx" ON "PromoCode"("validUntil");

-- Ajout de la colonne promoCodeId sur Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "promoCodeId" INTEGER REFERENCES "PromoCode"("id") ON UPDATE CASCADE ON DELETE SET NULL;

-- Mise à jour du champ updatedAt via trigger pour PromoCode
DROP TRIGGER IF EXISTS "PromoCode_updatedAt" ON "PromoCode";
DO $$
BEGIN
    CREATE OR REPLACE FUNCTION set_promocode_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW."updatedAt" = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER "PromoCode_updatedAt"
    BEFORE UPDATE ON "PromoCode"
    FOR EACH ROW EXECUTE FUNCTION set_promocode_updated_at();
END $$;

-- Table des événements de commande
CREATE TABLE IF NOT EXISTS "OrderEvent" (
    "id" SERIAL PRIMARY KEY,
    "orderId" INTEGER NOT NULL REFERENCES "Order"("id") ON UPDATE CASCADE ON DELETE CASCADE,
    "type" TEXT NOT NULL,
    "status" TEXT,
    "paymentStatus" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "OrderEvent_orderId_idx" ON "OrderEvent"("orderId");
CREATE INDEX IF NOT EXISTS "OrderEvent_createdAt_idx" ON "OrderEvent"("createdAt");

