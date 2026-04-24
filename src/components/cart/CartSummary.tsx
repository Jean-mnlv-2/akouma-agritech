import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCartContext } from "@/context/CartContext";
import { computeShippingFee } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/integrations/api/client";
import { CreditCard, Tag, Truck, Shield, ArrowRight, X } from "lucide-react";

const calculateDiscount = (subtotal: number, promo: { discountType: 'PERCENTAGE' | 'FIXED'; discountValue: number }) => {
  if (subtotal <= 0) return 0;
  const value = Number(promo.discountValue);
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (promo.discountType === 'PERCENTAGE') {
    const rate = Math.min(Math.max(value, 0), 100);
    return Math.min(subtotal, (subtotal * rate) / 100);
  }
  return Math.min(subtotal, value);
};

export const CartSummary = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    items,
    getCartTotal,
    getCartItemsCount,
    appliedPromo,
    applyPromo,
    clearPromo,
    deliveryMethod,
    deliveryPartner,
  } = useCartContext();

  const [promoCode, setPromoCode] = useState(appliedPromo?.code ?? "");
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    setPromoCode(appliedPromo?.code ?? "");
  }, [appliedPromo]);

  useEffect(() => {
    if (items.length === 0 && appliedPromo) {
      clearPromo();
    }
  }, [items.length, appliedPromo, clearPromo]);

  const subtotal = getCartTotal();
  const discount = useMemo(() => (appliedPromo ? calculateDiscount(subtotal, appliedPromo) : 0), [appliedPromo, subtotal]);
  const shipping = computeShippingFee(subtotal, deliveryMethod, deliveryPartner);
  const total = Math.max(0, subtotal - discount + shipping);
  const itemsCount = getCartItemsCount();

  const formatPrice = (price: number) => new Intl.NumberFormat('fr-FR').format(Math.max(0, Math.round(price)));

  const handlePromoCode = async () => {
    if (!promoCode) return;
    setIsApplying(true);
    try {
      const { data } = await api.promoCodes.validate(promoCode, subtotal);
      applyPromo({
        code: data.code,
        discountType: data.discountType,
        discountValue: Number(data.discountValue),
        description: data.description,
      });
      toast({
        title: "Code promo appliqué !",
        description: data.description ? data.description : `Réduction de ${data.discountType === 'PERCENTAGE' ? `${data.discountValue}%` : `${formatPrice(data.discountValue)} FCFA`}`,
      });
    } catch (error: unknown) {
      const err = error as { message?: string; error?: string };
      const message = err.message || err.error || "Code promo invalide";
      clearPromo();
      toast({
        title: "Code promo invalide",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemovePromo = () => {
    clearPromo();
    setPromoCode("");
    toast({ title: "Code retiré", description: "La réduction a été supprimée" });
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="w-5 h-5" />
          <span>Résumé de commande</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">
            {itemsCount} article{itemsCount > 1 ? 's' : ''}
          </span>
          <span>{formatPrice(subtotal)} FCFA</span>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Truck className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Livraison</span>
          </div>
          <div className="text-right">
            {deliveryMethod === 'PICKUP' ? (
              <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-2 py-0.5 text-[10px] font-bold uppercase">
                Gratuite
              </Badge>
            ) : (
              shipping > 0 ? (
                <span className="font-bold text-primary text-sm">{formatPrice(shipping)} FCFA</span>
              ) : (
                <span className="text-[10px] font-bold text-orange-600 uppercase tracking-tight bg-orange-50 px-2 py-1 rounded">
                  À calculer selon l'adresse
                </span>
              )
            )}
          </div>
        </div>

        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg space-y-1">
          <div className="font-medium text-foreground">
            {deliveryMethod === 'DELIVERY' ? 'Livraison à domicile' : 'Retrait sur place'}
          </div>
          {deliveryMethod === 'DELIVERY' ? (
            <div>
              <div>
                {deliveryPartner
                  ? `Partenaire sélectionné : ${deliveryPartner.name}`
                  : "Sélection du partenaire à finaliser lors du paiement."}
              </div>
              {deliveryPartner?.estimatedDelay && (
                <div>Délai estimé : {deliveryPartner.estimatedDelay}</div>
              )}
            </div>
          ) : (
            <div>Collecte gratuite à notre point de retrait.</div>
          )}
        </div>

        {deliveryMethod === 'DELIVERY' && shipping > 0 && deliveryPartner?.baseRate == null && (
          <div className="bg-muted/50 p-3 rounded-lg text-sm">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Truck className="w-4 h-4" />
              <span>
                Frais de livraison estimés par notre partenaire
              </span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex space-x-2">
            <Input
              placeholder="Code promo"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              disabled={isApplying || Boolean(appliedPromo)}
            />
            {appliedPromo ? (
              <Button variant="ghost" onClick={handleRemovePromo} title="Supprimer le code">
                <X className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handlePromoCode}
                disabled={isApplying || !promoCode}
              >
                {isApplying ? (
                  <span className="text-xs">...</span>
                ) : (
                  <Tag className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
          {appliedPromo && (
            <div className="flex items-center justify-between text-green-600 text-sm">
              <span>
                Code {appliedPromo.code}
                {appliedPromo.description ? ` — ${appliedPromo.description}` : ''}
              </span>
              <span>-{formatPrice(discount)} FCFA</span>
            </div>
          )}
        </div>

        {discount > 0 && (
          <div className="flex justify-between items-center text-green-600">
            <span>Réduction</span>
            <span>-{formatPrice(discount)} FCFA</span>
          </div>
        )}

        <div className="border-t pt-4">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">{formatPrice(total)} FCFA</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <Shield className="w-4 h-4" />
          <span>Paiement 100% sécurisé</span>
        </div>

        <Button 
          onClick={handleCheckout}
          size="lg" 
          className="w-full group"
          variant="nature"
        >
          Procéder au paiement
          <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
        </Button>

        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-2">
            Méthodes de paiement acceptées
          </p>
          <div className="flex justify-center space-x-2">
            <Badge variant="outline">Orange Money</Badge>
            <Badge variant="outline">MTN Money</Badge>
            <Badge variant="outline">Visa</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};