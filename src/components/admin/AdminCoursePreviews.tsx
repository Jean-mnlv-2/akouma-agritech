import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { api } from '@/integrations/api/client';
import { Plus, Trash2, PlayCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface CourseItem {
  id: string | number;
  title: string;
}

interface PreviewType {
  id: number;
  name: string;
  label: string;
  icon: string;
}

interface PreviewItem {
  id: number;
  courseId: number;
  typeId: number;
  title: string;
  contentUrl: string;
  url?: string; // for backward compatibility
  duration?: string | null;
  description?: string | null;
  previewType?: PreviewType;
  type?: string;
  order?: number;
}

interface AdminCoursePreviewsProps {
  initialCourseId?: number | null;
}

export function AdminCoursePreviews({ initialCourseId }: AdminCoursePreviewsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [courseId, setCourseId] = useState<number | undefined>(initialCourseId || undefined);
  const [form, setForm] = useState<{ courseId?: number; typeId?: number; title: string; description?: string; contentUrl: string; duration?: string; order?: number }>({ 
    title: '', 
    contentUrl: '',
    typeId: undefined,
    duration: '',
    order: 1
  });

  // Handle initial course ID from props
  useEffect(() => {
    if (initialCourseId) {
      setCourseId(initialCourseId);
    }
  }, [initialCourseId]);

  const { data: courses = [] } = useQuery<CourseItem[]>({
    queryKey: ['admin', 'courses'],
    queryFn: async () => {
      const res = await api.request('GET', '/api/courses');
      const items = Array.isArray(res) ? res : res.data;
      return items || [];
    },
    staleTime: 30000,
  });

  const { data: types = [] } = useQuery<PreviewType[]>({
    queryKey: ['admin', 'course-preview-types'],
    queryFn: async () => {
      const res = await api.request('GET', '/api/course_preview_types');
      const items = Array.isArray(res) ? res : res.data;
      return items || [];
    },
    staleTime: 60000,
  });

  const { data: items = [] } = useQuery<PreviewItem[]>({
    queryKey: ['admin', 'course-preview-items', courseId],
    queryFn: async () => {
      const res = await api.request('GET', `/api/course_preview_items${courseId ? `?courseId=${courseId}` : ''}`);
      const items = Array.isArray(res) ? res : res.data;
      return items || [];
    },
    staleTime: 10000,
  });

  // Set default typeId when types load
  useEffect(() => {
    if (types.length > 0 && !form.typeId) {
      setForm(prev => ({ ...prev, typeId: types[0].id }));
    }
  }, [types, form.typeId]);

  // Set default order based on items count
  useEffect(() => {
    setForm(prev => ({ ...prev, order: (items.length || 0) + 1 }));
  }, [items.length]);

  const [filterTypeId, setFilterTypeId] = useState<number | undefined>(undefined);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [playlist, setPlaylist] = useState<PreviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchTitle, setSearchTitle] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const upsertMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => api.request('POST', '/api/course_preview_items', { body: payload }),
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Élément ajouté' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'course-preview-items', courseId] });
      setForm({ 
        title: '', 
        contentUrl: '', 
        courseId, 
        typeId: types.length > 0 ? types[0].id : undefined, 
        duration: '', 
        order: (items.length || 0) + 2 // +2 because we just added one
      });
    },
    onError: (error: unknown) => {
      console.error('Error adding preview item:', error);
      toast({ 
        title: 'Erreur', 
        description: (error as any)?.response?.data?.error || "Ajout échoué", 
        variant: 'destructive' 
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.request('DELETE', `/api/course_preview_items/${id}`),
    onSuccess: () => {
      toast({ title: 'Supprimé', description: 'Élément supprimé' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'course-preview-items', courseId] });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Éléments d’Aperçu Gratuit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Select value={String(courseId ?? '')} onValueChange={(val) => setCourseId(val ? Number(val) : undefined)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un cours" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c: { id: string | number; title: string }) => (<SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <Select value={String(form.typeId ?? '')} onValueChange={(v) => setForm({ ...form, typeId: Number(v) })}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Type de ressource" /></SelectTrigger>
                <SelectContent>
                  {types.map((t: { id: string | number; label: string }) => (<SelectItem key={t.id} value={String(t.id)}>{t.label}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={filterTypeId ? String(filterTypeId) : 'all'} onValueChange={(v) => setFilterTypeId(v === 'all' ? undefined : Number(v))}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Filtrer par type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {types.map((t: PreviewType) => (<SelectItem key={t.id} value={String(t.id)}>{t.label}</SelectItem>))}
                </SelectContent>
              </Select>
              <Input className="w-64" placeholder="Recherche par titre" value={searchTitle} onChange={(e) => { setSearchTitle(e.target.value); setPage(1); }} />
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className="w-24"><SelectValue placeholder="Taille" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Titre" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <Input placeholder="URL (vidéo/pdf)" value={form.contentUrl} onChange={(e) => setForm({ ...form, contentUrl: e.target.value })} />
              <Input placeholder="Durée (ex: 12 min)" className="w-32" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
              <Input type="number" placeholder="Ordre" className="w-20" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
              <Button
                onClick={() => {
                  if (!courseId) { toast({ title: 'Validation', description: 'Sélectionnez un cours', variant: 'destructive' }); return; }
                  if (!form.typeId) { toast({ title: 'Validation', description: 'Type requis', variant: 'destructive' }); return; }
                  if (!form.title || !form.contentUrl) { toast({ title: 'Validation', description: 'Titre et URL requis', variant: 'destructive' }); return; }
                  upsertMutation.mutate({ 
                    courseId, 
                    typeId: form.typeId, 
                    title: form.title, 
                    contentUrl: form.contentUrl, 
                    duration: form.duration || null,
                    order: form.order || 0,
                    description: form.description ?? null 
                  });
                }}
              >
                <Plus className="w-4 h-4 mr-1" /> Ajouter
              </Button>
              <Dialog open={playlistOpen} onOpenChange={setPlaylistOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (!courseId) { toast({ title: 'Validation', description: 'Sélectionnez un cours', variant: 'destructive' }); return; }
                      const videos = items.filter((it: PreviewItem) => it.courseId === courseId && ((it.previewType?.name ?? it.type) === 'video'));
                      if (videos.length === 0) { toast({ title: 'Aucun', description: 'Aucune vidéo pour ce cours' }); return; }
                      setPlaylist(videos);
                      setCurrentIndex(0);
                      setPlaylistOpen(true);
                    }}
                  >
                    <PlayCircle className="w-4 h-4 mr-1" /> Tout lire
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-none">
                  <DialogHeader className="sr-only">
                    <DialogTitle>Lecture de l'aperçu vidéo</DialogTitle>
                    <DialogDescription>Lecteur vidéo pour l'aperçu du cours</DialogDescription>
                  </DialogHeader>
                  <DialogTitle className="text-white px-4 pt-4">{playlist[currentIndex]?.title ?? 'Lecture'}</DialogTitle>
                  <div className="aspect-video w-full">
                    {playlist[currentIndex] ? (
                      <iframe
                        src={playlist[currentIndex].contentUrl || playlist[currentIndex].url}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    ) : null}
                  </div>
                  <div className="flex justify-between p-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                      disabled={currentIndex === 0}
                    >
                      Précédent
                    </Button>
                    <Button
                      onClick={() => {
                        if (currentIndex + 1 < playlist.length) setCurrentIndex(currentIndex + 1);
                        else setPlaylistOpen(false);
                      }}
                    >
                      {currentIndex + 1 < playlist.length ? 'Suivant' : 'Fermer'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                variant="outline"
                onClick={() => {
                  const byCourse = courseId ? items.filter((it: PreviewItem) => Number(it.courseId) === Number(courseId)) : items;
                  const byType = filterTypeId ? byCourse.filter((it: PreviewItem) => Number(it.typeId) === Number(filterTypeId)) : byCourse;
                  const byText = searchTitle ? byType.filter((it: PreviewItem) => String(it.title).toLowerCase().includes(searchTitle.toLowerCase())) : byType;
                  const toCSV = (v: string | number | null | undefined) => `"${String(v ?? '').replace(/"/g, '""')}"`;
                  const header = ['Titre', 'Type', 'URL', 'Durée'].map(v => `"${v}"`).join(',');
                  const lines = byText.map((it: PreviewItem) => [
                    toCSV(it.title),
                    toCSV(it.previewType?.label || it.type),
                    toCSV(it.contentUrl || it.url),
                    toCSV(it.duration),
                  ].join(','));
                  const content = [header, ...lines].join('\n');
                  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `apercus_${courseId ?? 'all'}_${new Date().toISOString().slice(0,10)}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Exporter CSV
              </Button>
            </div>
          </div>

          {(() => {
            const byCourse = courseId ? items.filter((it: PreviewItem) => Number(it.courseId) === Number(courseId)) : items;
            const byType = filterTypeId ? byCourse.filter((it: PreviewItem) => Number(it.typeId) === Number(filterTypeId)) : byCourse;
            const byText = searchTitle ? byType.filter((it: PreviewItem) => String(it.title).toLowerCase().includes(searchTitle.toLowerCase())) : byType;
            const total = byText.length;
            const totalPages = Math.max(1, Math.ceil(total / pageSize));
            const start = (page - 1) * pageSize;
            const pageItems = byText.slice(start, start + pageSize);
            return (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-muted-foreground">Résultats: {total} • Page {page} / {totalPages}</div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}><ChevronLeft className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}><ChevronRight className="w-4 h-4" /></Button>
                  </div>
                </div>
                <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Ordre</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Durée</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((it: PreviewItem) => (
                <TableRow 
                  key={it.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    alert(JSON.stringify(it, null, 2));
                  }}
                >
                  <TableCell className="font-mono text-xs">{it.order}</TableCell>
                  <TableCell>{it.previewType?.label || it.type}</TableCell>
                  <TableCell className="font-medium">{it.title}</TableCell>
                  <TableCell>{it.duration || '—'}</TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-muted-foreground">{it.contentUrl || it.url}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Supprimer cet élément ?')) deleteMutation.mutate(it.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Aucun élément</TableCell></TableRow>
              )}
            </TableBody>
                </Table>
              </>
            );
          })()}
        </CardContent>
      </Card>

      <AdminCoursePreviewTypes />
    </div>
  );
}

function AdminCoursePreviewTypes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', label: '', icon: 'Play' });

  const { data: types = [] } = useQuery({
    queryKey: ['admin', 'course-preview-types'],
    queryFn: async () => {
      const res = await api.request('GET', '/api/course_preview_types');
      const items = Array.isArray(res) ? res : res.data;
      return items || [];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (payload: Partial<PreviewType>) => api.request('POST', '/api/course_preview_types', { body: payload }),
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Type de ressource ajouté' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'course-preview-types'] });
      setForm({ name: '', label: '', icon: 'Play' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: "Ajout échoué", variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.request('DELETE', `/api/course_preview_types/${id}`),
    onSuccess: () => {
      toast({ title: 'Supprimé', description: 'Type supprimé' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'course-preview-types'] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion des Types de Ressources d’Aperçu</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <Input placeholder="Identifiant (ex: video, pdf)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Label (ex: Vidéo, PDF)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          <Select value={form.icon} onValueChange={(v) => setForm({ ...form, icon: v })}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Icon" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Play">Lecture</SelectItem>
              <SelectItem value="FileText">Document</SelectItem>
              <SelectItem value="Headphones">Audio</SelectItem>
              <SelectItem value="Download">Téléchargement</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => {
            if (!form.name || !form.label) return;
            upsertMutation.mutate(form);
          }}>
            <Plus className="w-4 h-4 mr-1" /> Ajouter Type
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Identifiant</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Icon</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {types.map((t: PreviewType) => (
              <TableRow key={t.id}>
                <TableCell>{t.name}</TableCell>
                <TableCell>{t.label}</TableCell>
                <TableCell>{t.icon}</TableCell>
                <TableCell>
                  <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(t.id)}><Trash2 className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
