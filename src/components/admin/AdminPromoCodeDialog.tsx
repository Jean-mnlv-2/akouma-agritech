import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface PromoCode {
  id?: number;
  code: string;
  description?: string | null;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  maxUses?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
  isActive: boolean;
  ownerEmail?: string | null;
  ownerName?: string | null;
  cashbackPercent?: number;
  cashbackBalance?: number;
  totalCashbackEarned?: number;
}

interface AdminPromoCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promo?: PromoCode | null;
  onSave: (data: Partial<PromoCode>) => void;
}

const defaultFormData: Partial<PromoCode> = {
  code: '',
  description: '',
  discountType: 'PERCENTAGE',
  discountValue: 0,
  maxUses: null,
  validFrom: null,
  validUntil: null,
  isActive: true,
  ownerEmail: '',
  ownerName: '',
  cashbackPercent: 0,
};

export function AdminPromoCodeDialog({ open, onOpenChange, promo, onSave }: AdminPromoCodeDialogProps) {
  const [formData, setFormData] = useState<Partial<PromoCode>>(defaultFormData);

  useEffect(() => {
    if (!open) return;
    if (promo) {
      setFormData({
        code: promo.code,
        description: promo.description || '',
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        maxUses: promo.maxUses,
        validFrom: promo.validFrom,
        validUntil: promo.validUntil,
        isActive: promo.isActive,
        ownerEmail: promo.ownerEmail || '',
        ownerName: promo.ownerName || '',
        cashbackPercent: Number(promo.cashbackPercent) || 0,
      });
    } else {
      setFormData({ ...defaultFormData });
    }
  }, [open, promo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const formatPrice = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{promo ? 'Modifier le Code Promo' : 'Créer un Code Promo'}</DialogTitle>
            <DialogDescription>
              Configurez les détails de la réduction, les conditions d'utilisation et le système d'affiliation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().trim() })}
                className="col-span-3"
                placeholder="PROMO2024"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="col-span-3"
                placeholder="Réduction de bienvenue..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Type</Label>
              <Select
                value={formData.discountType}
                onValueChange={(value: 'PERCENTAGE' | 'FIXED') => setFormData({ ...formData, discountType: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Type de réduction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Pourcentage (%)</SelectItem>
                  <SelectItem value="FIXED">Montant Fixe (FCFA)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="value" className="text-right">Valeur</Label>
              <Input
                id="value"
                type="number"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                className="col-span-3"
                required
                min={0}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="maxUses" className="text-right">Max Utilisations</Label>
              <Input
                id="maxUses"
                type="number"
                value={formData.maxUses || ''}
                onChange={(e) => setFormData({ ...formData, maxUses: e.target.value ? Number(e.target.value) : null })}
                className="col-span-3"
                placeholder="Illimité si vide"
              />
            </div>
            
            {/* Date fields */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Valide du</Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.validFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.validFrom ? format(new Date(formData.validFrom), 'PP', { locale: fr }) : <span>Choisir une date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.validFrom ? new Date(formData.validFrom) : undefined}
                      onSelect={(date) => setFormData({ ...formData, validFrom: date?.toISOString() || null })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Jusqu'au</Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.validUntil && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.validUntil ? format(new Date(formData.validUntil), 'PP', { locale: fr }) : <span>Choisir une date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.validUntil ? new Date(formData.validUntil) : undefined}
                      onSelect={(date) => setFormData({ ...formData, validUntil: date?.toISOString() || null })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Affiliate Section */}
            <div className="col-span-full border-t pt-4 mt-2">
              <h4 className="text-sm font-semibold text-foreground mb-3">🤝 Programme d'affiliation (optionnel)</h4>
              <p className="text-xs text-muted-foreground mb-4">
                Le propriétaire du code reçoit un pourcentage en cashback à chaque utilisation de son code. Ce solde est utilisable comme réduction lors de ses propres achats.
              </p>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ownerName" className="text-right text-sm">Nom affilié</Label>
              <Input
                id="ownerName"
                value={formData.ownerName || ''}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="col-span-3"
                placeholder="Nom du propriétaire du code"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ownerEmail" className="text-right text-sm">Email affilié</Label>
              <Input
                id="ownerEmail"
                type="email"
                value={formData.ownerEmail || ''}
                onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                className="col-span-3"
                placeholder="email@exemple.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cashbackPercent" className="text-right text-sm">Cashback %</Label>
              <Input
                id="cashbackPercent"
                type="number"
                value={formData.cashbackPercent || 0}
                onChange={(e) => setFormData({ ...formData, cashbackPercent: Number(e.target.value) })}
                className="col-span-3"
                placeholder="Ex: 5 pour 5%"
                min={0}
                max={50}
                step={0.5}
              />
            </div>

            {promo && (Number(promo.cashbackBalance) > 0 || Number(promo.totalCashbackEarned) > 0) && (
              <div className="col-span-full bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                <p className="text-muted-foreground">
                  💰 Cashback cumulé : <strong className="text-foreground">{formatPrice(Number(promo.totalCashbackEarned))} FCFA</strong>
                </p>
                <p className="text-muted-foreground">
                  🏦 Solde disponible : <strong className="text-primary">{formatPrice(Number(promo.cashbackBalance))} FCFA</strong>
                </p>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="active" className="text-right">Actif</Label>
              <div className="col-span-3">
                <Switch
                  id="active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit">Enregistrer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
