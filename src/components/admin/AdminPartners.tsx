import { useState } from 'react';
import DOMPurify from 'dompurify';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import ReactQuill from 'react-quill';
import 'quill/dist/quill.snow.css';
import { FileUpload } from './FileUpload';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/integrations/api/client';
import { slugify } from '@/lib/utils';

type PartnerRow = {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  logoUrl?: string;
  imageUrl?: string;
  type?: string;
  description?: string;
  year?: string;
  website?: string;
  contact?: string;
  order?: number;
  isActive?: boolean;
};

export function AdminPartners() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<PartnerRow | null>(null);
  const [form, setForm] = useState<Partial<PartnerRow>>({ isActive: true, order: 0 });
  const queryClient = useQueryClient();

  const { data: partners = [] } = useQuery<PartnerRow[]>({
    queryKey: ['admin', 'partners'],
    queryFn: async () => {
      const res = await api.request('GET', '/api/partners');
      const list = (Array.isArray(res) ? res : res.data) as PartnerRow[];
      return (list || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const resetForm = () => { setEditing(null); setForm({ isActive: true, order: 0 }); };
  const onEdit = (row: PartnerRow) => { setEditing(row); setForm(row); };

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.request('DELETE', `/api/partners/${id}`),
    onSuccess: () => {
      toast({ title: 'Supprimé', description: 'Partenaire supprimé.' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'partners'] });
    },
    onError: (e: unknown) => {
      console.error(e);
      toast({ title: 'Erreur', description: 'Suppression échouée', variant: 'destructive' });
    }
  });
  const onDelete = (row: PartnerRow) => {
    if (!confirm(`Supprimer le partenaire "${row.name}" ?`)) return;
    setLoading(true);
    deleteMutation.mutate(row.id, { onSettled: () => setLoading(false) });
  };

  const upsertMutation = useMutation({
    mutationFn: async (payload: { data: Partial<PartnerRow>; id?: number }) => {
      if (payload.id) return api.request('PUT', `/api/partners/${payload.id}`, { body: payload.data });
      return api.request('POST', `/api/partners`, { body: payload.data });
    },
    onSuccess: () => {
      toast({ title: editing ? 'Mis à jour' : 'Ajouté', description: editing ? 'Partenaire mis à jour.' : 'Partenaire ajouté.' });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin', 'partners'] });
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
    const payload: Partial<PartnerRow> = {
      name: form.name?.trim(),
      slug: form.slug || slugify(form.name || ''),
      logo: form.logo || undefined,
      logoUrl: form.logoUrl || undefined,
      imageUrl: form.imageUrl || undefined,
      type: form.type || undefined,
      description: form.description || undefined,
      year: form.year || undefined,
      website: form.website || undefined,
      contact: form.contact || undefined,
      order: Number(form.order ?? 0),
      isActive: Boolean(form.isActive),
    };
    if (!payload.name) { toast({ title: 'Validation', description: 'Le nom est requis.', variant: 'destructive' }); setLoading(false); return; }
    if (!payload.slug) { toast({ title: 'Validation', description: 'Le slug est requis.', variant: 'destructive' }); setLoading(false); return; }
    upsertMutation.mutate({ data: payload, id: editing?.id });
  };

  const quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['clean']
    ],
  };

  const updateField = (key: keyof PartnerRow, value: string | number | boolean | undefined) => setForm((prev) => ({ ...prev, [key]: value }));

  // Upload function placeholder - will be connected to UI later
  void (async function _onUpload(e: React.ChangeEvent<HTMLInputElement>, key: 'logoUrl' | 'imageUrl') {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const data = await api.request('POST', '/api/upload', { body: formData });
      updateField(key, data.url);
      toast({ title: 'Fichier envoyé', description: 'Le fichier a été importé avec succès.' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Erreur', description: "Échec de l'upload", variant: 'destructive' });
    } finally {
      e.target.value = '';
    }
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{editing ? 'Modifier un partenaire' : 'Nouveau partenaire'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input 
                  value={form.name || ''} 
                  onChange={(e) => {
                    const newName = e.target.value;
                    const newSlug = slugify(newName);
                    if (!form.slug || form.slug === slugify(form.name || '')) {
                      setForm({ ...form, name: newName, slug: newSlug });
                    } else {
                      setForm({ ...form, name: newName });
                    }
                  }} 
                  placeholder="Nom du partenaire" 
                />
              </div>
              <div className="space-y-2">
                <Label>Slug (URL)</Label>
                <Input value={form.slug || ''} onChange={(e) => updateField('slug', e.target.value)} placeholder="genere-automatiquement" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Logo (emoji/texte)</Label>
                <Input value={form.logo || ''} onChange={(e) => updateField('logo', e.target.value)} placeholder="🌱" />
              </div>
              <div>
                <Label>Type</Label>
                <Input value={form.type || ''} onChange={(e) => updateField('type', e.target.value)} placeholder="Technologie, Coopérative..." />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <FileUpload label="Logo du partenaire" accept="image/*" value={form.logoUrl || ''} onChange={(url) => updateField('logoUrl', url)} />
              </div>
              <div>
                <FileUpload label="Image du partenaire" accept="image/*" value={form.imageUrl || ''} onChange={(url) => updateField('imageUrl', url)} />
              </div>
            </div>
            <div className="space-y-2 min-h-[200px] flex flex-col">
              <Label>Description</Label>
              <div className="flex-1">
                <ReactQuill 
                  theme="snow"
                  value={form.description || ''}
                  onChange={(content) => updateField('description', content)}
                  modules={quillModules}
                  className="h-[120px] mb-12"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
              <div>
                <Label>Année</Label>
                <Input value={form.year || ''} onChange={(e) => updateField('year', e.target.value)} placeholder="2024" />
              </div>
              <div>
                <Label>Site web</Label>
                <Input value={form.website || ''} onChange={(e) => updateField('website', e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <Label>Contact</Label>
                <Input value={form.contact || ''} onChange={(e) => updateField('contact', e.target.value)} placeholder="email@domaine.com" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-36">
                <Label>Ordre</Label>
                <Input type="number" value={form.order ?? 0} onChange={(e) => updateField('order', Number(e.target.value))} />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <Switch checked={!!form.isActive} onCheckedChange={(v) => updateField('isActive', v)} />
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
          <CardTitle>Partenaires</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {partners.map((p) => (
              <div 
                key={p.id} 
                className="p-3 border rounded-md flex items-start justify-between gap-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onEdit(p)}
              >
                <div>
                  <div className="font-medium">{p.logo || '🤝'} {p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.type} {p.year ? `• ${p.year}` : ''}</div>
                  {p.description && <div className="text-sm mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(p.description)}} />}
                  <div className="text-xs text-muted-foreground mt-1">{p.website} {p.contact ? `• ${p.contact}` : ''}</div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(p);
                    }}
                  >
                    Modifier
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(p);
                    }}
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            ))}
            {partners.length === 0 && (<div className="text-sm text-muted-foreground">Aucun partenaire pour le moment.</div>)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


