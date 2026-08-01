import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/integrations/api/client';

type TrustedSourceRow = {
  id: number;
  name: string;
  url?: string | null;
  description?: string | null;
  region?: string | null;
  isActive: boolean;
};

/**
 * Registre des centres de recherche/institutions dont DeerFlow doit
 * prioritairement s'inspirer pour rédiger les brouillons Documents RAG et
 * Produits phytosanitaires (consulté en lecture seule via
 * /api/internal/knowledge-base/trusted-sources). Sans cette liste, DeerFlow
 * doit deviner quelles sources sont fiables — cet écran permet à un admin de
 * la définir explicitement (IITA, CORAF, IRAD Cameroun, FAO...).
 */
export function AdminTrustedSources() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<TrustedSourceRow | null>(null);
  const [form, setForm] = useState<Partial<TrustedSourceRow>>({ isActive: true });
  const queryClient = useQueryClient();

  const { data: sources = [] } = useQuery<TrustedSourceRow[]>({
    queryKey: ['admin', 'trusted-sources'],
    queryFn: async () => {
      const res = await api.request('GET', '/api/admin/trusted-sources');
      return (res.data || []) as TrustedSourceRow[];
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const resetForm = () => { setEditing(null); setForm({ isActive: true }); };
  const onEdit = (row: TrustedSourceRow) => { setEditing(row); setForm(row); };

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.request('DELETE', `/api/admin/trusted-sources/${id}`),
    onSuccess: () => {
      toast({ title: 'Supprimée', description: 'Source de confiance supprimée.' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'trusted-sources'] });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Suppression échouée', variant: 'destructive' });
    },
  });
  const onDelete = (row: TrustedSourceRow) => {
    if (!confirm(`Supprimer "${row.name}" du registre des sources de confiance ?`)) return;
    setLoading(true);
    deleteMutation.mutate(row.id, { onSettled: () => setLoading(false) });
  };

  const upsertMutation = useMutation({
    mutationFn: async (payload: { data: Partial<TrustedSourceRow>; id?: number }) => {
      if (payload.id) return api.request('PUT', `/api/admin/trusted-sources/${payload.id}`, { body: payload.data });
      return api.request('POST', `/api/admin/trusted-sources`, { body: payload.data });
    },
    onSuccess: () => {
      toast({ title: editing ? 'Mise à jour' : 'Ajoutée', description: editing ? 'Source mise à jour.' : 'Source ajoutée au registre.' });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin', 'trusted-sources'] });
    },
    onError: (e: unknown) => {
      console.error(e);
      toast({ title: 'Erreur', description: 'Enregistrement échoué (vérifiez que le nom est renseigné et que l\'URL, si fournie, est valide).', variant: 'destructive' });
    },
    onSettled: () => setLoading(false),
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload: Partial<TrustedSourceRow> = {
      name: form.name?.trim(),
      url: form.url?.trim() || undefined,
      description: form.description?.trim() || undefined,
      region: form.region?.trim() || undefined,
      isActive: Boolean(form.isActive),
    };
    if (!payload.name) {
      toast({ title: 'Validation', description: 'Le nom est requis.', variant: 'destructive' });
      setLoading(false);
      return;
    }
    upsertMutation.mutate({ data: payload, id: editing?.id });
  };

  const updateField = (key: keyof TrustedSourceRow, value: string | boolean | undefined) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{editing ? 'Modifier une source' : 'Nouvelle source de confiance'}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Centres de recherche, institutions et organismes que DeerFlow doit consulter en priorité
            pour rédiger ses brouillons (Documents RAG, Produits phytosanitaires).
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={form.name || ''}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="ex: IITA, CORAF, IRAD Cameroun, FAO..."
              />
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={form.url || ''}
                onChange={(e) => updateField('url', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Région</Label>
              <Input
                value={form.region || ''}
                onChange={(e) => updateField('region', e.target.value)}
                placeholder="ex: Afrique, Cameroun, Afrique de l'Ouest..."
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Domaine d'expertise, périmètre..."
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={!!form.isActive} onCheckedChange={(v) => updateField('isActive', v)} />
              <Label>Active (visible par DeerFlow)</Label>
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
          <CardTitle>Registre ({sources.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sources.map((s) => (
              <div
                key={s.id}
                className="p-3 border rounded-md flex items-start justify-between gap-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onEdit(s)}
              >
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {s.name}
                    {!s.isActive && <span className="text-xs text-muted-foreground">(inactive)</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{s.region}</div>
                  {s.description && <div className="text-sm mt-1 line-clamp-2">{s.description}</div>}
                  {s.url && <div className="text-xs text-muted-foreground mt-1">{s.url}</div>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onEdit(s); }}>
                    Modifier
                  </Button>
                  <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); onDelete(s); }}>
                    Supprimer
                  </Button>
                </div>
              </div>
            ))}
            {sources.length === 0 && (
              <div className="text-sm text-muted-foreground">
                Aucune source de confiance définie — DeerFlow devra s'appuyer uniquement sur son propre jugement.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
