import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/integrations/api/client';
import { Award, Download, FileText, Loader2, RefreshCw, ShieldCheck, ShieldAlert, Clock, ExternalLink } from 'lucide-react';

interface CertRow {
  id: number;
  userId: string;
  courseId: number;
  certificateNumber: string;
  score: number | null;
  completionDate: string;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  attempts: number;
  lastError?: string | null;
  credentialUrl?: string | null;
  campaignId?: string | null;
  issuedAt?: string | null;
  createdAt: string;
  user?: { id: string; fullName?: string | null; email?: string | null };
  course?: { id: number; title: string; slug?: string };
}

const statusBadge = (s: CertRow['status']) => {
  switch (s) {
    case 'sent': return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300"><ShieldCheck className="w-3 h-3 mr-1" />Émis</Badge>;
    case 'failed': return <Badge variant="destructive"><ShieldAlert className="w-3 h-3 mr-1" />Échec</Badge>;
    case 'processing': return <Badge className="bg-blue-100 text-blue-700 border-blue-300"><Loader2 className="w-3 h-3 mr-1 animate-spin" />En cours</Badge>;
    default: return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
  }
};

export function AdminCertificates() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const { data: certs = [], isLoading } = useQuery<CertRow[]>({
    queryKey: ['admin', 'certificates', statusFilter],
    queryFn: async () => {
      const url = statusFilter === 'all' ? '/api/certificates/admin' : `/api/certificates/admin?status=${statusFilter}`;
      const res = await api.request('GET', url);
      return res?.data || [];
    },
    refetchInterval: 15000,
  });

  const { data: stats } = useQuery<{ stats: Record<string, number>; sertifierConfigured: boolean }>({
    queryKey: ['admin', 'certificates', 'queue'],
    queryFn: async () => {
      const res = await api.request('GET', '/api/certificates/queue/stats');
      return res?.data || { stats: {}, sertifierConfigured: false };
    },
    refetchInterval: 10000,
  });

  const retry = useMutation({
    mutationFn: async (id: number) => api.request('POST', `/api/certificates/${id}/retry`),
    onSuccess: () => {
      toast({ title: 'Re-mis en file', description: 'Le certificat a été remis en file d\'émission.' });
      qc.invalidateQueries({ queryKey: ['admin', 'certificates'] });
    },
    onError: () => toast({ title: 'Erreur', description: 'Impossible de réessayer.', variant: 'destructive' }),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return certs;
    return certs.filter(c =>
      c.certificateNumber.toLowerCase().includes(q) ||
      c.user?.email?.toLowerCase().includes(q) ||
      c.user?.fullName?.toLowerCase().includes(q) ||
      c.course?.title?.toLowerCase().includes(q)
    );
  }, [certs, search]);

  const exportCSV = () => {
    const header = ['N° Certificat', 'Étudiant', 'Email', 'Cours', 'Score', 'Date complétion', 'Statut', 'Émis le', 'URL Sertifier'];
    const rows = filtered.map(c => [
      c.certificateNumber,
      c.user?.fullName || '',
      c.user?.email || '',
      c.course?.title || '',
      c.score ?? '',
      new Date(c.completionDate).toLocaleDateString('fr-FR'),
      c.status,
      c.issuedAt ? new Date(c.issuedAt).toLocaleString('fr-FR') : '',
      c.credentialUrl || '',
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificats-kilimo-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const rowsHtml = filtered.map(c => `
      <tr>
        <td>${c.certificateNumber}</td>
        <td>${c.user?.fullName || ''}<br/><small>${c.user?.email || ''}</small></td>
        <td>${c.course?.title || ''}</td>
        <td>${c.score ?? '-'}%</td>
        <td>${new Date(c.completionDate).toLocaleDateString('fr-FR')}</td>
        <td>${c.status}</td>
        <td>${c.issuedAt ? new Date(c.issuedAt).toLocaleDateString('fr-FR') : '-'}</td>
      </tr>
    `).join('');
    w.document.write(`<!DOCTYPE html><html><head><title>Certificats KILIMO</title>
      <style>
        body { font-family: Inter, system-ui, sans-serif; padding: 24px; color: #1a1a1a; }
        h1 { color: #1E5B37; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 16px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background: #1E5B37; color: white; }
        tr:nth-child(even) { background: #f6f8f6; }
      </style></head><body>
      <h1>Certificats KILIMO E-Learning</h1>
      <p>Export du ${new Date().toLocaleDateString('fr-FR')} — ${filtered.length} certificat(s)</p>
      <table><thead><tr>
        <th>N° Certificat</th><th>Étudiant</th><th>Cours</th><th>Score</th><th>Complété</th><th>Statut</th><th>Émis</th>
      </tr></thead><tbody>${rowsHtml}</tbody></table>
      <script>setTimeout(() => window.print(), 400);</script>
      </body></html>`);
    w.document.close();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2"><Award className="w-5 h-5" /> Certificats émis</CardTitle>
            <CardDescription>Suivi de l'émission Sertifier par étudiant et par cours</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-2" />CSV</Button>
            <Button variant="outline" size="sm" onClick={exportPDF}><FileText className="w-4 h-4 mr-2" />PDF</Button>
          </div>
        </div>
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {(['pending', 'processing', 'sent', 'failed'] as const).map(s => (
              <div key={s} className="p-3 rounded-lg border bg-muted/30 text-center">
                <p className="text-xs text-muted-foreground capitalize">{s}</p>
                <p className="text-2xl font-bold">{stats.stats?.[s] ?? 0}</p>
              </div>
            ))}
          </div>
        )}
        {stats && !stats.sertifierConfigured && (
          <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-sm">
            ⚠️ SERTIFIER_SECRET_KEY non configurée — l'émission échouera tant que la clé n'est pas définie côté serveur.
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 mb-4 flex-wrap">
          <Input
            placeholder="Rechercher (étudiant, cours, n° certificat)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="processing">En cours</SelectItem>
              <SelectItem value="sent">Émis</SelectItem>
              <SelectItem value="failed">Échec</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Aucun certificat à afficher.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Certificat</TableHead>
                <TableHead>Étudiant</TableHead>
                <TableHead>Cours</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Tentatives</TableHead>
                <TableHead>Émis le</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.certificateNumber}</TableCell>
                  <TableCell>
                    <div className="font-medium">{c.user?.fullName || '—'}</div>
                    <div className="text-xs text-muted-foreground">{c.user?.email}</div>
                  </TableCell>
                  <TableCell>{c.course?.title}</TableCell>
                  <TableCell>{c.score != null ? `${c.score}%` : '—'}</TableCell>
                  <TableCell>
                    {statusBadge(c.status)}
                    {c.status === 'failed' && c.lastError && (
                      <div className="text-xs text-destructive mt-1 max-w-[200px] truncate" title={c.lastError}>{c.lastError}</div>
                    )}
                  </TableCell>
                  <TableCell>{c.attempts}</TableCell>
                  <TableCell>{c.issuedAt ? new Date(c.issuedAt).toLocaleString('fr-FR') : '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {c.credentialUrl && (
                        <Button asChild variant="outline" size="sm">
                          <a href={c.credentialUrl} target="_blank" rel="noreferrer" title="Voir sur Sertifier"><ExternalLink className="w-4 h-4" /></a>
                        </Button>
                      )}
                      {c.status !== 'sent' && (
                        <Button size="sm" variant="outline" onClick={() => retry.mutate(c.id)} disabled={retry.isPending} title="Relancer">
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
