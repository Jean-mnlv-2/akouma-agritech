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
import { CreditCard, Lock, ArrowLeft, MapPin, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import LoadingSpinner from "@/components/LoadingSpinner";

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getCartTotal, clearCart, appliedPromo, clearPromo, applyPromo } = useCartContext();
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

  // Cashback state
  const [cashbackBalance, setCashbackBalance] = useState(0);
  const [cashbackToUse, setCashbackToUse] = useState(0);
  const [loadingCashback, setLoadingCashback] = useState(false);
  
  const { countries, updatePhoneWithCode } = useCountries();
  
  // Form state
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingCountry, setShippingCountry] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("orange_money");
  const [notes, setNotes] = useState("");

  const handleCountryChange = (value: string) => {
    setShippingCountry(value);
    setShippingPhone(prev => updatePhoneWithCode(prev, value));
  };

  const subtotal = getCartTotal();
  const shipping = subtotal > 50000 ? 0 : 5000;
  const discount = useMemo(() => validatedPromo?.discountAmount ?? 0, [validatedPromo]);
  const total = Math.max(0, subtotal - discount - cashbackToUse + shipping);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: session } = await api.auth.getSession();
        if (session?.session?.user) {
          setIsAuthenticated(true);
          // Load cashback balance
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
    if (!appliedPromo) {
      setValidatedPromo(null);
      return;
    }

    let cancelled = false;
    const runValidation = async () => {
      setValidatingPromo(true);
      try {
        const { data } = await api.promoCodes.validate(appliedPromo.code, subtotal);
        if (!cancelled) {
          setValidatedPromo({
            code: data.code,
            discountType: data.discountType,
            discountValue: Number(data.discountValue),
            discountAmount: Number(data.discountAmount),
            description: data.description,
          });
          // Ensure cart promo is up to date with backend values
          applyPromo({
            code: data.code,
            discountType: data.discountType,
            discountValue: Number(data.discountValue),
            description: data.description,
          });
        }
      } catch (error: unknown) {
        if (!cancelled) {
          console.warn('Promo validation failed:', error);
          const err = error as { message?: string; error?: string };
          setValidatedPromo(null);
          clearPromo();
          toast({
            title: "Code promo invalide",
            description: err?.message || err?.error || "La réduction est expirée",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setValidatingPromo(false);
      }
    };

    if (subtotal > 0) {
      runValidation();
    }

    return () => {
      cancelled = true;
    };
  }, [appliedPromo?.code, subtotal, applyPromo, clearPromo, toast, appliedPromo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shippingAddress || !shippingCity || !shippingCountry || !shippingPhone) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs de livraison",
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
          productType: 'shop_product',
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
          shippingCountry,
          shippingPhone,
          paymentMethod,
          notes,
          promoCode: validatedPromo?.code || appliedPromo?.code || null,
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
                {/* Shipping Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="w-5 h-5" />
                      <span>Informations de livraison</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="address">Adresse *</Label>
                        <Input
                          id="address"
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                          placeholder="Rue, numéro"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">Ville *</Label>
                        <Input
                          id="city"
                          value={shippingCity}
                          onChange={(e) => setShippingCity(e.target.value)}
                          placeholder="Ville"
                          required
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
                <Card className="sticky top-20">
                  <CardHeader>
                    <CardTitle>Résumé de la commande</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Items */}
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center space-x-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm line-clamp-2">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.quantity} × {formatPrice(item.price)} FCFA
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sous-total</span>
                        <span>{formatPrice(subtotal)} FCFA</span>
                      </div>
                      {validatedPromo && (
                        <div className="flex justify-between text-green-600">
                          <span>Code {validatedPromo.code}</span>
                          <span>-{formatPrice(discount)} FCFA</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Livraison</span>
                        <span>
                          {shipping === 0 ? (
                            <span className="text-green-600">Gratuite</span>
                          ) : (
                            `${formatPrice(shipping)} FCFA`
                          )}
                        </span>
                      </div>
                      <div className="border-t pt-2 flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary">{formatPrice(total)} FCFA</span>
                      </div>
                    </div>
                    {validatedPromo && validatedPromo.description && (
                      <div className="text-xs text-muted-foreground">
                        {validatedPromo.description}
                      </div>
                    )}
                    {validatingPromo && (
                      <div className="text-xs text-muted-foreground">
                        Validation du code promo...
                      </div>
                    )}

                    <div className="flex items-center space-x-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      <Lock className="w-4 h-4" />
                      <span>Paiement 100% sécurisé</span>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={submitting}
                    >
                      {submitting ? (
                        "Traitement..."
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Confirmer la commande
                        </>
                      )}
                    </Button>
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

