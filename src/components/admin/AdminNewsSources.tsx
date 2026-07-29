import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Loader2, PlayCircle, CheckCircle2, XCircle, HelpCircle, FlaskConical, Clock, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/integrations/api/client';

type SourceType = 'rss' | 'web';
type SourceLanguage = 'fr' | 'en';
type SourceContentType = 'news' | 'event';

// Doit rester synchronisé avec NEWS_SOURCE_CATEGORIES côté serveur
// (server/src/config/newsSources.ts) — c'est le serveur qui fait autorité
// et rejette toute valeur hors de cette liste, ce menu ne fait qu'éviter
// une saisie libre côté UI.
const CATEGORIES = ['Local', 'Régional', 'Agriculture', 'Technologie', 'Innovation', 'Environnement', 'Économie', 'Formation'];

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

interface NewsSourceRow {
  id: number;
  name: string;
  url: string;
  type: SourceType;
  contentType: SourceContentType;
  language: SourceLanguage;
  category: string;
  enabled: boolean;
  scheduleTimes: string[];
  lastStatus: 'ok' | 'not_modified' | 'error' | null;
  lastError: string | null;
  lastRunAt: string | null;
  lastArticleCount: number;
  consecutiveFailures: number;
}

interface TestResult {
  ok: boolean;
  articlesFound: number;
  sample: { title: string; sourceUrl: string }[];
  error?: string;
}

const EMPTY_FORM = {
  name: '',
  url: '',
  type: 'rss' as SourceType,
  contentType: 'news' as SourceContentType,
  language: 'fr' as SourceLanguage,
  category: 'Régional',
  enabled: true,
  scheduleTimes: [] as string[],
};

function StatusBadge({ source }: { source: NewsSourceRow }) {
  if (!source.lastStatus) {
    return <Badge variant="outline" className="gap-1"><HelpCircle className="w-3 h-3" />Jamais exécutée</Badge>;
  }
  if (source.lastStatus === 'error') {
    return (
      <Badge variant="destructive" className="gap-1" title={source.lastError || ''}>
        <XCircle className="w-3 h-3" />
        Erreur ({source.consecutiveFailures}x)
      </Badge>
    );
  }
  return (
    <Badge variant="default" className="gap-1">
      <CheckCircle2 className="w-3 h-3" />
      {source.lastStatus === 'not_modified' ? 'Inchangée' : `OK (${source.lastArticleCount})`}
    </Badge>
  );
}

