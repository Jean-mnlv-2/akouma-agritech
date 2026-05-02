import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/integrations/api/client';
import { ShieldCheck, ShieldAlert, Loader2, Copy, RefreshCw, ExternalLink } from 'lucide-react';

type SertifierItem = { id?: string; _id?: string; name?: string; title?: string; subject?: string; createdAt?: string };

export function AdminSertifierSettings() {
  const { toast } = useToast();
  const [connStatus, setConnStatus] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [connMsg, setConnMsg] = useState<string>('');
  const [testing, setTesting] = useState(false);

  const [search, setSearch] = useState('');
  const [loadingResource, setLoadingResource] = useState<string | null>(null);
  const [designs, setDesigns] = useState<SertifierItem[]>([]);
  const [details, setDetails] = useState<SertifierItem[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<SertifierItem[]>([]);

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await api.request('GET', '/api/sertifier/test');
      setConnStatus('ok');
      setConnMsg(typeof res?.data === 'string' ? res.data : 'Connexion établie avec Sertifier.');
      toast({ title: 'Sertifier connecté', description: 'La clé API est valide.' });
    } catch (err) {
      setConnStatus('fail');
      const msg = err instanceof Error ? err.message : 'Connexion échouée';
      setConnMsg(msg);
      toast({ title: 'Échec connexion', description: msg, variant: 'destructive' });
    } finally {
      setTesting(false);
    }
  };

  const fetchResource = async (
    kind: 'designs' | 'details' | 'email-templates',
    setter: (items: SertifierItem[]) => void,
  ) => {
    setLoadingResource(kind);
    try {
      const res = await api.request('POST', `/api/sertifier/${kind}/search`, {
        body: { keyword: search || undefined, limit: 50 },
      });
      const data = res?.data;
      const items: SertifierItem[] = Array.isArray(data) ? data : (data?.items || data?.results || data?.data || []);
      setter(items);
      if (items.length === 0) {
        toast({ title: 'Aucun résultat', description: `Aucun ${kind} trouvé.` });
      }
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : `Impossible de récupérer ${kind}`,
        variant: 'destructive',
      });
    } finally {
      setLoadingResource(null);
    }
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast({ title: 'Copié', description: `ID copié : ${id}` });
  };

  const renderTable = (items: SertifierItem[], kind: string) => {
    if (items.length === 0) {
      return (
        <div className="text-center text-sm text-muted-foreground py-8">
          Aucune donnée chargée. Cliquez sur « Rechercher » pour interroger Sertifier.
        </div>
      );
    }
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>ID</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, idx) => {
            const id = item.id || item._id || '';
            const name = item.name || item.title || item.subject || `${kind} ${idx + 1}`;
            return (
              <TableRow key={id || idx}>
                <TableCell className="font-medium">{name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{id}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => copyId(id)} disabled={!id}>
                    <Copy className="w-3 h-3 mr-1" /> Copier l'ID
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Configuration Sertifier
              </CardTitle>
              <CardDescription>
                Gérez l'intégration Sertifier pour l'émission de certificats authentifiés.
                La clé API (SERTIFIER_SECRET_KEY) est stockée côté serveur.
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <a href="https://sertifier.com" target="_blank" rel="noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" /> Ouvrir Sertifier
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Button onClick={handleTest} disabled={testing}>
              {testing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Test en cours...</> : <><ShieldCheck className="w-4 h-4 mr-2" /> Tester la connexion</>}
            </Button>
            {connStatus === 'ok' && (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                <ShieldCheck className="w-3 h-3 mr-1" /> Connecté
              </Badge>
            )}
            {connStatus === 'fail' && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                <ShieldAlert className="w-3 h-3 mr-1" /> Échec
              </Badge>
            )}
          </div>
          {connMsg && (
            <p className="text-sm text-muted-foreground border rounded-md p-3 bg-muted/30">{connMsg}</p>
          )}
          <div className="rounded-md border border-dashed p-4 bg-muted/20 space-y-2">
            <p className="text-sm font-semibold">Comment configurer un cours :</p>
            <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
              <li>Recherchez ci-dessous vos Designs, Details et Email Templates Sertifier.</li>
              <li>Copiez les IDs correspondants.</li>
              <li>Ouvrez l'onglet « Cours » → modifier un cours → section « Certification Sertifier ».</li>
              <li>Collez les 3 IDs et enregistrez.</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ressources Sertifier</CardTitle>
          <CardDescription>Recherchez vos designs, détails et modèles d'email pour récupérer les IDs nécessaires.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="sertifier_search">Mot-clé de recherche (optionnel)</Label>
              <Input
                id="sertifier_search"
                placeholder="Ex: KILIMO, Certificate..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <Tabs defaultValue="designs" className="w-full">
            <TabsList>
              <TabsTrigger value="designs">Designs</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="emails">Email Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="designs" className="space-y-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchResource('designs', setDesigns)}
                disabled={loadingResource === 'designs'}
              >
                {loadingResource === 'designs' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Rechercher Designs
              </Button>
              {renderTable(designs, 'Design')}
            </TabsContent>

            <TabsContent value="details" className="space-y-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchResource('details', setDetails)}
                disabled={loadingResource === 'details'}
              >
                {loadingResource === 'details' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Rechercher Details
              </Button>
              {renderTable(details, 'Detail')}
            </TabsContent>

            <TabsContent value="emails" className="space-y-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchResource('email-templates', setEmailTemplates)}
                disabled={loadingResource === 'email-templates'}
              >
                {loadingResource === 'email-templates' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Rechercher Email Templates
              </Button>
              {renderTable(emailTemplates, 'Email Template')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminSertifierSettings;