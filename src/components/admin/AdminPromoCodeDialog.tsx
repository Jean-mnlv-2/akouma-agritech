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
      });
    } else {
      setFormData({ ...defaultFormData });
    }
  }, [open, promo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{promo ? 'Modifier le Code Promo' : 'Créer un Code Promo'}</DialogTitle>
            <DialogDescription>
              Configurez les détails de la réduction et les conditions d'utilisation.
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
