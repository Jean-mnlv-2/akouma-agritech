import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Trash2, Plus, Image as ImageIcon, Save, X, GripVertical, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/integrations/api/client';
import { FileUpload } from './FileUpload';
import PageHeaderCarousel from '@/components/PageHeaderCarousel';

/** Pages connues — l'admin peut aussi taper une autre clé */
export const KNOWN_PAGE_KEYS = [
  { key: 'home', label: 'Accueil' },
  { key: 'elearning', label: 'E-Learning' },
  { key: 'shop', label: 'Boutique' },
  { key: 'seeds', label: 'Semences' },
  { key: 'news', label: 'Actualités' },
  { key: 'about', label: 'À propos' },
  { key: 'contact', label: 'Contact' },
  { key: 'careers', label: 'Carrières' },
  { key: 'donations', label: 'Dons' },
  { key: 'partners', label: 'Partenaires' },
  { key: 'agri-consulting', label: 'AgriConsulting' },
] as const;

interface PageHeaderImage {
  id: number;
  pageKey: string;
  imageUrl: string;
  altText?: string | null;
  title?: string | null;
  subtitle?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  order: number;
  isActive: boolean;
}

const emptyForm: Partial<PageHeaderImage> = {
  pageKey: 'home',
  imageUrl: '',
  altText: '',
  title: '',
  subtitle: '',
  ctaLabel: '',
  ctaUrl: '',
  order: 0,
  isActive: true,
};

