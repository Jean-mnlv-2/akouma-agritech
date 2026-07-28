-- Montant de cashback appliqué en réduction sur cette commande, et code promo
-- affilié dont le solde a été débité. Nécessaire pour intégrer le débit de
-- cashback de façon atomique à la création de commande (auparavant débité
-- séparément, avant la commande, sans jamais être déduit du total réellement
-- payé via Money Fusion) et pour pouvoir rembourser le solde si la commande
-- est annulée/expire impayée.
ALTER TABLE "Order" ADD COLUMN "cashbackUsed" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "cashbackPromoCodeId" INTEGER;
ALTER TABLE "Order" ADD CONSTRAINT "Order_cashbackPromoCodeId_fkey" FOREIGN KEY ("cashbackPromoCodeId") REFERENCES "PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
