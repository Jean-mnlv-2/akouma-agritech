import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CalendarClock, CheckCircle, Loader2, Plus, Power, RefreshCcw } from 'lucide-react';

interface PromoCodeDto {
  id: number;
  code: string;
  description?: string | null;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  maxUses?: number | null;
  usesCount: number;
  isActive: boolean;
  validFrom?: string | null;
  validUntil?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PromoFormState {
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: string;
  maxUses: string;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

const defaultForm: PromoFormState = {
  code: '',
  description: '',
  discountType: 'PERCENTAGE',
  discountValue: '10',
  maxUses: '',
  validFrom: '',
  validUntil: '',
  isActive: true,
};

export const AdminPromoCodes = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCodeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCodeDto | null>(null);
  const [formState, setFormState] = useState<PromoFormState>(defaultForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadPromoCodes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/promo-codes', { credentials: 'include' });
      if (!res.ok) throw new Error('Impossible de charger les codes promo');
      const body = await res.json();
      setPromoCodes(Array.isArray(body.data) ? body.data : []);
    } catch (error) {
      console.error('Promo code load error:', error);
      toast({ title: 'Erreur', description: "Impossible de charger les codes promotionnels", variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPromoCodes();
  }, [loadPromoCodes]);

  const openCreateDialog = () => {
    setEditingPromo(null);
    setFormState(defaultForm);
    setDialogOpen(true);
  };

  const openEditDialog = (promo: PromoCodeDto) => {
    setEditingPromo(promo);
    setFormState({
      code: promo.code,
      description: promo.description ?? '',
      discountType: promo.discountType,
      discountValue: String(promo.discountType === 'PERCENTAGE' ? promo.discountValue : promo.discountValue),
      maxUses: promo.maxUses != null ? String(promo.maxUses) : '',
      validFrom: promo.validFrom ? promo.validFrom.slice(0, 10) : '',
      validUntil: promo.validUntil ? promo.validUntil.slice(0, 10) : '',
      isActive: promo.isActive,
    });
    setDialogOpen(true);
  };

  const handleChange = (field: keyof PromoFormState, value: string | boolean) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        code: formState.code.trim().toUpperCase(),
        description: formState.description.trim() || null,
        discountType: formState.discountType,
        discountValue: Number(formState.discountValue),
        maxUses: formState.maxUses ? Number(formState.maxUses) : null,
        validFrom: formState.validFrom ? `${formState.validFrom}T00:00:00.000Z` : null,
        validUntil: formState.validUntil ? `${formState.validUntil}T23:59:59.999Z` : null,
        isActive: formState.isActive,
      };

      const endpoint = editingPromo ? `/api/promo-codes/${editingPromo.id}` : '/api/promo-codes';
      const method = editingPromo ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || 'Impossible de sauvegarder le code promo');
      }

      toast({ title: editingPromo ? 'Code promo mis à jour' : 'Code promo créé', description: payload.code });
      setDialogOpen(false);
      loadPromoCodes();
    } catch (error: any) {
      console.error('Promo code save error:', error);
      toast({ title: 'Erreur', description: error.message || 'Impossible de sauvegarder le code promo', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (promo: PromoCodeDto) => {
    try {
      const res = await fetch(`/api/promo-codes/${promo.id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !promo.isActive }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || 'Impossible de changer le statut');
      toast({ title: 'Statut mis à jour', description: `Code ${promo.code} ${promo.isActive ? 'désactivé' : 'activé'}` });
      loadPromoCodes();
    } catch (error: any) {
      console.error('Promo toggle error:', error);
      toast({ title: 'Erreur', description: error.message || 'Impossible de mettre à jour le statut', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Codes promotionnels</CardTitle>
          <CardDescription>Gestion des réductions appliquées au panier</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <CardTitle>Codes promotionnels</CardTitle>
          <CardDescription>Créez et gérez les promotions appliquées au panier</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadPromoCodes}>
            <RefreshCcw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau code
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {promoCodes.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            Aucun code promo pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Réduction</TableHead>
                  <TableHead>Utilisations</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoCodes.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell className="font-semibold">{promo.code}</TableCell>
                    <TableCell>
                      {promo.discountType === 'PERCENTAGE'
                        ? `${promo.discountValue}%`
                        : `${promo.discountValue.toLocaleString('fr-FR')} FCFA`}
                      {promo.description && (
                        <div className="text-xs text-muted-foreground mt-1">{promo.description}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{promo.usesCount}{promo.maxUses ? ` / ${promo.maxUses}` : ''}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {promo.validFrom ? `du ${new Date(promo.validFrom).toLocaleDateString('fr-FR')}` : 'Dès maintenant'}
                      <br />
                      {promo.validUntil ? `au ${new Date(promo.validUntil).toLocaleDateString('fr-FR')}` : 'Sans limite'}
                    </TableCell>
                    <TableCell>
                      {promo.isActive ? (
                        <Badge className="bg-green-500 text-white flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Actif</Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1"><Power className="w-3 h-3" /> Inactif</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(promo)}>Modifier</Button>
                      <Button variant="outline" size="sm" onClick={() => handleToggle(promo)}>
                        {promo.isActive ? 'Désactiver' : 'Activer'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPromo ? 'Modifier le code promo' : 'Créer un code promo'}</DialogTitle>
            <DialogDescription>
              Définissez la réduction accordée aux clients à l’étape panier / paiement.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input value={formState.code} onChange={(e) => handleChange('code', e.target.value)} placeholder="PROMO2025" required />
              </div>
              <div className="space-y-2">
                <Label>Type de réduction</Label>
                <Select value={formState.discountType} onValueChange={(value: 'PERCENTAGE' | 'FIXED') => handleChange('discountType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Pourcentage (%)</SelectItem>
                    <SelectItem value="FIXED">Montant fixe (FCFA)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valeur de réduction *</Label>
                <Input type="number" min="0" step="0.01" value={formState.discountValue} onChange={(e) => handleChange('discountValue', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Utilisations max.</Label>
                <Input type="number" min="0" value={formState.maxUses} onChange={(e) => handleChange('maxUses', e.target.value)} placeholder="Illimité" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={formState.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Réduction spéciale printemps" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Période début</Label>
                <div className="flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-muted-foreground" />
                  <Input type="date" value={formState.validFrom} onChange={(e) => handleChange('validFrom', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Période fin</Label>
                <div className="flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-muted-foreground" />
                  <Input type="date" value={formState.validUntil} onChange={(e) => handleChange('validUntil', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Code actif</Label>
              <input
                id="isActive"
                type="checkbox"
                checked={formState.isActive}
                onChange={(e) => handleChange('isActive', e.target.checked)}
                className="h-4 w-4"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)} disabled={saving}>Annuler</Button>
              <Button type="button" onClick={handleSave} disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
