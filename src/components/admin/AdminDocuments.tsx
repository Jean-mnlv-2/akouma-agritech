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
import { Plus, Edit, Trash2, Loader2, RefreshCw, FileText, Upload } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/integrations/api/client';

type DocumentTier = 'standard' | 'premium';

interface SourceEntry {
  name: string;
  url?: string;
}

interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  description?: string | null;
  sourceType: string;
  tier: DocumentTier;
  pdfUrl?: string | null;
  sources?: SourceEntry[] | null;
  region?: string | null;
  isActive: boolean;
  isIndexed: boolean;
  createdAt: string;
}

const TIER_LABELS: Record<DocumentTier, string> = {
  standard: 'Standard',
  premium: 'Premium',
};

const EMPTY_FORM = { title: '', content: '', description: '', tier: 'standard' as DocumentTier, region: '', sourcesText: '', isActive: true };

// "Nom | URL" (une par ligne) <-> [{ name, url? }] — évite un éditeur de
// liste dynamique pour un champ que l'admin remplit rarement à la main
// (surtout peuplé par DeerFlow via l'API interne).
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

export function AdminDocuments() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<KnowledgeDocument | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [mode, setMode] = useState<'text' | 'pdf'>('text');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const { data: documents = [], isLoading } = useQuery<KnowledgeDocument[]>({
    queryKey: ['admin', 'documents'],
    queryFn: async () => {
      const res = await api.request('GET', '/api/chat/admin/documents');
      return res.data || [];
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setMode('text');
    setPdfFile(null);
    setDialogOpen(true);
  };

  const openEdit = (doc: KnowledgeDocument) => {
    setEditing(doc);
    setForm({
      title: doc.title,
      content: doc.content,
      description: doc.description || '',
      tier: doc.tier,
      region: doc.region || '',
      sourcesText: sourcesToText(doc.sources),
      isActive: doc.isActive,
    });
    setMode('text'); // toujours éditer en texte, même pour un document créé depuis un PDF
    setPdfFile(null);
    setDialogOpen(true);
  };

  const upsertMutation = useMutation({
    mutationFn: async () => {
      if (mode === 'pdf' && !editing) {
        if (!pdfFile) throw new Error('Sélectionnez un fichier PDF');
        setUploadingPdf(true);
        try {
          const fd = new FormData();
          fd.append('file', pdfFile);
          const uploaded = await api.request('POST', '/api/upload', { body: fd });
          return api.request('POST', '/api/chat/admin/documents/from-pdf', {
            body: { title: form.title, description: form.description, tier: form.tier, pdfUrl: uploaded.url },
          });
        } finally {
          setUploadingPdf(false);
        }
      }
      const { sourcesText, ...rest } = form;
      const sources = textToSources(sourcesText);
      const body = { ...rest, sources: sources.length > 0 ? sources : undefined, region: form.region || undefined };
      if (editing) return api.request('PUT', `/api/chat/admin/documents/${editing.id}`, { body });
      return api.request('POST', '/api/chat/admin/documents', { body });
    },
    onSuccess: () => {
      toast({ title: 'Succès', description: `Document ${editing ? 'modifié' : 'créé'}. Pense à le (ré)indexer.` });
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'documents'] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : `Impossible de ${editing ? 'modifier' : 'créer'} le document`;
      toast({ title: 'Erreur', description: message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.request('DELETE', `/api/chat/admin/documents/${id}`),
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Document supprimé' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'documents'] });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de supprimer le document', variant: 'destructive' });
    },
  });

  const indexMutation = useMutation({
    mutationFn: async (id: string) => api.request('POST', `/api/chat/admin/documents/${id}/index`),
    onSuccess: () => {
      toast({ title: 'Indexé', description: "Le document est maintenant disponible pour l'assistant." });
      queryClient.invalidateQueries({ queryKey: ['admin', 'documents'] });
    },
    onError: () => {
      toast({ title: 'Erreur', description: "Échec de l'indexation", variant: 'destructive' });
    },
  });

  const handleDelete = (id: string) => {
    if (!confirm('Supprimer ce document ? Il sera aussi retiré de la base de connaissances RAG.')) return;
    deleteMutation.mutate(id);
  };

  const canSubmit = form.title.trim() && (mode === 'text' ? form.content.trim() : !!pdfFile || !!editing);

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
            <CardTitle>Documents RAG (Agriconsulting)</CardTitle>
            <CardDescription>
              Contenus qui enrichissent l'assistant IA au-delà des données vitrine (semences, cours,
              actualités, boutique, pages légales — toujours gratuites). Palier <strong>Standard</strong> :
              itinéraires techniques, fiches sanitaires, conseils de lutte. Palier <strong>Premium</strong> :
              diagnostic environnemental, planification technico-économique complète, stratégie de gestion,
              accès marché.
            </CardDescription>
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau document
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead>Région</TableHead>
              <TableHead>Sources</TableHead>
              <TableHead>Palier</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Indexé</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => openEdit(doc)}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {doc.title}
                    {doc.pdfUrl && (
                      <a
                        href={doc.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground hover:text-primary"
                        title="Voir le PDF original"
                      >
                        <FileText className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{doc.region || '—'}</TableCell>
                <TableCell>
                  {doc.sources && doc.sources.length > 0 ? (
                    <Badge variant="outline" title={doc.sources.map((s) => s.name).join(', ')}>{doc.sources.length}</Badge>
                  ) : (
                    <Badge variant="destructive" title="Aucune source citée">0</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={doc.tier === 'premium' ? 'default' : 'outline'}>{TIER_LABELS[doc.tier] || doc.tier}</Badge>
                </TableCell>
                <TableCell><Badge variant="outline">{doc.sourceType}</Badge></TableCell>
                <TableCell>
                  <Badge variant={doc.isActive ? 'default' : 'secondary'}>{doc.isActive ? 'Actif' : 'Inactif'}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={doc.isIndexed ? 'default' : 'outline'}>{doc.isIndexed ? 'Oui' : 'Non'}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); indexMutation.mutate(doc.id); }} disabled={indexMutation.isPending}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(doc); }}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {documents.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Aucun document. Ajoutez-en un pour enrichir l'assistant Agriconsulting.</p>
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier le document' : 'Nouveau document'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editing && (
              <div className="flex gap-2">
                <Button type="button" size="sm" variant={mode === 'text' ? 'default' : 'outline'} onClick={() => setMode('text')}>
                  Texte
                </Button>
                <Button type="button" size="sm" variant={mode === 'pdf' ? 'default' : 'outline'} onClick={() => setMode('pdf')}>
                  <Upload className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="doc-title">Titre</Label>
              <Input id="doc-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-description">Description (optionnelle)</Label>
              <Input id="doc-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-region">Portée géographique</Label>
              <Input id="doc-region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="ex: Afrique, Cameroun, Afrique de l'Ouest..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-sources">Sources (une par ligne, format "Nom | URL")</Label>
              <Textarea
                id="doc-sources"
                rows={3}
                value={form.sourcesText}
                onChange={(e) => setForm({ ...form, sourcesText: e.target.value })}
                placeholder={'IRAD Cameroun | https://irad-cameroun.cm\nFAO'}
              />
              <p className="text-xs text-muted-foreground">
                Centres de recherche/institutions dont provient ce contenu — essentiel pour vérifier la
                fiabilité d'un brouillon rédigé par DeerFlow avant de l'activer.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-tier">Palier d'accès</Label>
              <Select value={form.tier} onValueChange={(v: DocumentTier) => setForm({ ...form, tier: v })}>
                <SelectTrigger id="doc-tier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard — itinéraires techniques, fiches sanitaires, lutte</SelectItem>
                  <SelectItem value="premium">Premium — planification agropastorale complète, marché</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {mode === 'text' || editing ? (
              <div className="space-y-2">
                <Label htmlFor="doc-content">Contenu {editing?.pdfUrl && '(texte extrait du PDF — modifiable)'}</Label>
                <Textarea id="doc-content" rows={10} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="doc-pdf">Fichier PDF</Label>
                <Input
                  id="doc-pdf"
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground">
                  Le texte est extrait automatiquement pour l'assistant IA. Le PDF original (avec ses
                  images) reste consultable depuis la liste, mais les images ne sont pas exploitées par
                  l'IA.
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch id="doc-active" checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              <Label htmlFor="doc-active">Actif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={() => upsertMutation.mutate()} disabled={!canSubmit || upsertMutation.isPending || uploadingPdf}>
              {(upsertMutation.isPending || uploadingPdf) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editing ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
