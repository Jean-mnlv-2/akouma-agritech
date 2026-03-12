import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { api } from "@/integrations/api/client";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Package,
  Truck,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  MapPin,
  Phone,
  RefreshCw,
} from "lucide-react";

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  productType: string;
}

interface OrderEvent {
  id: number;
  type: string;
  status?: string | null;
  paymentStatus?: string | null;
  note?: string | null;
  createdAt: string;
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string | null;
  paymentRef?: string | null;
  deliveryMethod: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingCountry?: string | null;
  shippingPhone?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  events: OrderEvent[];
  promoCode?: { code: string; discountType: string; discountValue: number } | null;
  deliveryPartner?: { name: string; estimatedDelay?: string | null } | null;
  user?: { fullName?: string; email?: string } | null;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Clock },
  confirmed: { label: "Confirmée", color: "bg-blue-100 text-blue-800 border-blue-300", icon: CheckCircle2 },
  processing: { label: "En préparation", color: "bg-accent/10 text-accent border-accent/30", icon: Package },
  shipped: { label: "Expédiée", color: "bg-primary/10 text-primary border-primary/30", icon: Truck },
  delivered: { label: "Livrée", color: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle2 },
  cancelled: { label: "Annulée", color: "bg-destructive/10 text-destructive border-destructive/30", icon: XCircle },
};

