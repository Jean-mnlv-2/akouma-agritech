import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Loader2, RefreshCw, ShieldAlert } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/integrations/api/client';

type ProductType = 'Herbicide' | 'Fongicide' | 'Insecticide' | 'Acaricide' | 'Nématicide' | 'Régulateur de croissance' | 'Autre';
type RegulatoryStatus = 'homologué' | 'restreint' | 'en évaluation' | 'retiré';
type Tier = 'standard' | 'premium';

const PRODUCT_TYPES: ProductType[] = ['Herbicide', 'Fongicide', 'Insecticide', 'Acaricide', 'Nématicide', 'Régulateur de croissance', 'Autre'];
const REGULATORY_STATUSES: RegulatoryStatus[] = ['homologué', 'restreint', 'en évaluation', 'retiré'];

interface SourceEntry {
  name: string;
  url?: string;
}

interface PhytoProduct {
  id: string;
  activeIngredient: string;
  productType: ProductType;
  targetCrops: string[];
  targetPests: string[];
  description: string;
  dosage?: string | null;
  applicationMethod?: string | null;
  preHarvestInterval?: string | null;
  safetyPrecautions?: string | null;
  regulatoryStatus: RegulatoryStatus;
  commercialName?: string | null;
  tier: Tier;
  sources?: SourceEntry[] | null;
  region?: string | null;
  isActive: boolean;
  isIndexed: boolean;
  createdAt: string;
}

const EMPTY_FORM = {
  activeIngredient: '',
  productType: 'Herbicide' as ProductType,
  targetCrops: '',
  targetPests: '',
  description: '',
  dosage: '',
  applicationMethod: '',
  preHarvestInterval: '',
  safetyPrecautions: '',
  regulatoryStatus: 'homologué' as RegulatoryStatus,
  commercialName: '',
  tier: 'standard' as Tier,
  region: '',
  sourcesText: '',
  isActive: true,
};

// "Nom | URL" (une par ligne) <-> [{ name, url? }] — voir AdminDocuments.tsx
// pour la même convention.
function sourcesToText(sources?: SourceEntry[] | null): string {
  return (sources || []).map((s) => (s.url ? `${s.name} | ${s.url}` : s.name)).join('\n');
}
function textToSources(text: string): SourceEntry[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, url] = line.split('|').map((p) => p.trim());
      return url ? { name, url } : { name };
    });
}

const REGULATORY_BADGE_VARIANT: Record<RegulatoryStatus, 'default' | 'destructive' | 'secondary' | 'outline'> = {
  'homologué': 'default',
  'restreint': 'secondary',
  'en évaluation': 'outline',
  'retiré': 'destructive',
};

