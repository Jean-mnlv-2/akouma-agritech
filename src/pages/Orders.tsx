import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/integrations/api/client";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  CreditCard,
} from "lucide-react";

interface OrderSummary {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  items: { id: number; name: string; quantity: number }[];
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Clock },
  confirmed: { label: "Confirmée", color: "bg-blue-100 text-blue-800 border-blue-300", icon: CheckCircle2 },
  processing: { label: "En préparation", color: "bg-accent/10 text-accent border-accent/30", icon: Package },
  shipped: { label: "Expédiée", color: "bg-primary/10 text-primary border-primary/30", icon: Truck },
  delivered: { label: "Livrée", color: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle2 },
  cancelled: { label: "Annulée", color: "bg-destructive/10 text-destructive border-destructive/30", icon: XCircle },
};

const PAYMENT_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  paid: { label: "Payé", color: "bg-green-100 text-green-800 border-green-300" },
  failed: { label: "Échoué", color: "bg-destructive/10 text-destructive border-destructive/30" },
  refunded: { label: "Remboursé", color: "bg-muted text-muted-foreground border-border" },
};

const PAGE_SIZE = 10;

const Orders = () => {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await api.request("GET", "/api/orders");
        const all: OrderSummary[] = res.data || [];
        // Client-side pagination since the API returns all user orders
        setOrders(all);
        setHasMore(all.length > page * PAGE_SIZE);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    setHasMore(orders.length > page * PAGE_SIZE);
  }, [page, orders.length]);

  const paginatedOrders = orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));

  const formatPrice = (price: number) => new Intl.NumberFormat("fr-FR").format(Math.max(0, Math.round(Number(price))));
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-8 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold text-foreground mb-2">Mes commandes</h1>
          <p className="text-muted-foreground mb-8">Suivez vos commandes et paiements</p>

          {loading ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner size="large" text="Chargement..." />
            </div>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-16">
                <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">Aucune commande</h2>
                <p className="text-muted-foreground mb-6">Vous n'avez pas encore passé de commande.</p>
                <Link to="/shop">
                  <Button>Découvrir la boutique</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedOrders.map((order) => {
                  const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
                  const payment = PAYMENT_MAP[order.paymentStatus] || PAYMENT_MAP.pending;
                  const StatusIcon = status.icon;

                  return (
                    <Link key={order.id} to={`/orders/${order.id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer border">
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <StatusIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                                <span className="font-semibold text-foreground">
                                  #{order.orderNumber}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  · {formatDate(order.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {order.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <div className="flex flex-col items-end gap-1.5">
                                <span className="font-bold text-foreground">
                                  {formatPrice(order.total)} FCFA
                                </span>
                                <div className="flex gap-2">
                                  <Badge className={`${status.color} border text-xs`}>
                                    {status.label}
                                  </Badge>
                                  <Badge className={`${payment.color} border text-xs`}>
                                    <CreditCard className="w-3 h-3 mr-1" />
                                    {payment.label}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Précédent
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} sur {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasMore}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Suivant
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Orders;
