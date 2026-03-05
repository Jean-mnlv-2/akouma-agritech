import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/integrations/api/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Package, Clock, MapPin, Phone, ArrowLeft, Loader2 } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  subtotal: number;
  shipping: number;
  discount: number;
  shippingAddress?: string;
  shippingCity?: string;
  shippingCountry?: string;
  shippingPhone?: string;
  createdAt: string;
  items: OrderItem[];
}

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setIsSuccess(true);
      toast({
        title: "Paiement initié",
        description: "Votre paiement est en cours de traitement. Vous recevrez une confirmation dès qu'il sera validé.",
      });
    }
  }, [toast]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.request('GET', `/api/orders/${id}`);
        setOrder(res.data || res);
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchOrder();
  }, [id]);

  const formatPrice = (price: number) => new Intl.NumberFormat('fr-FR').format(price);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner text="Chargement de votre commande..." />
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-6 py-20 text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-4">Commande introuvable</h1>
          <Button asChild>
            <Link to="/shop">Retour à la boutique</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-8 pb-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <Link to="/shop" className="inline-flex items-center text-muted-foreground hover:text-primary mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la boutique
          </Link>

          {isSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-8 flex items-start gap-4">
              <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-emerald-900 font-bold text-lg">Merci pour votre commande !</h2>
                <p className="text-emerald-700">Votre demande de paiement a été envoyée avec succès. Nous mettrons à jour le statut de votre commande dès que le paiement sera confirmé par l'opérateur.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Commande #{order.orderNumber}</CardTitle>
                    <p className="text-sm text-muted-foreground">Passée le {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'outline'}>
                    {order.paymentStatus === 'paid' ? 'Payée' : 'Paiement en attente'}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 py-2 border-b last:border-0">
                        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center overflow-hidden">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">Qté: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatPrice(item.price * item.quantity)} FCFA</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Statut de la commande
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${order.status === 'delivered' ? 'bg-emerald-100 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold capitalize">{order.status}</p>
                      <p className="text-sm text-muted-foreground">Dernière mise à jour : {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Résumé</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span>{formatPrice(order.subtotal)} FCFA</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span>Réduction</span>
                      <span>-{formatPrice(order.discount)} FCFA</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Livraison</span>
                    <span>{order.shipping === 0 ? 'Gratuite' : `${formatPrice(order.shipping)} FCFA`}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(order.total)} FCFA</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Livraison</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{order.shippingAddress}</p>
                      <p>{order.shippingCity}, {order.shippingCountry}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <p>{order.shippingPhone}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