export function AdminPageHeaderImages() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filterKey, setFilterKey] = useState<string>('all');
  const [editing, setEditing] = useState<PageHeaderImage | null>(null);
  const [form, setForm] = useState<Partial<PageHeaderImage>>(emptyForm);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [previewKey, setPreviewKey] = useState<string>('home');

  const { data: items = [], isLoading } = useQuery<PageHeaderImage[]>({
    queryKey: ['admin', 'page-header-images'],
    queryFn: async () => {
      const res = await api.request('GET', '/api/page_header_images/admin');
      return Array.isArray(res?.data) ? res.data : [];
    },
  });

  const filtered = useMemo(
    () => (filterKey === 'all' ? items : items.filter((i) => i.pageKey === filterKey)),
    [items, filterKey]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, PageHeaderImage[]>();
    for (const it of filtered) {
      if (!map.has(it.pageKey)) map.set(it.pageKey, []);
      map.get(it.pageKey)!.push(it);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const resetForm = () => { setEditing(null); setForm(emptyForm); };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.pageKey || !form.imageUrl) throw new Error('La page et l\'image sont obligatoires');
      const payload = {
        pageKey: String(form.pageKey).trim(),
        imageUrl: String(form.imageUrl).trim(),
        altText: form.altText || null,
        title: form.title || null,
        subtitle: form.subtitle || null,
        ctaLabel: form.ctaLabel || null,
        ctaUrl: form.ctaUrl || null,
        order: Number(form.order ?? 0),
        isActive: form.isActive ?? true,
      };
      if (editing) {
        return api.request('PUT', `/api/page_header_images/${editing.id}`, { body: payload });
      }
      return api.request('POST', '/api/page_header_images', { body: payload });
    },
    onSuccess: () => {
      toast({ title: 'Enregistré', description: 'Image d\'en-tête sauvegardée.' });
      qc.invalidateQueries({ queryKey: ['admin', 'page-header-images'] });
      qc.invalidateQueries({ queryKey: ['page-header-images'] });
      resetForm();
    },
    onError: (e: Error) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: number) => api.request('PATCH', `/api/page_header_images/${id}/toggle`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'page-header-images'] });
      qc.invalidateQueries({ queryKey: ['page-header-images'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.request('DELETE', `/api/page_header_images/${id}`),
    onSuccess: () => {
      toast({ title: 'Supprimé' });
      qc.invalidateQueries({ queryKey: ['admin', 'page-header-images'] });
      qc.invalidateQueries({ queryKey: ['page-header-images'] });
    },
    onError: () => toast({ title: 'Erreur', description: 'Suppression échouée', variant: 'destructive' }),
  });

  const reorderMutation = useMutation({
    mutationFn: async (payload: { pageKey: string; orderedIds: number[] }) =>
      api.request('POST', '/api/page_header_images/reorder', { body: payload }),
    onSuccess: () => {
      toast({ title: 'Ordre mis à jour' });
      qc.invalidateQueries({ queryKey: ['admin', 'page-header-images'] });
      qc.invalidateQueries({ queryKey: ['page-header-images'] });
    },
    onError: () => toast({ title: 'Erreur', description: 'Réordonnancement échoué', variant: 'destructive' }),
  });

  const handleDrop = (pageKey: string, list: PageHeaderImage[], from: number, to: number) => {
    if (from === to) return;
    const next = [...list];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    reorderMutation.mutate({ pageKey, orderedIds: next.map((it) => it.id) });
  };

  const previewItems = useMemo(
    () => items.filter((i) => i.pageKey === previewKey && i.isActive).sort((a, b) => a.order - b.order),
    [items, previewKey]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" /> {editing ? 'Modifier l\'image d\'en-tête' : 'Nouvelle image d\'en-tête'}
          </CardTitle>
          <CardDescription>
            Plusieurs images sur la même page = carrousel automatique. Les images masquées sont conservées mais non affichées.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Page *</Label>
              <Select value={form.pageKey || ''} onValueChange={(v) => setForm((f) => ({ ...f, pageKey: v }))}>
                <SelectTrigger><SelectValue placeholder="Choisir une page" /></SelectTrigger>
                <SelectContent>
                  {KNOWN_PAGE_KEYS.map((p) => (
                    <SelectItem key={p.key} value={p.key}>{p.label} ({p.key})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className="mt-2"
                placeholder="ou clé personnalisée (ex: my-custom-page)"
                value={form.pageKey || ''}
                onChange={(e) => setForm((f) => ({ ...f, pageKey: e.target.value }))}
              />
            </div>
            <div>
              <Label>Ordre d'affichage</Label>
              <Input
                type="number"
                value={form.order ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
              />
            </div>
          </div>

          <FileUpload
            label="Image *"
            accept="image/*"
            value={form.imageUrl}
            onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Texte alternatif (SEO/A11y)</Label>
              <Input value={form.altText || ''} onChange={(e) => setForm((f) => ({ ...f, altText: e.target.value }))} />
            </div>
            <div>
              <Label>Titre (optionnel, surcharge)</Label>
              <Input value={form.title || ''} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <Label>Sous-titre (optionnel)</Label>
              <Input value={form.subtitle || ''} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} />
            </div>
            <div>
              <Label>Libellé CTA (optionnel)</Label>
              <Input value={form.ctaLabel || ''} onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))} />
            </div>
            <div>
              <Label>URL CTA (optionnel)</Label>
              <Input value={form.ctaUrl || ''} onChange={(e) => setForm((f) => ({ ...f, ctaUrl: e.target.value }))} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={form.isActive ?? true} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
            <Label>Actif (visible sur le site)</Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              <Save className="w-4 h-4 mr-2" /> {editing ? 'Mettre à jour' : 'Créer'}
            </Button>
            {editing && (
              <Button variant="outline" onClick={resetForm}><X className="w-4 h-4 mr-2" />Annuler</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle>Images d'en-tête configurées</CardTitle>
            <CardDescription>{items.length} image(s) au total</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Filtrer :</Label>
            <Select value={filterKey} onValueChange={setFilterKey}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les pages</SelectItem>
                {KNOWN_PAGE_KEYS.map((p) => (
                  <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={resetForm}><Plus className="w-4 h-4 mr-2" />Nouvelle</Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : grouped.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune image. Le site utilise les visuels par défaut.</p>
          ) : (
            <div className="space-y-6">
              {grouped.map(([key, list]) => (
                <div key={key}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-semibold">{key}</h3>
                    <Badge variant="secondary">{list.length}</Badge>
                    {list.length > 1 && <Badge>Carrousel</Badge>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {list.map((it, idx) => (
                      <div
                        key={it.id}
                        draggable
                        onDragStart={() => setDragIndex(idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => { if (dragIndex !== null) handleDrop(key, list, dragIndex, idx); setDragIndex(null); }}
                        className={`border rounded-lg overflow-hidden ${it.isActive ? '' : 'opacity-60'} ${dragIndex === idx ? 'ring-2 ring-primary' : ''}`}
                      >
                        <div className="aspect-video bg-muted relative">
                          {it.imageUrl ? (
                            <img src={it.imageUrl} alt={it.altText || ''} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="flex items-center justify-center h-full"><ImageIcon className="w-8 h-8 text-muted-foreground" /></div>
                          )}
                          <Badge className="absolute top-2 left-2">#{it.order}</Badge>
                          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-background/80 rounded p-1 cursor-grab"><GripVertical className="w-4 h-4" /></div>
                          {!it.isActive && <Badge variant="destructive" className="absolute top-2 right-2">Masqué</Badge>}
                        </div>
                        <div className="p-3 space-y-2">
                          {it.title && <p className="font-medium text-sm truncate">{it.title}</p>}
                          {it.altText && <p className="text-xs text-muted-foreground truncate">{it.altText}</p>}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Switch checked={it.isActive} onCheckedChange={() => toggleMutation.mutate(it.id)} />
                              <span className="text-xs">{it.isActive ? 'Actif' : 'Inactif'}</span>
                            </div>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" onClick={() => { setEditing(it); setForm(it); }}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => {
                                if (confirm('Supprimer cette image ?')) deleteMutation.mutate(it.id);
                              }}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2"><Eye className="w-5 h-5" /> Prévisualisation en direct</CardTitle>
            <CardDescription>Vérifiez le carrousel et les textes (titre, sous-titre, CTA) pour chaque page avant publication.</CardDescription>
          </div>
          <Select value={previewKey} onValueChange={setPreviewKey}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {KNOWN_PAGE_KEYS.map((p) => (
                <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="relative w-full h-[360px] rounded-xl overflow-hidden border">
            <PageHeaderCarousel
              pageKey={previewKey}
              fallbackImage="/kilimo-logo.png"
              fallbackAlt="Aperçu"
              showOverlayContent
              itemsOverride={previewItems}
              intervalMs={4000}
            />
          </div>
          {previewItems.length === 0 && (
            <p className="text-xs text-muted-foreground mt-3">Aucune image active pour cette page — l'image par défaut du site est utilisée.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}