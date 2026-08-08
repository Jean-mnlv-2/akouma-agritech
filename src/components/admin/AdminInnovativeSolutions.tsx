import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/integrations/api/client';
import { slugify } from '@/lib/utils';

type DonationImpactOption = { id: number; title: string; icon?: string };

type InnovativeSolutionRow = {
  id: number;
  slug: string;
  title: string;
  description: string;
  icon?: string;
  features?: string[];
  order?: number;
  isActive?: boolean;
  donationImpactId?: number | null;
  donationImpact?: { id: number; slug: string; isActive: boolean } | null;
};

// Noms d'icônes Lucide reconnus par le mapping ICONS du site public
// (voir src/components/Services.tsx) — toute autre valeur retombe sur une
// icône de repli côté vitrine, mais le champ reste un texte libre pour ne
// pas dépendre d'une liste figée ici.
const SUGGESTED_ICONS = ['Droplets', 'BoxSelect', 'ScanSearch', 'Leaf', 'Cpu', 'Smartphone', 'Zap', 'CloudRain', 'BarChart3', 'Sprout', 'Bug', 'Microscope'];

export function AdminInnovativeSolutions() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<InnovativeSolutionRow | null>(null);
  const [form, setForm] = useState<Partial<InnovativeSolutionRow> & { featuresText?: string }>({ isActive: true, order: 0, featuresText: '' });
  const queryClient = useQueryClient();

  const { data: solutions = [] } = useQuery<InnovativeSolutionRow[]>({
    queryKey: ['admin', 'innovative-solutions'],
    queryFn: async () => {
      const res = await api.request('GET', '/api/innovative_solutions/admin');
      const list = (Array.isArray(res) ? res : res.data) as InnovativeSolutionRow[];
      return (list || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const { data: causes = [] } = useQuery<DonationImpactOption[]>({
    queryKey: ['admin', 'donation-impacts', 'options'],
    queryFn: async () => {
      const res = await api.request('GET', '/api/donation_impacts');
      const list = (Array.isArray(res) ? res : res.data) as DonationImpactOption[];
      return list || [];
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const resetForm = () => { setEditing(null); setForm({ isActive: true, order: 0, featuresText: '' }); };
  const onEdit = (row: InnovativeSolutionRow) => {
    setEditing(row);
    setForm({ ...row, donationImpactId: row.donationImpactId ?? row.donationImpact?.id ?? undefined, featuresText: (row.features || []).join('\n') });
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.request('DELETE', `/api/innovative_solutions/${id}`),
    onSuccess: () => {
      toast({ title: 'Supprimé', description: 'Projet supprimé.' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'innovative-solutions'] });
    },
    onError: (e: unknown) => {
      console.error(e);
      toast({ title: 'Erreur', description: 'Suppression échouée', variant: 'destructive' });
    }
  });
  const onDelete = (row: InnovativeSolutionRow) => {
    if (!confirm(`Supprimer le projet "${row.title}" ?`)) return;
    setLoading(true);
    deleteMutation.mutate(row.id, { onSettled: () => setLoading(false) });
  };

  const upsertMutation = useMutation({
    mutationFn: async (payload: { data: Record<string, unknown>; id?: number }) => {
      if (payload.id) return api.request('PUT', `/api/innovative_solutions/${payload.id}`, { body: payload.data });
      return api.request('POST', `/api/innovative_solutions`, { body: payload.data });
    },
    onSuccess: () => {
      toast({ title: editing ? 'Mis à jour' : 'Ajouté', description: editing ? 'Projet mis à jour.' : 'Projet ajouté.' });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin', 'innovative-solutions'] });
    },
    onError: (e: unknown) => {
      console.error(e);
      toast({ title: 'Erreur', description: "Enregistrement échoué", variant: 'destructive' });
    },
    onSettled: () => setLoading(false),
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const features = (form.featuresText || '').split('\n').map((f) => f.trim()).filter(Boolean).slice(0, 6);
    const payload = {
      title: form.title?.trim(),
      slug: form.slug || slugify(form.title || ''),
      description: form.description?.trim() || '',
      icon: form.icon || undefined,
      features,
      order: Number(form.order ?? 0),
      isActive: Boolean(form.isActive),
      donationImpactId: form.donationImpactId || '',
    };
    if (!payload.title) { toast({ title: 'Validation', description: 'Le titre est requis.', variant: 'destructive' }); setLoading(false); return; }
    if (!payload.description) { toast({ title: 'Validation', description: 'La description est requise.', variant: 'destructive' }); setLoading(false); return; }
    if (!payload.slug) { toast({ title: 'Validation', description: 'Le slug est requis.', variant: 'destructive' }); setLoading(false); return; }
    upsertMutation.mutate({ data: payload, id: editing?.id });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{editing ? 'Modifier un projet' : 'Nouveau projet'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Titre *</Label>
                <Input
                  value={form.title || ''}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    const newSlug = slugify(newTitle);
                    if (!form.slug || form.slug === slugify(form.title || '')) {
                      setForm({ ...form, title: newTitle, slug: newSlug });
                    } else {
                      setForm({ ...form, title: newTitle });
                    }
                  }}
                  placeholder="Ex : Irrigation Autonome & Intelligente"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug (URL)</Label>
                <Input value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="genere-automatiquement" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Une ou deux phrases présentant le projet."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Points clés (un par ligne, 4 max recommandé)</Label>
              <Textarea
                value={form.featuresText || ''}
                onChange={(e) => setForm({ ...form, featuresText: e.target.value })}
                placeholder={'Déclenchement automatique\nProgrammation par zones\n...'}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Icône (nom Lucide)</Label>
                <Input value={form.icon || ''} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="Droplets" list="lucide-icon-suggestions" />
                <datalist id="lucide-icon-suggestions">
                  {SUGGESTED_ICONS.map((name) => <option key={name} value={name} />)}
                </datalist>
                <p className="text-xs text-muted-foreground mt-1">Ex : {SUGGESTED_ICONS.slice(0, 4).join(', ')}...</p>
              </div>
              <div>
                <Label>Projet de dons lié</Label>
                <Select
                  value={form.donationImpactId ? String(form.donationImpactId) : ''}
                  onValueChange={(v) => setForm({ ...form, donationImpactId: v ? Number(v) : undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Aucun (pas de bouton Soutenir)" />
                  </SelectTrigger>
                  <SelectContent>
                    {causes.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.icon || '🎯'} {c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <div className="w-36">
                <Label>Ordre</Label>
                <Input type="number" value={form.order ?? 0} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <Switch checked={!!form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
                <Label>Actif</Label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>{editing ? 'Enregistrer' : 'Ajouter'}</Button>
              {editing && (<Button type="button" variant="outline" onClick={resetForm} disabled={loading}>Annuler</Button>)}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Solutions Innovantes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {solutions.map((s) => (
              <div
                key={s.id}
                className="p-3 border rounded-md flex items-start justify-between gap-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onEdit(s)}
              >
                <div>
                  <div className="font-medium">{s.title} {!s.isActive && <span className="text-xs text-muted-foreground">(inactif)</span>}</div>
                  <div className="text-xs text-muted-foreground">
                    Icône : {s.icon || '—'} • {(s.features || []).length} point(s) clé(s)
                    {s.donationImpact && ` • Lié à : ${s.donationImpact.slug}`}
                  </div>
                  <div className="text-sm mt-1 line-clamp-2">{s.description}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onEdit(s); }}>Modifier</Button>
                  <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); onDelete(s); }}>Supprimer</Button>
                </div>
              </div>
            ))}
            {solutions.length === 0 && (<div className="text-sm text-muted-foreground">Aucun projet pour le moment.</div>)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