export function AdminPhytosanitaryProducts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PhytoProduct | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: products = [], isLoading } = useQuery<PhytoProduct[]>({
    queryKey: ['admin', 'phytosanitary-products'],
    queryFn: async () => {
      const res = await api.request('GET', '/api/admin/phytosanitary-products');
      return res.data || [];
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (product: PhytoProduct) => {
    setEditing(product);
    setForm({
      activeIngredient: product.activeIngredient,
      productType: product.productType,
      targetCrops: product.targetCrops.join(', '),
      targetPests: product.targetPests.join(', '),
      description: product.description,
      dosage: product.dosage || '',
      applicationMethod: product.applicationMethod || '',
      preHarvestInterval: product.preHarvestInterval || '',
      safetyPrecautions: product.safetyPrecautions || '',
      regulatoryStatus: product.regulatoryStatus,
      commercialName: product.commercialName || '',
      tier: product.tier,
      region: product.region || '',
      sourcesText: sourcesToText(product.sources),
      isActive: product.isActive,
    });
    setDialogOpen(true);
  };

  const buildPayload = () => ({
    activeIngredient: form.activeIngredient.trim(),
    productType: form.productType,
    targetCrops: form.targetCrops.split(',').map((s) => s.trim()).filter(Boolean),
    targetPests: form.targetPests.split(',').map((s) => s.trim()).filter(Boolean),
    description: form.description.trim(),
    dosage: form.dosage.trim() || null,
    applicationMethod: form.applicationMethod.trim() || null,
    preHarvestInterval: form.preHarvestInterval.trim() || null,
    safetyPrecautions: form.safetyPrecautions.trim() || null,
    regulatoryStatus: form.regulatoryStatus,
    commercialName: form.commercialName.trim() || null,
    tier: form.tier,
    region: form.region.trim() || null,
    sources: textToSources(form.sourcesText),
    isActive: form.isActive,
  });

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload = buildPayload();
      if (editing) return api.request('PUT', `/api/admin/phytosanitary-products/${editing.id}`, { body: payload });
      return api.request('POST', '/api/admin/phytosanitary-products', { body: payload });
    },
    onSuccess: () => {
      toast({ title: 'Succès', description: `Produit ${editing ? 'modifié' : 'créé'}. Pense à l'indexer pour l'assistant.` });
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'phytosanitary-products'] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : `Impossible de ${editing ? 'modifier' : 'créer'} le produit`;
      toast({ title: 'Erreur', description: message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.request('DELETE', `/api/admin/phytosanitary-products/${id}`),
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Produit supprimé' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'phytosanitary-products'] });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de supprimer le produit', variant: 'destructive' });
    },
  });

  const indexMutation = useMutation({
    mutationFn: async (id: string) => api.request('POST', `/api/admin/phytosanitary-products/${id}/index`),
    onSuccess: () => {
      toast({ title: 'Indexé', description: "Le produit est maintenant disponible pour l'assistant (sous réserve de correspondance exacte)." });
      queryClient.invalidateQueries({ queryKey: ['admin', 'phytosanitary-products'] });
    },
    onError: () => {
      toast({ title: 'Erreur', description: "Échec de l'indexation", variant: 'destructive' });
    },
  });

  const handleDelete = (id: string) => {
    if (!confirm('Supprimer ce produit phytosanitaire ? Il sera aussi retiré de la base de connaissances RAG.')) return;
    deleteMutation.mutate(id);
  };

  const canSubmit = form.activeIngredient.trim() && form.description.trim().length >= 10 && form.targetCrops.trim() && form.targetPests.trim();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle>Produits phytosanitaires</CardTitle>
            <CardDescription className="max-w-2xl">
              Base structurée dédiée à la protection des cultures. Caractérisez précisément la <strong>matière
              active</strong>, les cultures et ravageurs/maladies ciblés : l'assistant IA ne recommande un
              produit — nom commercial inclus — que si la question d'un utilisateur correspond exactement à
              ces critères. En l'absence de correspondance exacte, il ne cite jamais un nom de marque et se
              limite à un conseil général par matière active.
            </CardDescription>
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau produit
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Matière active</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Cultures ciblées</TableHead>
              <TableHead>Région</TableHead>
              <TableHead>Sources</TableHead>
              <TableHead>Statut réglementaire</TableHead>
              <TableHead>Palier</TableHead>
              <TableHead>Indexé</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => openEdit(product)}>
                <TableCell className="font-medium">{product.activeIngredient}</TableCell>
                <TableCell><Badge variant="outline">{product.productType}</Badge></TableCell>
                <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{product.targetCrops.join(', ')}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{product.region || '—'}</TableCell>
                <TableCell>
                  {product.sources && product.sources.length > 0 ? (
                    <Badge variant="outline" title={product.sources.map((s) => s.name).join(', ')}>{product.sources.length}</Badge>
                  ) : (
                    <Badge variant="destructive" title="Aucune source citée">0</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={REGULATORY_BADGE_VARIANT[product.regulatoryStatus]}>{product.regulatoryStatus}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={product.tier === 'premium' ? 'default' : 'outline'}>{product.tier === 'premium' ? 'Premium' : 'Standard'}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={product.isIndexed ? 'default' : 'outline'}>{product.isIndexed ? 'Oui' : 'Non'}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); indexMutation.mutate(product.id); }} disabled={indexMutation.isPending} title="Indexer">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(product); }} title="Modifier">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }} title="Supprimer">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {products.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Aucun produit phytosanitaire enregistré.</p>
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier le produit' : 'Nouveau produit phytosanitaire'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 flex gap-2 text-sm">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <p className="text-muted-foreground">
                Renseignez les cultures et ravageurs/maladies ciblés le plus précisément possible : c'est sur
                cette base que l'assistant décide s'il peut recommander ce produit ou non pour une question
                donnée. Une caractérisation vague = ce produit ne sera jamais recommandé.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="phy-active">Matière active</Label>
                <Input id="phy-active" value={form.activeIngredient} onChange={(e) => setForm({ ...form, activeIngredient: e.target.value })} placeholder="Ex : mancozèbe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phy-type">Type de produit</Label>
                <Select value={form.productType} onValueChange={(v: ProductType) => setForm({ ...form, productType: v })}>
                  <SelectTrigger id="phy-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phy-crops">Cultures ciblées (séparées par des virgules)</Label>
              <Input id="phy-crops" value={form.targetCrops} onChange={(e) => setForm({ ...form, targetCrops: e.target.value })} placeholder="Ex : Cacao, Maïs" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phy-pests">Ravageurs / maladies / adventices ciblés (séparés par des virgules)</Label>
              <Input id="phy-pests" value={form.targetPests} onChange={(e) => setForm({ ...form, targetPests: e.target.value })} placeholder="Ex : Mirides, Pourriture brune" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phy-description">Description / mode d'action</Label>
              <Textarea id="phy-description" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="phy-dosage">Dosage recommandé</Label>
                <Input id="phy-dosage" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phy-method">Méthode d'application</Label>
                <Input id="phy-method" value={form.applicationMethod} onChange={(e) => setForm({ ...form, applicationMethod: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="phy-dar">Délai avant récolte (DAR)</Label>
                <Input id="phy-dar" value={form.preHarvestInterval} onChange={(e) => setForm({ ...form, preHarvestInterval: e.target.value })} placeholder="Ex : 14 jours" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phy-status">Statut réglementaire</Label>
                <Select value={form.regulatoryStatus} onValueChange={(v: RegulatoryStatus) => setForm({ ...form, regulatoryStatus: v })}>
                  <SelectTrigger id="phy-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REGULATORY_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phy-safety">Précautions de sécurité</Label>
              <Textarea id="phy-safety" rows={2} value={form.safetyPrecautions} onChange={(e) => setForm({ ...form, safetyPrecautions: e.target.value })} placeholder="EPI requis, délai de réentrée..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phy-region">Portée géographique</Label>
              <Input id="phy-region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="ex: Afrique, Cameroun, Afrique de l'Ouest..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phy-sources">Sources (une par ligne, format "Nom | URL")</Label>
              <Textarea
                id="phy-sources"
                rows={3}
                value={form.sourcesText}
                onChange={(e) => setForm({ ...form, sourcesText: e.target.value })}
                placeholder={'IRAD Cameroun | https://irad-cameroun.cm\nCORAF'}
              />
              <p className="text-xs text-muted-foreground">
                Centres de recherche/institutions dont provient cette caractérisation — essentiel pour du
                contenu réglementaire/sécurité, en particulier pour un brouillon rédigé par DeerFlow.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phy-tier">Palier d'accès (RAG Agriconsulting)</Label>
              <Select value={form.tier} onValueChange={(v: Tier) => setForm({ ...form, tier: v })}>
                <SelectTrigger id="phy-tier"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="phy-commercial">Nom commercial</Label>
              <Input id="phy-commercial" value={form.commercialName} onChange={(e) => setForm({ ...form, commercialName: e.target.value })} placeholder="Ex : nom de marque du produit" />
              <p className="text-xs text-muted-foreground">
                L'assistant IA ne cite ce nom que lorsque ce produit correspond exactement à la culture et au
                problème décrits par l'utilisateur. En l'absence de correspondance exacte, il n'est jamais
                mentionné — l'assistant se limite alors à la matière active en général.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Switch id="phy-active-switch" checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              <Label htmlFor="phy-active-switch">Actif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={() => upsertMutation.mutate()} disabled={!canSubmit || upsertMutation.isPending}>
              {upsertMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editing ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
