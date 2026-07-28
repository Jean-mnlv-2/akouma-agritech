import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCartContext } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/integrations/api/client";
import { useCountries } from "@/hooks/use-countries";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Lock, ArrowLeft, MapPin, Wallet, Tag, X, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getCartTotal, clearCart, appliedPromo, clearPromo, applyPromo, getCartItemsCount } = useCartContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [validatedPromo, setValidatedPromo] = useState<{
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    discountAmount: number;
    description?: string | null;
  } | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [promoCode, setPromoCode] = useState("");

  // Cashback state
  const [cashbackBalance, setCashbackBalance] = useState(0);
  const [cashbackToUse, setCashbackToUse] = useState(0);
  
  const { countries, updatePhoneWithCode } = useCountries();
  
  // Form state
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingZipCode, setShippingZipCode] = useState("");
  const [shippingCountry, setShippingCountry] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("orange_money");
  const [deliveryMethod, setDeliveryMethod] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [estimatedShipping, setEstimatedShipping] = useState(0);
  const [isEstimating, setIsEstimating] = useState(false);
  const [notes, setNotes] = useState("");

  const handleCountryChange = (value: string) => {
    setShippingCountry(value);
    setShippingPhone(prev => updatePhoneWithCode(prev, value));
  };

  const subtotal = getCartTotal();
  const itemsCount = getCartItemsCount();
  const shipping = deliveryMethod === "PICKUP" ? 0 : estimatedShipping;
  const discount = useMemo(() => validatedPromo?.discountAmount ?? 0, [validatedPromo]);
  const total = Math.max(0, subtotal - discount - cashbackToUse + shipping);

  const handlePromoCode = async () => {
    if (!promoCode) return;
    setValidatingPromo(true);
    try {
      const { data } = await api.promoCodes.validate(promoCode, subtotal);
      setValidatedPromo({
        code: data.code,
        discountType: data.discountType,
        discountValue: Number(data.discountValue),
        discountAmount: Number(data.discountAmount),
        description: data.description,
      });
      applyPromo({
        code: data.code,
        discountType: data.discountType,
        discountValue: Number(data.discountValue),
        description: data.description,
      });
      toast({
        title: "Code promo appliqué !",
        description: `Réduction de ${formatPrice(data.discountAmount)} FCFA appliquée`,
      });
    } catch (error: unknown) {
      const err = error as { message?: string; error?: string };
      toast({
        title: "Code promo invalide",
        description: err.message || err.error || "Impossible d'appliquer ce code",
        variant: "destructive",
      });
    } finally {
      setValidatingPromo(false);
    }
  };

  useEffect(() => {
    if (deliveryMethod === "DELIVERY" && shippingAddress && shippingCity) {
      const timer = setTimeout(async () => {
        setIsEstimating(true);
        try {
          const res = await api.request('POST', '/api/deliveries/estimate', {
            body: { 
              dropAddressId: `${shippingAddress}, ${shippingZipCode} ${shippingCity}, ${shippingState}, ${shippingCountry}`.replace(/ ,/g, '').replace(/,,/g, ','),
              items: items.map(i => ({ id: i.id, quantity: i.quantity })),
              cartTotal: subtotal
            }
          });
          if (res?.data?.price !== undefined) {
            setEstimatedShipping(Number(res.data.price));
          } else {
            setEstimatedShipping(0);
          }
        } catch (error) {
          console.error("Estimation error:", error);
          setEstimatedShipping(0);
        } finally {
          setIsEstimating(false);
        }
      }, 800);
      return () => clearTimeout(timer);
    } else if (deliveryMethod === "PICKUP") {
      setEstimatedShipping(0);
    }
  }, [deliveryMethod, shippingAddress, shippingCity, shippingState, shippingZipCode, shippingCountry, items, subtotal]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: session } = await api.auth.getSession();
        if (session?.session?.user) {
          setIsAuthenticated(true);
          try {
            const cbRes = await api.request('GET', '/api/promo-codes/my-cashback');
            if (cbRes?.data?.cashbackBalance > 0) {
              setCashbackBalance(Number(cbRes.data.cashbackBalance));
            }
          } catch { /* no cashback */ }
        } else {
          navigate('/auth?redirect=/checkout');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/auth?redirect=/checkout');
      } finally {
        setLoading(false);
      }
    };

    if (items.length === 0) {
      navigate('/cart');
      return;
    }

    checkAuth();
  }, [items, navigate]);

  useEffect(() => {
    if (appliedPromo && !validatedPromo && subtotal > 0) {
      setPromoCode(appliedPromo.code);
    }
  }, [appliedPromo, validatedPromo, subtotal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (deliveryMethod === 'DELIVERY' && (!shippingAddress || !shippingCity || !shippingCountry || !shippingPhone)) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir les champs obligatoires (adresse, ville, pays, téléphone)",
        variant: "destructive",
      });
      return;
    }

    if (deliveryMethod === 'DELIVERY' && shipping === 0) {
      toast({
        title: "Estimation requise",
        description: "Veuillez saisir une adresse valide pour calculer les frais de livraison",
        variant: "destructive",
      });
      return;
    }

    if (deliveryMethod === 'PICKUP' && !shippingPhone) {
      toast({
        title: "Téléphone requis",
        description: "Veuillez fournir un numéro de téléphone pour le suivi du retrait",
        variant: "destructive",
      });
      return;
    }

    if (validatingPromo) {
      toast({ title: "Validation en cours", description: "Veuillez patienter...", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    try {
      const orderItems = items.map(item => {
        const productId = Number(item.id);
        if (!Number.isFinite(productId)) {
          throw new Error("Identifiant de produit invalide");
        }
        return {
          productId,
          productType: item.productType,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.image,
        };
      });

      const result = await api.request('POST', '/api/orders', {
        body: {
          items: orderItems,
          shippingAddress,
          shippingCity,
          shippingState,
          shippingZipCode,
          shippingCountry,
          shippingPhone,
          paymentMethod,
          deliveryMethod,
          shippingFee: shipping,
          notes,
          promoCode: validatedPromo?.code || appliedPromo?.code || null,
          cashbackAmount: cashbackToUse > 0 ? cashbackToUse : undefined,
        },
      });

      const order = result.data;

      // Initiate Money Fusion payment
      try {
        const paymentResult = await api.request('POST', '/api/payments/initiate', {
          body: { orderId: order.id },
        });

        const paymentUrl = paymentResult.data?.paymentUrl;

        clearCart();
        clearPromo();

        if (paymentUrl) {
          toast({
            title: "Redirection vers le paiement...",
            description: `Commande #${order.orderNumber} créée. Vous allez être redirigé.`,
          });
          // Redirect to Money Fusion payment page
          window.location.href = paymentUrl;
          return;
        } else {
          console.warn('[Checkout] No paymentUrl in response:', paymentResult);
          toast({
            title: "Commande créée",
            description: `Commande #${order.orderNumber} enregistrée. Le lien de paiement n'a pas été reçu — veuillez réessayer depuis votre commande.`,
          });
          navigate(`/orders/${order.id}`);
          return;
        }
      } catch (paymentError: unknown) {
        console.error('Payment initiation error:', paymentError);
        const err = paymentError as { message?: string };
        // Order was created but payment failed to initiate
        clearCart();
        clearPromo();
        toast({
          title: "Commande créée — Paiement en attente",
          description: err?.message || `Le paiement n'a pas pu être initié. Vous pouvez payer depuis la page de votre commande.`,
          variant: "destructive",
        });
        navigate(`/orders/${order.id}`);
        return;
      }
    } catch (error: unknown) {
      console.error('Order creation error:', error);
      const err = error as { message?: string };
      toast({
        title: "Erreur",
        description: err.message || "Impossible de créer la commande",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('fr-FR').format(Math.max(0, Math.round(price)));

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="large" text="Vérification de l'authentification..." />
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-8 pb-16">
        <div className="container mx-auto px-6 max-w-6xl">
          {/* Breadcrumb */}
          <div className="mb-8">
            <Link to="/cart" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au panier
            </Link>
          </div>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Finaliser la commande
            </h1>
            <p className="text-muted-foreground">
              Veuillez remplir les informations de livraison et de paiement
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Delivery Method Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="w-5 h-5" />
                      <span>Mode de réception</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup 
                      value={deliveryMethod} 
                      onValueChange={(val: "PICKUP" | "DELIVERY") => setDeliveryMethod(val)}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      <div className={`flex items-center space-x-3 p-4 border rounded-xl transition-all cursor-pointer ${deliveryMethod === 'PICKUP' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/50'}`}>
                        <RadioGroupItem value="PICKUP" id="pickup" className="text-primary" />
                        <Label htmlFor="pickup" className="flex-1 cursor-pointer font-medium">
                          <div className="text-base">Retrait sur place</div>
                          <div className="text-sm text-green-600 font-normal">Collecte gratuite à notre point de retrait</div>
                        </Label>
                      </div>
                      
                      <div className={`flex items-center space-x-3 p-4 border rounded-xl transition-all cursor-pointer ${deliveryMethod === 'DELIVERY' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/50'}`}>
                        <RadioGroupItem value="DELIVERY" id="delivery" className="text-primary" />
                        <Label htmlFor="delivery" className="flex-1 cursor-pointer font-medium">
                          <div className="text-base">Livraison à domicile</div>
                          <div className="text-sm text-muted-foreground font-normal">
                            {isEstimating ? "Calcul du prix..." : estimatedShipping > 0 ? `${formatPrice(estimatedShipping)} FCFA` : "Calculé selon l'adresse"}
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Shipping Information - Only show if DELIVERY is selected or always? 
                    User might want to provide address anyway for billing/contact. 
                    But let's keep it visible and only require if DELIVERY.
                */}
                <Card className={deliveryMethod === 'PICKUP' ? 'opacity-60 grayscale-[0.5]' : ''}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="w-5 h-5" />
                      <span>Informations de livraison</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="address">Adresse {deliveryMethod === 'DELIVERY' && '*'}</Label>
                        <Input
                          id="address"
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                          placeholder="Rue, numéro"
                          required={deliveryMethod === 'DELIVERY'}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">Code Postal / BP</Label>
                        <Input
                          id="zipCode"
                          value={shippingZipCode}
                          onChange={(e) => setShippingZipCode(e.target.value)}
                          placeholder="Ex: 01 BP 1234"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">Ville {deliveryMethod === 'DELIVERY' && '*'}</Label>
                        <Input
                          id="city"
                          value={shippingCity}
                          onChange={(e) => setShippingCity(e.target.value)}
                          placeholder="Ville"
                          required={deliveryMethod === 'DELIVERY'}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">Région / Province</Label>
                        <Input
                          id="state"
                          value={shippingState}
                          onChange={(e) => setShippingState(e.target.value)}
                          placeholder="Région ou Province"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="country">Pays *</Label>
                        <Select value={shippingCountry} onValueChange={handleCountryChange}>
                          <SelectTrigger id="country">
                            <SelectValue placeholder="Sélectionnez votre pays" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {countries.map((country) => (
                              <SelectItem key={country.code} value={country.name}>
                                {country.name} ({country.phoneCode})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Téléphone *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={shippingPhone}
                          onChange={(e) => setShippingPhone(e.target.value)}
                          placeholder="+226 XX XX XX XX"
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CreditCard className="w-5 h-5" />
                      <span>Méthode de paiement</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                      <div className="flex items-center space-x-2 p-4 border rounded-lg">
                        <RadioGroupItem value="orange_money" id="orange_money" />
                        <Label htmlFor="orange_money" className="flex-1 cursor-pointer">
                          Orange Money
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-4 border rounded-lg">
                        <RadioGroupItem value="mtn_money" id="mtn_money" />
                        <Label htmlFor="mtn_money" className="flex-1 cursor-pointer">
                          MTN Money
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-4 border rounded-lg">
                        <RadioGroupItem value="visa" id="visa" />
                        <Label htmlFor="visa" className="flex-1 cursor-pointer">
                          Carte Visa/Mastercard
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Notes (optionnel)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      className="w-full min-h-[100px] p-3 border rounded-lg resize-none"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Instructions spéciales pour la livraison..."
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:col-span-1">
                <Card className="sticky top-20 border-primary/20 shadow-lg">
                  <CardHeader className="bg-primary/5 pb-4">
                    <CardTitle className="text-xl font-bold text-primary">Résumé de commande</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    {/* Item count and Subtotal */}
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span className="text-muted-foreground">{itemsCount} article{itemsCount > 1 ? 's' : ''}</span>
                      <span className="text-lg">{formatPrice(subtotal)} FCFA</span>
                    </div>

                    {/* Delivery / Pickup Choice info */}
                    <div className="space-y-4 border-t border-b py-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-muted-foreground font-medium block text-sm">Livraison</span>
                          {deliveryMethod === 'DELIVERY' ? (
                            <span className="text-xs text-muted-foreground block">
                              Livraison à domicile par notre partenaire.
                            </span>
                          ) : (
                            <div className="space-y-1">
                              <span className="text-sm font-semibold text-foreground block">Retrait sur place</span>
                              <span className="text-[11px] text-muted-foreground block leading-relaxed">
                                Collecte gratuite à notre point de retrait.
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          {deliveryMethod === 'PICKUP' ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-3 py-1 text-xs font-bold uppercase tracking-wider">
                              Gratuite
                            </Badge>
                          ) : (
                            shipping > 0 ? (
                              <span className="font-bold text-primary">{formatPrice(shipping)} FCFA</span>
                            ) : (
                              <span className="text-[10px] font-bold text-orange-600 uppercase tracking-tight bg-orange-50 px-2 py-1 rounded">
                                À calculer selon l'adresse
                              </span>
                            )
                          )}
                        </div>
                      </div>

                      {/* Code Promo Section */}
                      <div className="space-y-2 pt-2">
                        <span className="text-sm font-medium text-muted-foreground block">Code promo</span>
                        {validatedPromo ? (
                          <div className="flex items-center justify-between bg-green-50 p-2 rounded-lg border border-green-100">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <Tag className="w-3 h-3 text-green-600 flex-shrink-0" />
                              <span className="text-xs font-bold text-green-700 truncate uppercase tracking-tighter">
                                {validatedPromo.code}
                              </span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={clearPromo}
                              className="h-6 w-6 p-0 hover:bg-green-100 text-green-700"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Input 
                              placeholder="Votre code..." 
                              className="h-9 text-xs" 
                              value={promoCode}
                              onChange={(e) => setPromoCode(e.target.value)}
                            />
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              className="h-9 px-3 border-primary/30 hover:bg-primary/5 text-primary"
                              onClick={handlePromoCode}
                              disabled={!promoCode || validatingPromo}
                            >
                              {validatingPromo ? "..." : "Appliquer"}
                            </Button>
                          </div>
                        )}
                        {validatedPromo && (
                          <div className="flex justify-between text-sm font-bold text-green-600 px-1">
                            <span>Réduction</span>
                            <span>-{formatPrice(discount)} FCFA</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cashback section */}
                    {cashbackBalance > 0 && (
                      <div className="bg-muted/30 p-4 rounded-xl space-y-3 border border-dashed border-muted-foreground/20">
                        <div className="flex items-center gap-2 text-xs">
                          <Wallet className="w-4 h-4 text-primary" />
                          <span className="font-bold uppercase tracking-wide">Cashback : {formatPrice(cashbackBalance)} FCFA</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            max={Math.min(cashbackBalance, subtotal - discount)}
                            value={cashbackToUse || ''}
                            onChange={(e) => {
                              const val = Math.min(Number(e.target.value) || 0, cashbackBalance, Math.max(0, subtotal - discount));
                              setCashbackToUse(val);
                            }}
                            placeholder="Montant à utiliser"
                            className="h-8 text-xs bg-background"
                          />
                          <Button
                            type="button"
                            variant="nature"
                            size="sm"
                            className="h-8 text-[10px] font-bold"
                            onClick={() => setCashbackToUse(Math.min(cashbackBalance, Math.max(0, subtotal - discount)))}
                          >
                            MAX
                          </Button>
                        </div>
                        {cashbackToUse > 0 && (
                          <div className="flex justify-between text-primary text-xs font-bold pt-1 border-t border-primary/10">
                            <span>Utilisé</span>
                            <span>-{formatPrice(cashbackToUse)} FCFA</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Total */}
                    <div className="space-y-4 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-foreground">Total</span>
                        <span className="text-2xl font-black text-primary underline decoration-primary/20 underline-offset-4">
                          {formatPrice(total)} FCFA
                        </span>
                      </div>

                      <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground bg-green-50/50 py-3 rounded-xl border border-green-100/50">
                        <Shield className="w-4 h-4 text-green-600" />
                        <span className="font-medium">Paiement 100% sécurisé</span>
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all duration-300"
                        disabled={submitting || (deliveryMethod === 'DELIVERY' && isEstimating)}
                      >
                        {submitting ? (
                          <LoadingSpinner size="small" text="Traitement..." />
                        ) : (
                          <>
                            <Lock className="w-5 h-5 mr-3" />
                            Procéder au paiement
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Checkout;

