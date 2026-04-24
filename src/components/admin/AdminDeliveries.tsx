import React, { useState, useEffect, useCallback } from 'react';
import { 
  Truck, 
  Search, 
  Filter, 
  User, 
  MapPin, 
  Clock, 
  ChevronRight,
  Loader2,
  ExternalLink,
  RefreshCw,
  ChevronLeft
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface Delivery {
  id: string;
  status: string;
  distanceKm: number;
  etaMinutes: number;
  livreur?: {
    id: string;
    name: string;
  };
  pickAddress: {
    street: string;
  };
  dropAddress: {
    street: string;
  };
  commande: {
    id: string;
    totalAmount: number;
    isPaid: boolean;
    client: {
      firstName: string;
      phone: string;
    };
  };
  statusHistory: {
    oldStatus: string;
    newStatus: string;
    changedAt: string;
  }[];
}

interface Livreur {
  id: string;
  name: string;
  availability: string;
}

type DeliveriesResponse = {
  data?: unknown;
  pagination?: {
    page?: number;
    total?: number;
    pages?: number;
  };
  error?: string;
};

const DEFAULT_PAGINATION = { page: 1, total: 0, pages: 1 };

const getErrorMessage = (payload: unknown, fallback: string) => {
  if (payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string') {
    return payload.error;
  }

  return fallback;
};

export const AdminDeliveries: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedLivreurId, setSelectedLivreurId] = useState<string>('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const { toast } = useToast();

  const fetchDeliveries = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: '10',
      });
      if (statusFilter !== 'all') queryParams.append('status', statusFilter);

      const response = await fetch(`/api/deliveries?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json().catch(() => null) as DeliveriesResponse | null;

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Impossible de charger les livraisons."));
      }

      const nextDeliveries = Array.isArray(data?.data) ? data.data as Delivery[] : [];
      const nextPagination = data?.pagination ?? DEFAULT_PAGINATION;

      setDeliveries(nextDeliveries);
      setPagination({
        page: typeof nextPagination.page === 'number' ? nextPagination.page : page,
        total: typeof nextPagination.total === 'number' ? nextPagination.total : nextDeliveries.length,
        pages: typeof nextPagination.pages === 'number' ? nextPagination.pages : 1,
      });
    } catch (err) {
      console.error('Error fetching deliveries:', err);
      setDeliveries([]);
      setPagination(DEFAULT_PAGINATION);
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible de charger les livraisons.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, toast]);

  const fetchLivreurs = useCallback(async () => {
    try {
      const response = await fetch('/api/deliveries/livreurs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json().catch(() => null) as DeliveriesResponse | null;

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Impossible de charger les livreurs."));
      }

      setLivreurs(Array.isArray(data?.data) ? data.data as Livreur[] : []);
    } catch (err) {
      console.error('Error fetching livreurs:', err);
      setLivreurs([]);
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible de charger les livreurs.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchDeliveries();
    fetchLivreurs();
  }, [fetchDeliveries, fetchLivreurs]);

  const handleAssignLivreur = async () => {
    if (!selectedDelivery || !selectedLivreurId) return;

    try {
      const response = await fetch('/api/deliveries/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          livraisonId: selectedDelivery.id,
          livreurId: selectedLivreurId,
        }),
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Livreur assigné avec succès.",
        });
        setIsAssignDialogOpen(false);
        fetchDeliveries(pagination.page);
      } else {
        throw new Error('Assignment failed');
      }
    } catch (err) {
      console.error('Error assigning livreur:', err);
      toast({
        title: "Erreur",
        description: "Échec de l'assignation du livreur.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ATTENTE_PAIEMENT':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">En attente paiement</Badge>;
      case 'PAYE':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Payé</Badge>;
      case 'EN_COURS':
        return <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-200 text-nowrap">En cours</Badge>;
      case 'LIVRE':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Livré</Badge>;
      case 'ANNULE':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Annulé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredDeliveries = deliveries.filter((delivery) => {
    const normalizedSearch = searchTerm.toLowerCase();
    const deliveryId = delivery.id?.toLowerCase() ?? '';
    const clientName = delivery.commande?.client?.firstName?.toLowerCase() ?? '';

    return deliveryId.includes(normalizedSearch) || clientName.includes(normalizedSearch);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestion des Livraisons</h2>
          <p className="text-muted-foreground">Suivez et gérez les expéditions en temps réel.</p>
        </div>
        <Button onClick={() => fetchDeliveries(pagination.page)} variant="outline" className="w-fit">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher par ID ou client..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="ATTENTE_PAIEMENT">En attente paiement</SelectItem>
                  <SelectItem value="PAYE">Payé</SelectItem>
                  <SelectItem value="EN_COURS">En cours</SelectItem>
                  <SelectItem value="LIVRE">Livré</SelectItem>
                  <SelectItem value="ANNULE">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Livraison</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Livreur</TableHead>
                    <TableHead>ETA</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeliveries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        Aucune livraison trouvée.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDeliveries.map((delivery) => (
                      <TableRow key={delivery.id}>
                        <TableCell className="font-medium text-xs">
                          {delivery.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{delivery.commande.client.firstName}</span>
                            <span className="text-xs text-muted-foreground">{delivery.commande.client.phone}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          <div className="flex items-center gap-1 text-xs">
                            <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                            {delivery.dropAddress.street}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(delivery.status)}</TableCell>
                        <TableCell>
                          {delivery.livreur ? (
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm">{delivery.livreur.name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Non assigné</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            {delivery.etaMinutes} min
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setSelectedDelivery(delivery);
                                setSelectedLivreurId('');
                                setIsAssignDialogOpen(true);
                              }}
                              disabled={delivery.status === 'LIVRE' || delivery.status === 'ANNULE'}
                            >
                              <Truck className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedDelivery(delivery)}>
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} sur {pagination.pages}
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchDeliveries(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Précédent
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => fetchDeliveries(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                >
                  Suivant <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigner un livreur</DialogTitle>
            <DialogDescription>
              Choisissez un livreur disponible pour cette livraison.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Livreur disponible</label>
              <Select value={selectedLivreurId} onValueChange={setSelectedLivreurId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un livreur" />
                </SelectTrigger>
                <SelectContent>
                  {livreurs.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">Aucun livreur disponible</div>
                  ) : (
                    livreurs.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleAssignLivreur} disabled={!selectedLivreurId}>Confirmer l'assignation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
