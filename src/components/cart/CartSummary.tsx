import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCartContext } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Tag, Truck, Shield, ArrowRight } from "lucide-react";

export const CartSummary = () => {
  const [promoCode, setPromoCode] = useState("");
  const [isPromoApplied, setIsPromoApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const { items, getCartTotal, getCartItemsCount } = useCartContext();
  const { toast } = useToast();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price);
  };

  const subtotal = getCartTotal();
  const shipping = subtotal > 50000 ? 0 : 5000; // Livraison gratuite au-dessus de 50,000 FCFA
  const total = subtotal - discount + shipping;
  const itemsCount = getCartItemsCount();

  const handlePromoCode = () => {
    // Simulation de codes promo
    const validCodes = {
      'BIENVENUE10': 0.1,
      'AGRICULTEUR15': 0.15,
      'TECH2024': 0.05
    };

    if (validCodes[promoCode.toUpperCase()]) {
      const discountRate = validCodes[promoCode.toUpperCase()];
      setDiscount(subtotal * discountRate);
      setIsPromoApplied(true);
      toast({
        title: "Code promo appliqué !",
        description: `Réduction de ${(discountRate * 100)}% appliquée`,
      });
    } else {
      toast({
        title: "Code promo invalide",
        description: "Le code saisi n'est pas valide",
        variant: "destructive"
      });
    }
  };

  const handleCheckout = () => {
    toast({
      title: "Fonctionnalité en développement",
      description: "Le système de paiement sera bientôt disponible",
    });
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
        {/* Articles count */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">
            {itemsCount} article{itemsCount > 1 ? 's' : ''}
          </span>
          <span>{formatPrice(subtotal)} FCFA</span>
        </div>

        {/* Shipping */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Truck className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Livraison</span>
          </div>
          <div className="text-right">
            {shipping === 0 ? (
              <Badge variant="secondary" className="text-green-600">
                Gratuite
              </Badge>
            ) : (
              <span>{formatPrice(shipping)} FCFA</span>
            )}
          </div>
        </div>

        {/* Free shipping notice */}
        {shipping > 0 && subtotal < 50000 && (
          <div className="bg-muted/50 p-3 rounded-lg text-sm">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Truck className="w-4 h-4" />
              <span>
                Livraison gratuite à partir de 50,000 FCFA
              </span>
            </div>
            <div className="text-primary font-medium mt-1">
              Plus que {formatPrice(50000 - subtotal)} FCFA !
            </div>
          </div>
        )}

        {/* Promo code */}
        <div className="space-y-2">
          <div className="flex space-x-2">
            <Input
              placeholder="Code promo"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              disabled={isPromoApplied}
            />
            <Button
              variant="outline"
              onClick={handlePromoCode}
              disabled={isPromoApplied || !promoCode}
            >
              <Tag className="w-4 h-4" />
            </Button>
          </div>
          {isPromoApplied && (
            <div className="flex items-center justify-between text-green-600">
              <span className="text-sm">Réduction appliquée</span>
              <span>-{formatPrice(discount)} FCFA</span>
            </div>
          )}
        </div>

        {/* Discount */}
        {discount > 0 && (
          <div className="flex justify-between items-center text-green-600">
            <span>Réduction</span>
            <span>-{formatPrice(discount)} FCFA</span>
          </div>
        )}

        {/* Total */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">{formatPrice(total)} FCFA</span>
          </div>
        </div>

        {/* Security notice */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <Shield className="w-4 h-4" />
          <span>Paiement 100% sécurisé</span>
        </div>

        {/* Checkout button */}
        <Button 
          onClick={handleCheckout}
          size="lg" 
          className="w-full group"
          variant="nature"
        >
          Procéder au paiement
          <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
        </Button>

        {/* Payment methods */}
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