const PAYMENT_STATUS_MAP: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Clock },
  paid: { label: "Payé", color: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle2 },
  failed: { label: "Échoué", color: "bg-destructive/10 text-destructive border-destructive/30", icon: XCircle },
  refunded: { label: "Remboursé", color: "bg-muted text-muted-foreground border-border", icon: AlertCircle },
};

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingPayment, setCheckingPayment] = useState(false);

  const paymentParam = searchParams.get("payment");

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.request("GET", `/api/orders/${id}`);
      setOrder(res.data);
    } catch (err) {
      console.error("Error fetching order:", err);
      toast({
        title: "Erreur",
        description: "Impossible de charger la commande.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Auto-refresh every 10s when payment is pending or failed
  useEffect(() => {
    if (!order || (order.paymentStatus !== "pending" && order.paymentStatus !== "failed")) return;
    const interval = setInterval(() => {
      fetchOrder();
    }, 10000);
    return () => clearInterval(interval);
  }, [order?.paymentStatus, fetchOrder]);

  useEffect(() => {
    if (paymentParam === "success") {
      toast({
        title: "Paiement en cours de vérification",
        description: "Votre paiement est en cours de traitement. Le statut sera mis à jour automatiquement.",
      });
    } else if (paymentParam === "cancelled") {
      toast({
        title: "Paiement annulé",
        description: "Vous pouvez réessayer le paiement.",
        variant: "destructive",
      });
    }
  }, [paymentParam, toast]);

  const handleCheckPayment = async () => {
    if (!order?.paymentRef) return;
    setCheckingPayment(true);
    try {
      const res = await api.request("GET", `/api/payments/status/${order.paymentRef}`);
      const data = res.data;

      if (data?.statut === "paid" || data?.statut === "successful") {
        toast({ title: "Paiement confirmé !", description: "Votre paiement a été reçu." });
      } else {
        toast({
          title: "Paiement en attente",
          description: `Statut actuel : ${data?.statut || "inconnu"}`,
        });
      }
      // Refresh order data
      await fetchOrder();
    } catch (err) {
      console.error("Payment check error:", err);
      toast({
        title: "Erreur",
        description: "Impossible de vérifier le paiement.",
        variant: "destructive",
      });
    } finally {
      setCheckingPayment(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!order) return;
    try {
      const res = await api.request("POST", "/api/payments/initiate", {
        body: { orderId: order.id },
      });
      const paymentUrl = res.data?.paymentUrl;
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        toast({ title: "Erreur", description: "Impossible d'initier le paiement.", variant: "destructive" });
      }
    } catch (err) {
      console.error("Retry payment error:", err);
      toast({ title: "Erreur", description: "Impossible d'initier le paiement.", variant: "destructive" });
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat("fr-FR").format(Math.max(0, Math.round(Number(price))));
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="large" text="Chargement de la commande..." />
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-6 py-16 text-center">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-4">Commande introuvable</h1>
          <p className="text-muted-foreground mb-6">Cette commande n'existe pas ou vous n'y avez pas accès.</p>
          <Link to="/shop">
            <Button>Retour à la boutique</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const orderStatus = STATUS_MAP[order.status] || STATUS_MAP.pending;
  const paymentStatus = PAYMENT_STATUS_MAP[order.paymentStatus] || PAYMENT_STATUS_MAP.pending;
  const StatusIcon = orderStatus.icon;
  const PaymentIcon = paymentStatus.icon;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-8 pb-16">
        <div className="container mx-auto px-6 max-w-5xl">
          {/* Breadcrumb */}
          <div className="mb-8">
            <Link
              to="/shop"
              className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à la boutique
            </Link>
          </div>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Commande #{order.orderNumber}
              </h1>
              <p className="text-muted-foreground mt-1">
                Passée le {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Badge className={`${orderStatus.color} border px-3 py-1.5 text-sm font-medium`}>
                <StatusIcon className="w-4 h-4 mr-1.5" />
                {orderStatus.label}
              </Badge>
              <Badge className={`${paymentStatus.color} border px-3 py-1.5 text-sm font-medium`}>
                <PaymentIcon className="w-4 h-4 mr-1.5" />
                Paiement : {paymentStatus.label}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Payment Actions */}
              {order.paymentStatus !== "paid" && (
                <Card className="border-yellow-200 bg-yellow-50/50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">Paiement en attente</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {order.paymentStatus === "failed"
                            ? "Le paiement a échoué. Vous pouvez réessayer."
                            : "Votre paiement est en cours de traitement ou n'a pas encore été effectué."}
                        </p>
                        <div className="flex flex-wrap gap-3">
                          <Button onClick={handleRetryPayment} size="sm">
                            <CreditCard className="w-4 h-4 mr-2" />
                            {order.paymentStatus === "failed" ? "Réessayer le paiement" : "Payer maintenant"}
                          </Button>
                          {order.paymentRef && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCheckPayment}
                              disabled={checkingPayment}
                            >
                              <RefreshCw className={`w-4 h-4 mr-2 ${checkingPayment ? "animate-spin" : ""}`} />
                              Vérifier le statut
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Articles ({order.items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg border"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground line-clamp-1">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} × {formatPrice(item.price)} FCFA
                        </p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {item.productType === "seed" ? "Semence" : "Produit"}
                        </Badge>
                      </div>
                      <p className="font-semibold text-foreground whitespace-nowrap">
                        {formatPrice(item.price * item.quantity)} FCFA
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Timeline */}
              {order.events.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Historique
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {order.events.map((event, idx) => {
                        const isLast = idx === order.events.length - 1;
                        return (
                          <div key={event.id} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className="w-3 h-3 rounded-full bg-primary shrink-0 mt-1.5" />
                              {!isLast && <div className="w-0.5 flex-1 bg-border mt-1" />}
                            </div>
                            <div className="pb-4">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm text-foreground capitalize">
                                  {event.type === "created"
                                    ? "Commande créée"
                                    : event.type === "payment"
                                    ? "Paiement"
                                    : event.type === "update"
                                    ? "Mise à jour"
                                    : event.type}
                                </span>
                                {event.status && (
                                  <Badge variant="outline" className="text-xs">
                                    {STATUS_MAP[event.status]?.label || event.status}
                                  </Badge>
                                )}
                                {event.paymentStatus && (
                                  <Badge variant="outline" className="text-xs">
                                    {PAYMENT_STATUS_MAP[event.paymentStatus]?.label || event.paymentStatus}
                                  </Badge>
                                )}
                              </div>
                              {event.note && (
                                <p className="text-sm text-muted-foreground mt-1">{event.note}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDate(event.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Summary */}
            <div className="lg:col-span-1 space-y-6">
              {/* Price Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Résumé</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span>{formatPrice(order.subtotal)} FCFA</span>
                  </div>
                  {Number(order.discount) > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>
                        Réduction
                        {order.promoCode && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {order.promoCode.code}
                          </Badge>
                        )}
                      </span>
                      <span>-{formatPrice(order.discount)} FCFA</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Livraison</span>
                    <span>
                      {Number(order.shipping) === 0 ? (
                        <span className="text-green-600">Gratuite</span>
                      ) : (
                        `${formatPrice(order.shipping)} FCFA`
                      )}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(order.total)} FCFA</span>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Paiement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Méthode</span>
                    <span className="font-medium">
                      {order.paymentMethod === "orange_money"
                        ? "Orange Money"
                        : order.paymentMethod === "mtn_money"
                        ? "MTN Money"
                        : order.paymentMethod === "visa"
                        ? "Carte Visa/MC"
                        : order.paymentMethod || "Non définie"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Statut</span>
                    <Badge className={`${paymentStatus.color} border text-xs`}>
                      {paymentStatus.label}
                    </Badge>
                  </div>
                  {order.paymentRef && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Référence</span>
                      <span className="font-mono text-xs">{order.paymentRef}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Shipping Info */}
              {(order.shippingAddress || order.shippingCity) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Livraison
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {order.deliveryPartner && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Partenaire</span>
                        <span className="font-medium">{order.deliveryPartner.name}</span>
                      </div>
                    )}
                    {order.deliveryPartner?.estimatedDelay && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Délai estimé</span>
                        <span>{order.deliveryPartner.estimatedDelay}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="space-y-1 text-muted-foreground">
                      {order.shippingAddress && <p>{order.shippingAddress}</p>}
                      {order.shippingCity && <p>{order.shippingCity}</p>}
                      {order.shippingCountry && <p>{order.shippingCountry}</p>}
                      {order.shippingPhone && (
                        <p className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {order.shippingPhone}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {order.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{order.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default OrderDetail;
