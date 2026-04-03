import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Loader2, RefreshCw, Tag } from 'lucide-react';
import { api } from '@/integrations/api/client';
import { AdminPromoCodeDialog } from './AdminPromoCodeDialog';
import AdminDetailsDialog from './AdminDetailsDialog';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PromoCode {
  id: number;
  code: string;
  description?: string | null;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  maxUses?: number | null;
  usesCount: number;
  validFrom?: string | null;
  validUntil?: string | null;
  isActive: boolean;
  createdAt: string;
  ownerEmail?: string | null;
  ownerName?: string | null;
  cashbackPercent?: number;
  cashbackBalance?: number;
  totalCashbackEarned?: number;
}

export function AdminPromoCodes() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [viewingPromo, setViewingPromo] = useState<PromoCode | null>(null);
  const { toast } = useToast();

  const fetchPromoCodes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.promoCodes.list();
      setPromoCodes(res.data || []);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les codes promo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPromoCodes();
  }, [fetchPromoCodes]);

  const handleCreate = () => {
    setEditingPromo(null);
    setDialogOpen(true);
  };

  const handleEdit = (promo: PromoCode) => {
    setEditingPromo(promo);
    setDialogOpen(true);
  };

  const handleToggle = async (id: number, currentActive: boolean) => {
    try {
      await api.promoCodes.toggle(id, !currentActive);
      toast({ title: "Succès", description: `Code promo ${!currentActive ? 'activé' : 'désactivé'}` });
      fetchPromoCodes();
    } catch (error) {
      toast({ title: "Erreur", description: "Action échouée", variant: "destructive" });
    }
  };

  const handleSave = async (data: Partial<PromoCode>) => {
    try {
      if (editingPromo) {
        await api.promoCodes.update(editingPromo.id, data);
        toast({ title: "Succès", description: "Code promo mis à jour" });
      } else {
        await api.promoCodes.create(data);
        toast({ title: "Succès", description: "Code promo créé" });
      }
      setDialogOpen(false);
      fetchPromoCodes();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Enregistrement échoué";
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      });
    }
  };

  const formatDiscount = (type: 'PERCENTAGE' | 'FIXED', value: number) => {
    if (type === 'PERCENTAGE') return `${value}%`;
    return `${new Intl.NumberFormat('fr-FR').format(value)} FCFA`;
  };

  if (loading && promoCodes.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Codes Promo</h2>
          <p className="text-muted-foreground">Gérez les réductions et offres promotionnelles.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchPromoCodes} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Code
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Réduction</TableHead>
                <TableHead>Utilisations</TableHead>
                <TableHead>Affilié</TableHead>
                <TableHead>Cashback</TableHead>
                <TableHead>Validité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promoCodes.map((promo) => (
                <TableRow 
                  key={promo.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    setViewingPromo(promo);
                    setIsDetailsOpen(true);
                  }}
                >
                  <TableCell className="font-bold">
                    <div className="flex items-center">
                      <Tag className="w-4 h-4 mr-2 text-primary" />
                      {promo.code}
                    </div>
                  </TableCell>
                  <TableCell>{formatDiscount(promo.discountType, promo.discountValue)}</TableCell>
                  <TableCell>
                    <span className="font-medium">{promo.usesCount}</span>
                    {promo.maxUses ? <span className="text-muted-foreground"> / {promo.maxUses}</span> : <span className="text-muted-foreground text-xs ml-1">(Illimité)</span>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {promo.ownerName || promo.ownerEmail ? (
                      <span className="text-foreground">{promo.ownerName || promo.ownerEmail}</span>
                    ) : (
                      <span className="text-muted-foreground italic">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {Number(promo.cashbackPercent) > 0 ? (
                      <div>
                        <span className="font-medium text-primary">{new Intl.NumberFormat('fr-FR').format(Math.round(Number(promo.cashbackBalance)))} FCFA</span>
                        <span className="text-muted-foreground text-xs block">{promo.cashbackPercent}%</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {promo.validUntil ? (
                      <span className={cn(new Date(promo.validUntil) < new Date() ? "text-destructive font-medium" : "")}>
                        jusqu'au {format(new Date(promo.validUntil), 'dd/MM/yyyy')}
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">Pas d'expiration</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={promo.isActive ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(promo.id, promo.isActive);
                      }}
                    >
                      {promo.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(promo);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {promoCodes.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    Aucun code promo trouvé. Cliquez sur "Nouveau Code" pour commencer.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AdminPromoCodeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        promo={editingPromo}
        onSave={handleSave}
      />

      <AdminDetailsDialog
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={viewingPromo?.code || ''}
        data={viewingPromo as any}
        type="promo-code"
      />
    </div>
  );
}
