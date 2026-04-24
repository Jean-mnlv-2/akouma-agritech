import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Eye, Loader2, Package, User, MapPin, Phone, Tag, List, Truck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/integrations/api/client';
import { AdminPromoCodes } from './AdminPromoCodes';

interface OrderItem {
  id: number;
  productId: number;
  productType: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface OrderEventDto {
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
  paymentMethod?: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  shippingAddress?: string;
  shippingCity?: string;
  shippingCountry?: string;
  shippingPhone?: string;
  notes?: string;
  deliveryId?: string;
  deliveryStatus?: string;
  createdAt: string;
  updatedAt: string;
  promoCode?: {
    id: number;
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
  } | null;
  items: OrderItem[];
  events: OrderEventDto[];
  user?: {
    id: string;
    email: string;
    fullName?: string | null;
  };
}

const normalizeOrder = (order: Partial<Order> | null | undefined): Order => ({
  id: Number(order?.id ?? 0),
  orderNumber: order?.orderNumber ?? '',
  status: order?.status ?? 'pending',
  paymentStatus: order?.paymentStatus ?? 'pending',
  paymentMethod: order?.paymentMethod,
  subtotal: Number(order?.subtotal ?? 0),
  shipping: Number(order?.shipping ?? 0),
  discount: Number(order?.discount ?? 0),
  total: Number(order?.total ?? 0),
  shippingAddress: order?.shippingAddress,
  shippingCity: order?.shippingCity,
  shippingCountry: order?.shippingCountry,
  shippingPhone: order?.shippingPhone,
  notes: order?.notes,
  deliveryId: order?.deliveryId,
  deliveryStatus: order?.deliveryStatus,
  createdAt: order?.createdAt ?? new Date(0).toISOString(),
  updatedAt: order?.updatedAt ?? new Date(0).toISOString(),
  promoCode: order?.promoCode ?? null,
  items: Array.isArray(order?.items) ? order.items : [],
  events: Array.isArray(order?.events) ? order.events : [],
  user: order?.user,
});

export function AdminOrders() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const selectedOrderItems = Array.isArray(selectedOrder?.items) ? selectedOrder.items : [];
  const selectedOrderEvents = Array.isArray(selectedOrder?.events) ? selectedOrder.events : [];

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['admin', 'orders'],
    queryFn: async () => {
      const res = await api.request('GET', '/api/orders');
      const items = Array.isArray(res) ? res : res.data;
      return Array.isArray(items) ? items.map((item) => normalizeOrder(item)) : [];
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  const updateOrderMutation = useMutation({
    mutationFn: async (args: { orderId: number; status: string; paymentStatus?: string }) => {
      const res = await api.request('PUT', `/api/orders/${args.orderId}`, { body: { status: args.status, paymentStatus: args.paymentStatus } });
      return Array.isArray(res) ? res : res;
    },
    onSuccess: (res: { data?: Order }) => {
      toast({ title: 'Succès', description: 'Statut de la commande mis à jour' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      const updated = res?.data ? normalizeOrder(res.data) : null;
      if (updated && selectedOrder?.id === updated.id) {
        setSelectedOrder(updated);
      }
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour la commande', variant: 'destructive' });
    }
  });

  const handleUpdateStatus = (orderId: number, status: string, paymentStatus?: string) => {
    updateOrderMutation.mutate({ orderId, status, paymentStatus });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      confirmed: 'secondary',
      processing: 'default',
      shipped: 'default',
      delivered: 'default',
      cancelled: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      paid: 'default',
      failed: 'destructive',
      refunded: 'secondary',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Ventes & Promotions</h2>
          <p className="text-muted-foreground">Gérez les commandes et les codes de réduction.</p>
        </div>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 max-w-[400px]">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Commandes
          </TabsTrigger>
          <TabsTrigger value="promos" className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Codes Promo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="w-5 h-5" />
                <span>Liste des commandes</span>
              </CardTitle>
              <CardDescription>
                Consultez et gérez toutes les transactions de la boutique.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune commande pour le moment</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° Commande</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Paiement</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow 
                          key={order.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleViewOrder(order)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{order.orderNumber}</span>
                              {order.deliveryId && (
                                <div className="flex items-center gap-1 mt-1 text-[10px] text-primary font-semibold">
                                  <Truck className="w-3 h-3" />
                                  <span>LIVRAISON</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{order.user?.fullName || 'N/A'}</span>
                              <span className="text-sm text-muted-foreground">{order.user?.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                          <TableCell className="font-semibold">{formatPrice(Number(order.total))} FCFA</TableCell>
                          <TableCell className="space-y-1">
                            {getStatusBadge(order.status)}
                            {order.promoCode && (
                              <div className="text-xs text-muted-foreground">Code {order.promoCode.code}</div>
                            )}
                          </TableCell>
                          <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewOrder(order);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Voir
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promos">
          <AdminPromoCodes />
        </TabsContent>
      </Tabs>

      {/* Order Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails de la commande {selectedOrder?.orderNumber}</DialogTitle>
              <DialogDescription>
                Commande du {selectedOrder && formatDate(selectedOrder.createdAt)}
              </DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-6">
                {/* Customer Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <User className="w-5 h-5" />
                      <span>Informations client</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <span className="font-medium">Nom:</span> {selectedOrder.user?.fullName || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {selectedOrder.user?.email || 'N/A'}
                    </div>
                    {selectedOrder.shippingPhone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4" />
                        <span>{selectedOrder.shippingPhone}</span>
                      </div>
                    )}
                    {(selectedOrder.shippingAddress || selectedOrder.shippingCity || selectedOrder.shippingCountry) && (
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 mt-1" />
                        <div>
                          {selectedOrder.shippingAddress && <div>{selectedOrder.shippingAddress}</div>}
                          {selectedOrder.shippingCity && <div>{selectedOrder.shippingCity}</div>}
                          {selectedOrder.shippingCountry && <div>{selectedOrder.shippingCountry}</div>}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Order Items */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Articles commandés</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedOrderItems.map((item) => (
                        <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Quantité: {item.quantity} × {formatPrice(Number(item.price))} FCFA
                            </div>
                          </div>
                          <div className="font-semibold">
                            {formatPrice(Number(item.price) * item.quantity)} FCFA
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {selectedOrder.promoCode && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Code promotionnel</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{selectedOrder.promoCode.code}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {selectedOrder.promoCode.discountType === 'PERCENTAGE'
                            ? `${selectedOrder.promoCode.discountValue}%`
                            : `${formatPrice(Number(selectedOrder.promoCode.discountValue))} FCFA`}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Réduction appliquée : -{formatPrice(Number(selectedOrder.discount))} FCFA
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Order Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Résumé</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Sous-total:</span>
                      <span>{formatPrice(Number(selectedOrder.subtotal))} FCFA</span>
                    </div>
                    {Number(selectedOrder.discount) > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Réduction:</span>
                        <span>-{formatPrice(Number(selectedOrder.discount))} FCFA</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Livraison:</span>
                      <span>{formatPrice(Number(selectedOrder.shipping))} FCFA</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>{formatPrice(Number(selectedOrder.total))} FCFA</span>
                    </div>
                    {selectedOrder.paymentMethod && (
                      <div className="mt-2">
                        <span className="font-medium">Méthode de paiement:</span> {selectedOrder.paymentMethod}
                      </div>
                    )}
                    {selectedOrder.notes && (
                      <div className="mt-2 p-3 bg-muted rounded-lg">
                        <span className="font-medium">Notes:</span> {selectedOrder.notes}
                      </div>
                    )}

                    {selectedOrder.deliveryId && (
                      <div className="mt-4 p-4 bg-primary/5 border border-primary/10 rounded-lg space-y-2">
                        <div className="flex items-center gap-2 font-semibold text-primary">
                          <Truck className="w-5 h-5" />
                          <span>Informations de livraison</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground font-medium">ID Livraison:</span>
                            <div className="font-mono">{selectedOrder.deliveryId}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground font-medium">Statut:</span>
                            <div>
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                {selectedOrder.deliveryStatus}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Status Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Historique & statut</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {selectedOrderEvents.length === 0 ? (
                        <div className="text-sm text-muted-foreground">Aucun événement enregistré pour cette commande.</div>
                      ) : (
                        selectedOrderEvents
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map((event) => (
                            <div key={event.id} className="border border-border rounded-lg p-3">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium">{event.type}</span>
                                <span className="text-muted-foreground">{formatDate(event.createdAt)}</span>
                              </div>
                              <div className="text-sm mt-1 text-muted-foreground space-y-1">
                                {event.status && <div>Statut: {event.status}</div>}
                                {event.paymentStatus && <div>Paiement: {event.paymentStatus}</div>}
                                {event.note && <div>Note: {event.note}</div>}
                              </div>
                            </div>
                          ))
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Statut de la commande</label>
                      <div className="flex flex-wrap gap-2">
                        {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                          <Button
                            key={status}
                            variant={selectedOrder.status === status ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleUpdateStatus(selectedOrder.id, status)}
                          >
                            {status}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Statut du paiement</label>
                      <div className="flex flex-wrap gap-2">
                        {['pending', 'paid', 'failed', 'refunded'].map((status) => (
                          <Button
                            key={status}
                            variant={selectedOrder.paymentStatus === status ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleUpdateStatus(selectedOrder.id, selectedOrder.status, status)}
                          >
                            {status}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
}
