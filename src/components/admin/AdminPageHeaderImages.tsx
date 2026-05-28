import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Trash2, Plus, Image as ImageIcon, Save, X, GripVertical, Eye, ArrowUp, ArrowDown, Monitor, Smartphone, Keyboard, AlertCircle } from 'lucide-react';
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
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [previewKey, setPreviewKey] = useState<string>('home');
  const [previewMode, setPreviewMode] = useState<'live' | 'compare'>('live');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // ---- Pre-publish validation ----
  // Rule: image required. If any CTA field is provided (label OR url), both must be set.
  // If a title is set without subtitle it's allowed, but a CTA without title is flagged.
  const validationErrors = useMemo(() => {
    const errs: string[] = [];
    if (!form.imageUrl) errs.push("L'image est obligatoire.");
    if (!form.pageKey) errs.push("La page (pageKey) est obligatoire.");
    const hasCtaLabel = !!(form.ctaLabel && String(form.ctaLabel).trim());
    const hasCtaUrl = !!(form.ctaUrl && String(form.ctaUrl).trim());
    if (hasCtaLabel !== hasCtaUrl) {
      errs.push("Le bouton CTA est incomplet : libellé ET URL doivent être renseignés.");
    }
    if (hasCtaUrl) {
      const url = String(form.ctaUrl).trim();
      const ok = /^https?:\/\//i.test(url) || url.startsWith('/');
      if (!ok) errs.push("L'URL CTA doit commencer par http(s):// ou « / ».");
    }
    if ((hasCtaLabel || hasCtaUrl) && !(form.title && String(form.title).trim())) {
      errs.push("Un CTA sans titre n'est pas recommandé : ajoutez un titre.");
    }
    if (form.isActive && !form.altText) {
      errs.push("Le texte alternatif (alt) est requis pour l'accessibilité d'une image active.");
    }
    return errs;
  }, [form]);

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
      if (validationErrors.length > 0) {
        throw new Error(validationErrors[0]);
      }
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

  const moveItem = (key: string, list: PageHeaderImage[], from: number, dir: -1 | 1) => {
    const to = from + dir;
    if (to < 0 || to >= list.length) return;
    handleDrop(key, list, from, to);
  };

  const previewItems = useMemo(
    () => items.filter((i) => i.pageKey === previewKey && i.isActive).sort((a, b) => a.order - b.order),
    [items, previewKey]
  );

  // "Published" snapshot vs "Draft" (in-progress) — for now both come from the same store,
  // but in the compare mode we show side-by-side: server-confirmed list vs an editable
  // local reorder/edit view (the form being edited).
  const draftItems = useMemo(() => {
    if (!editing || editing.pageKey !== previewKey) return previewItems;
    return previewItems.map((it) =>
      it.id === editing.id
        ? ({
            ...it,
            title: form.title ?? it.title,
            subtitle: form.subtitle ?? it.subtitle,
            ctaLabel: form.ctaLabel ?? it.ctaLabel,
            ctaUrl: form.ctaUrl ?? it.ctaUrl,
            imageUrl: form.imageUrl || it.imageUrl,
            altText: form.altText ?? it.altText,
          } as PageHeaderImage)
        : it
    );
  }, [editing, form, previewItems, previewKey]);

  // Field-level diff (for the highlighted summary panel in compare mode)
  const fieldDiffs = useMemo(() => {
    if (!editing || editing.pageKey !== previewKey) return [] as Array<{ field: string; before: string; after: string }>;
    const before = previewItems.find((i) => i.id === editing.id);
    if (!before) return [];
    const after = draftItems.find((i) => i.id === editing.id);
    if (!after) return [];
    const fields: Array<{ key: keyof PageHeaderImage; label: string }> = [
      { key: 'title', label: 'Titre' },
      { key: 'subtitle', label: 'Sous-titre' },
      { key: 'ctaLabel', label: 'Libellé CTA' },
      { key: 'ctaUrl', label: 'URL CTA' },
      { key: 'imageUrl', label: 'Image' },
      { key: 'altText', label: 'Texte alternatif' },
    ];
    return fields
      .map((f) => ({
        field: f.label,
        before: String((before[f.key] ?? '') || '—'),
        after: String((after[f.key] ?? '') || '—'),
      }))
      .filter((d) => d.before !== d.after);
  }, [editing, previewKey, previewItems, draftItems]);

  const deviceFrame = previewDevice === 'mobile'
    ? 'w-[375px] max-w-full h-[640px]'
    : 'w-full h-[360px]';

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
            recommendedSize="1920x1080 px (ratio 16:9) pour un rendu optimal"
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

          {validationErrors.length > 0 && (
            <div
              role="alert"
              aria-live="polite"
              className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 space-y-1"
            >
              <div className="flex items-center gap-2 text-destructive text-sm font-semibold">
                <AlertCircle className="w-4 h-4" />
                Publication bloquée — corrigez les points suivants :
              </div>
              <ul className="list-disc pl-6 text-sm text-destructive">
                {validationErrors.map((err, i) => (<li key={i}>{err}</li>))}
              </ul>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || validationErrors.length > 0}
              aria-disabled={validationErrors.length > 0}
              title={validationErrors.length > 0 ? 'Corrigez les erreurs avant de publier' : undefined}
            >
              <Save className="w-4 h-4 mr-2" /> {editing ? 'Mettre à jour' : 'Créer'}
            </Button>
            {editing && (
              <Button variant="outline" onClick={resetForm}><X className="w-4 h-4 mr-2" />Annuler</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Keyboard shortcuts help */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Keyboard className="w-5 h-5" /> Raccourcis & navigation clavier
          </CardTitle>
          <CardDescription>Utilisable sans souris pour réordonner et parcourir le carrousel.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <li className="flex items-center gap-2"><kbd className="px-2 py-0.5 rounded border bg-muted text-xs">Tab</kbd><span>Passer d'une slide à la suivante</span></li>
            <li className="flex items-center gap-2"><kbd className="px-2 py-0.5 rounded border bg-muted text-xs">Shift + Tab</kbd><span>Revenir à la slide précédente</span></li>
            <li className="flex items-center gap-2"><kbd className="px-2 py-0.5 rounded border bg-muted text-xs">Alt + ↑</kbd><span>Monter la slide focusée</span></li>
            <li className="flex items-center gap-2"><kbd className="px-2 py-0.5 rounded border bg-muted text-xs">Alt + ↓</kbd><span>Descendre la slide focusée</span></li>
            <li className="flex items-center gap-2"><kbd className="px-2 py-0.5 rounded border bg-muted text-xs">Entrée / Espace</kbd><span>Activer un bouton (édition, suppression, switch)</span></li>
          </ul>
          <p className="text-xs text-muted-foreground pt-2">Astuce : la slide focalisée affiche un anneau bleu ; pendant un glisser-déposer, la cible affiche un cadre en pointillés.</p>
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
                        onDragOver={(e) => { e.preventDefault(); setDragOverIndex(idx); }}
                        onDragLeave={() => setDragOverIndex((v) => (v === idx ? null : v))}
                        onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                        onDrop={() => { if (dragIndex !== null) handleDrop(key, list, dragIndex, idx); setDragIndex(null); setDragOverIndex(null); }}
                        tabIndex={0}
                        role="listitem"
                        aria-label={`Slide ${idx + 1} sur ${list.length}${it.title ? ` : ${it.title}` : ''}. Utilisez Alt+Flèche haut/bas pour réordonner.`}
                        onKeyDown={(e) => {
                          if (e.altKey && e.key === 'ArrowUp') { e.preventDefault(); moveItem(key, list, idx, -1); }
                          else if (e.altKey && e.key === 'ArrowDown') { e.preventDefault(); moveItem(key, list, idx, 1); }
                        }}
                        className={`border rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary ${it.isActive ? '' : 'opacity-60'} ${dragIndex === idx ? 'ring-2 ring-primary scale-[0.98]' : ''} ${dragOverIndex === idx && dragIndex !== idx ? 'ring-2 ring-accent border-dashed' : ''}`}
                      >
                        <div className="aspect-video bg-muted relative">
                          {it.imageUrl ? (
                            <img src={it.imageUrl} alt={it.altText || ''} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="flex items-center justify-center h-full"><ImageIcon className="w-8 h-8 text-muted-foreground" /></div>
                          )}
                          <Badge className="absolute top-2 left-2">#{it.order}</Badge>
                          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-background/80 rounded p-1 cursor-grab" aria-hidden="true"><GripVertical className="w-4 h-4" /></div>
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
                              <Button size="icon" variant="ghost" disabled={idx === 0} onClick={() => moveItem(key, list, idx, -1)} aria-label="Monter">
                                <ArrowUp className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" disabled={idx === list.length - 1} onClick={() => moveItem(key, list, idx, 1)} aria-label="Descendre">
                                <ArrowDown className="w-4 h-4" />
                              </Button>
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
            <CardDescription>
              Vérifiez le carrousel, les textes et le rendu responsive avant publication. Mode « Avant / Après » pour comparer publié vs modifications en cours.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={previewKey} onValueChange={setPreviewKey}>
              <SelectTrigger className="w-[200px]" aria-label="Page à prévisualiser"><SelectValue /></SelectTrigger>
              <SelectContent>
                {KNOWN_PAGE_KEYS.map((p) => (
                  <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="inline-flex rounded-md border bg-background" role="group" aria-label="Mode de prévisualisation">
              <Button
                size="sm"
                variant={previewMode === 'live' ? 'default' : 'ghost'}
                onClick={() => setPreviewMode('live')}
                aria-pressed={previewMode === 'live'}
              >
                Direct
              </Button>
              <Button
                size="sm"
                variant={previewMode === 'compare' ? 'default' : 'ghost'}
                onClick={() => setPreviewMode('compare')}
                aria-pressed={previewMode === 'compare'}
              >
                Avant / Après
              </Button>
            </div>
            <div className="inline-flex rounded-md border bg-background" role="group" aria-label="Appareil de prévisualisation">
              <Button
                size="sm"
                variant={previewDevice === 'desktop' ? 'default' : 'ghost'}
                onClick={() => setPreviewDevice('desktop')}
                aria-pressed={previewDevice === 'desktop'}
                aria-label="Aperçu bureau"
              >
                <Monitor className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={previewDevice === 'mobile' ? 'default' : 'ghost'}
                onClick={() => setPreviewDevice('mobile')}
                aria-pressed={previewDevice === 'mobile'}
                aria-label="Aperçu mobile"
              >
                <Smartphone className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {previewMode === 'live' ? (
            <div className="flex justify-center">
              <div className={`relative ${deviceFrame} rounded-xl overflow-hidden border bg-muted`}>
                <PageHeaderCarousel
                  pageKey={previewKey}
                  fallbackImage="/kilimo-logo.png"
                  fallbackAlt="Aperçu"
                  showOverlayContent
                  itemsOverride={previewItems}
                  intervalMs={4000}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {validationErrors.length > 0 && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-2"
                >
                  <div className="flex items-center gap-2 text-destructive text-sm font-semibold">
                    <AlertCircle className="w-4 h-4" />
                    Erreurs de validation (cliquez pour accéder au formulaire)
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-auto"
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      Aller au formulaire
                    </Button>
                  </div>
                  <ul className="list-disc pl-6 text-sm text-destructive">
                    {validationErrors.slice(0, 3).map((err, i) => (<li key={i}>{err}</li>))}
                    {validationErrors.length > 3 && (
                      <li>... et {validationErrors.length - 3} autre(s)</li>
                    )}
                  </ul>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">Publié</Badge>
                  <span className="text-xs text-muted-foreground">État actuel sur le site</span>
                </div>
                <div className="flex justify-center">
                  <div className={`relative ${deviceFrame} rounded-xl overflow-hidden border bg-muted`}>
                    <PageHeaderCarousel
                      pageKey={previewKey}
                      fallbackImage="/kilimo-logo.png"
                      fallbackAlt="Publié"
                      showOverlayContent
                      itemsOverride={previewItems}
                      intervalMs={4000}
                    />
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge>Modifications en cours</Badge>
                  {fieldDiffs.length > 0 && (
                    <Badge variant="outline" className="border-amber-500/50 text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/30">
                      {fieldDiffs.length} changement{fieldDiffs.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {editing && editing.pageKey === previewKey ? 'Reflet du formulaire' : 'Identique au publié (aucune édition)'}
                  </span>
                </div>
                <div className="flex justify-center">
                  <div className={`relative ${deviceFrame} rounded-xl overflow-hidden border bg-muted ring-2 ring-primary/40`}>
                    <PageHeaderCarousel
                      pageKey={previewKey}
                      fallbackImage="/kilimo-logo.png"
                      fallbackAlt="Brouillon"
                      showOverlayContent
                      itemsOverride={draftItems}
                      intervalMs={4000}
                      highlightFields={fieldDiffs.map(d => d.field)}
                    />
                  </div>
                </div>
              </div>
              </div>
              {fieldDiffs.length > 0 && (
                <div className="rounded-lg border bg-card p-4">
                  <div className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Badge variant="outline" className="border-amber-500/50 text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/30">Diff</Badge>
                    Champs modifiés sur la slide en cours d'édition
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs uppercase text-muted-foreground">
                        <tr>
                          <th className="text-left py-2 pr-4">Champ</th>
                          <th className="text-left py-2 pr-4">Avant</th>
                          <th className="text-left py-2">Après</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fieldDiffs.map((d) => (
                          <tr key={d.field} className="border-t">
                            <td className="py-2 pr-4 font-medium">{d.field}</td>
                            <td className="py-2 pr-4">
                              <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 line-through break-all">{d.before}</span>
                            </td>
                            <td className="py-2">
                              <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300 break-all">{d.after}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          {previewItems.length === 0 && (
            <p className="text-xs text-muted-foreground mt-3">Aucune image active pour cette page — l'image par défaut du site est utilisée.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}