export function AdminNewsSources() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<NewsSourceRow | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testedFor, setTestedFor] = useState<string | null>(null); // `${url}|${type}|${contentType}` du dernier test réussi
  const [testing, setTesting] = useState(false);
  const [newTime, setNewTime] = useState('');

  const { data: sources = [], isLoading } = useQuery<NewsSourceRow[]>({
    queryKey: ['admin', 'news-sources'],
    queryFn: async () => {
      const res = await api.request('GET', '/api/admin/news-scraper/sources');
      return res.data || [];
    },
    staleTime: 15000,
    refetchOnWindowFocus: false,
  });

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setTestResult(null);
    setTestedFor(null);
    setNewTime('');
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (source: NewsSourceRow) => {
    setEditing(source);
    setForm({
      name: source.name,
      url: source.url,
      type: source.type,
      contentType: source.contentType,
      language: source.language,
      category: source.category,
      enabled: source.enabled,
      scheduleTimes: source.scheduleTimes || [],
    });
    // Une source déjà enregistrée est considérée comme "testée" pour sa configuration actuelle
    setTestResult(null);
    setTestedFor(`${source.url}|${source.type}|${source.contentType}`);
    setNewTime('');
    setDialogOpen(true);
  };

  const updateForm = (patch: Partial<typeof form>) => {
    const next = { ...form, ...patch };
    setForm(next);
    // Toute modification de l'URL, du type ou du type de contenu invalide le
    // test précédent — un test "actualité" ne garantit rien pour un flux
    // reconfiguré en "événement" (l'extraction structurée est vérifiée en plus).
    if (patch.url !== undefined || patch.type !== undefined || patch.contentType !== undefined) {
      setTestResult(null);
    }
  };

  const addScheduleTime = () => {
    if (!TIME_PATTERN.test(newTime)) {
      toast({ title: 'Format invalide', description: 'Utilisez le format HH:MM (ex : 08:00)', variant: 'destructive' });
      return;
    }
    if (form.scheduleTimes.includes(newTime)) {
      setNewTime('');
      return;
    }
    updateForm({ scheduleTimes: [...form.scheduleTimes, newTime].sort() });
    setNewTime('');
  };

  const removeScheduleTime = (t: string) => {
    updateForm({ scheduleTimes: form.scheduleTimes.filter((x) => x !== t) });
  };

  const testMutation = useMutation({
    mutationFn: async () => {
      setTesting(true);
      try {
        const res = await api.request('POST', '/api/admin/news-scraper/sources/test', {
          body: { url: form.url, type: form.type, contentType: form.contentType },
        });
        return res.data as TestResult;
      } finally {
        setTesting(false);
      }
    },
    onSuccess: (result) => {
      setTestResult(result);
      if (result.ok) setTestedFor(`${form.url}|${form.type}|${form.contentType}`);
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Le test a échoué de manière inattendue', variant: 'destructive' });
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async () => {
      if (editing) return api.request('PUT', `/api/admin/news-scraper/sources/${editing.id}`, { body: form });
      return api.request('POST', '/api/admin/news-scraper/sources', { body: form });
    },
    onSuccess: () => {
      toast({ title: 'Succès', description: `Source ${editing ? 'modifiée' : 'créée'}` });
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'news-sources'] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : `Impossible de ${editing ? 'modifier' : 'créer'} la source`;
      toast({ title: 'Erreur', description: message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.request('DELETE', `/api/admin/news-scraper/sources/${id}`),
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Source supprimée' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'news-sources'] });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de supprimer la source', variant: 'destructive' });
    },
  });

  const runMutation = useMutation({
    mutationFn: async (id: number) => api.request('POST', `/api/admin/news-scraper/scrape/${id}`),
    onSuccess: (res: any) => {
      const r = res?.result;
      toast({
        title: 'Scraping lancé',
        description: r ? `${r.saved} nouvel(le)s élément(s) sur ${r.total} trouvé(s)${r.skipped ? ` (${r.skipped} ignoré(s), voir explication ci-dessous)` : ''}` : 'Terminé',
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'news-sources'] });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Échec du scraping de cette source', variant: 'destructive' });
    },
  });

  const toggleEnabled = (source: NewsSourceRow, enabled: boolean) => {
    api.request('PUT', `/api/admin/news-scraper/sources/${source.id}`, { body: { enabled } })
      .then(() => queryClient.invalidateQueries({ queryKey: ['admin', 'news-sources'] }))
      .catch(() => toast({ title: 'Erreur', description: 'Impossible de changer le statut', variant: 'destructive' }));
  };

  const handleDelete = (id: number) => {
    if (!confirm('Supprimer cette source ? Les articles/événements déjà importés ne sont pas affectés.')) return;
    deleteMutation.mutate(id);
  };

  // Garde-fou principal : impossible d'enregistrer sans un test réussi pour
  // la configuration (URL/type/type de contenu) exacte actuellement saisie.
  const currentKey = `${form.url}|${form.type}|${form.contentType}`;
  const isTestedAndValid = testedFor === currentKey;
  const canSubmit = form.name.trim() && form.url.trim() && isTestedAndValid;

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
            <CardTitle>Sources RSS / scraping (actualités & événements)</CardTitle>
            <CardDescription className="max-w-2xl">
              Sources déterministes que DeerFlow peut déclencher directement, sans navigation web coûteuse —
              ou qui se déclenchent automatiquement selon les horaires programmés ci-dessous. Toute nouvelle
              source doit être testée avec succès avant d'être enregistrée. Pour un événement, un test réussi
              exige en plus des données structurées (Schema.org) réellement trouvées sur la page — une source
              événement sans ça ne créera jamais rien automatiquement (voir l'explication dans le résultat du
              test).
            </CardDescription>
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle source
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Contenu</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Langue</TableHead>
              <TableHead>Programmation</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.map((source) => (
              <TableRow key={source.id}>
                <TableCell className="font-medium max-w-xs">
                  <div>{source.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{source.url}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={source.contentType === 'event' ? 'default' : 'secondary'}>
                    {source.contentType === 'event' ? 'Événement' : 'Actualité'}
                  </Badge>
                </TableCell>
                <TableCell><Badge variant="outline">{source.type === 'rss' ? 'RSS' : 'Web'}</Badge></TableCell>
                <TableCell>{source.language.toUpperCase()}</TableCell>
                <TableCell>
                  {source.scheduleTimes?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {source.scheduleTimes.map((t) => (
                        <Badge key={t} variant="outline" className="gap-1"><Clock className="w-3 h-3" />{t}</Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Manuel / DeerFlow</span>
                  )}
                </TableCell>
                <TableCell><StatusBadge source={source} /></TableCell>
                <TableCell>
                  <Switch checked={source.enabled} onCheckedChange={(v) => toggleEnabled(source, v)} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => runMutation.mutate(source.id)} disabled={runMutation.isPending} title="Lancer maintenant">
                      <PlayCircle className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEdit(source)} title="Modifier">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(source.id)} title="Supprimer">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {sources.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Aucune source configurée.</p>
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier la source' : 'Nouvelle source'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="src-name">Nom</Label>
              <Input id="src-name" value={form.name} onChange={(e) => updateForm({ name: e.target.value })} placeholder="Ex : AllAfrica — Agriculture" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="src-content-type">Type de contenu</Label>
                <Select value={form.contentType} onValueChange={(v: SourceContentType) => updateForm({ contentType: v })}>
                  <SelectTrigger id="src-content-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="news">Actualité</SelectItem>
                    <SelectItem value="event">Événement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="src-type">Mécanisme</Label>
                <Select value={form.type} onValueChange={(v: SourceType) => updateForm({ type: v })}>
                  <SelectTrigger id="src-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rss">RSS (flux structuré, recommandé)</SelectItem>
                    <SelectItem value="web">Web (scraping HTML heuristique)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.contentType === 'event' && (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-muted-foreground">
                Un événement n'est créé que si la page de chaque élément trouvé contient des données structurées
                Schema.org (<code>@type: "Event"</code> avec date et lieu). Sans ça, rien n'est créé
                automatiquement pour cet élément — testez la source pour vérifier avant d'enregistrer.
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="src-lang">Langue</Label>
                <Select value={form.language} onValueChange={(v: SourceLanguage) => updateForm({ language: v })}>
                  <SelectTrigger id="src-lang"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">Anglais</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="src-category">Catégorie</Label>
                <Select value={form.category} onValueChange={(v: string) => updateForm({ category: v })}>
                  <SelectTrigger id="src-category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="src-url">URL {form.type === 'rss' ? 'du flux RSS/Atom/RDF' : 'de la page à scraper'}</Label>
              <Input id="src-url" value={form.url} onChange={(e) => updateForm({ url: e.target.value })} placeholder="https://..." />
            </div>

            <div className="rounded-md border p-3 space-y-2 bg-muted/30">
              <Button type="button" variant="secondary" size="sm" onClick={() => testMutation.mutate()} disabled={!form.url.trim() || testing}>
                {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FlaskConical className="w-4 h-4 mr-2" />}
                Tester la source
              </Button>
              {testResult && (
                testResult.ok ? (
                  <div className="text-sm space-y-1">
                    <p className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> {testResult.articlesFound} élément(s) détecté(s)
                    </p>
                    <ul className="text-xs text-muted-foreground list-disc pl-4">
                      {testResult.sample.map((a, i) => <li key={i} className="truncate">{a.title}</li>)}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-destructive flex items-start gap-1">
                    <XCircle className="w-4 h-4 shrink-0 mt-0.5" /> {testResult.error || 'Échec du test'}
                  </p>
                )
              )}
              {!testResult && isTestedAndValid && (
                <p className="text-xs text-muted-foreground">Déjà testée avec succès pour cette configuration.</p>
              )}
              {!isTestedAndValid && !testResult && (
                <p className="text-xs text-muted-foreground">
                  Un test réussi est requis avant d'enregistrer — protège contre les flux cassés ou les pages mal structurées.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Programmation automatique (optionnelle)</Label>
              <p className="text-xs text-muted-foreground">
                Horaires (heure du serveur) auxquels KILIMO déclenche automatiquement cette source, chaque
                jour — indépendant de DeerFlow, qui n'est pas garanti actif à un instant précis. Laissez vide
                pour un déclenchement uniquement manuel ou par DeerFlow.
              </p>
              <div className="flex flex-wrap gap-2">
                {form.scheduleTimes.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1 pr-1">
                    <Clock className="w-3 h-3" />
                    {t}
                    <button type="button" onClick={() => removeScheduleTime(t)} className="ml-1 hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-32"
                />
                <Button type="button" variant="outline" size="sm" onClick={addScheduleTime}>
                  <Plus className="w-4 h-4 mr-1" /> Ajouter l'horaire
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch id="src-active" checked={form.enabled} onCheckedChange={(v) => updateForm({ enabled: v })} />
              <Label htmlFor="src-active">Active</Label>
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
