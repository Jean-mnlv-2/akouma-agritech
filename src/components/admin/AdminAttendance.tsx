import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/integrations/api/client';
import { useToast } from '@/hooks/use-toast';
import { escapeHtml } from '@/lib/utils';
import { Loader2, CheckCircle, XCircle, Calendar, AlertTriangle, Users, Download, FileText } from 'lucide-react';

interface Schedule {
  id: number;
  enrollmentId: number;
  userId: string;
  courseId: number;
  scheduledDate: string;
  timeSlot: string;
  status: string;
  isLocked: boolean;
  attendedAt: string | null;
  absenceCount: number;
  user?: { id: string; fullName: string; email: string };
  course?: { id: number; title: string };
}

export function AdminAttendance() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: schedules = [], isLoading } = useQuery<Schedule[]>({
    queryKey: ['admin', 'schedules'],
    queryFn: async () => {
      const res = await api.request('GET', '/api/course_schedules/admin');
      return res.data || [];
    },
    staleTime: 15000,
  });

  const attendMutation = useMutation({
    mutationFn: async (id: number) => api.request('PUT', `/api/course_schedules/${id}/attend`),
    onSuccess: () => {
      toast({ title: 'Présence enregistrée', description: 'L\'étudiant a été marqué présent.' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'schedules'] });
    },
    onError: () => toast({ title: 'Erreur', variant: 'destructive' }),
  });

  const absentMutation = useMutation({
    mutationFn: async (id: number) => api.request('PUT', `/api/course_schedules/${id}/absent`),
    onSuccess: (data: any) => {
      const msg = data?.penalty
        ? `Absence enregistrée. ${data.totalAbsences} absences — pénalité de progression appliquée !`
        : `Absence enregistrée. ${data?.totalAbsences || 0} absence(s) au total.`;
      toast({ title: 'Absence enregistrée', description: msg, variant: data?.penalty ? 'destructive' : 'default' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'schedules'] });
    },
    onError: () => toast({ title: 'Erreur', variant: 'destructive' }),
  });

  const filtered = statusFilter === 'all' ? schedules : schedules.filter(s => s.status === statusFilter);

  const stats = {
    total: schedules.length,
    scheduled: schedules.filter(s => s.status === 'scheduled').length,
    attended: schedules.filter(s => s.status === 'attended').length,
    absent: schedules.filter(s => s.status === 'absent').length,
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'attended':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Présent</Badge>;
      case 'absent':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Absent</Badge>;
      default:
        return <Badge variant="outline"><Calendar className="w-3 h-3 mr-1" />Planifié</Badge>;
    }
  };

  const exportCSV = () => {
    const headers = ['Étudiant', 'Email', 'Cours', 'Date', 'Créneau', 'Statut', 'Absences'];
    const rows = filtered.map(s => [
      s.user?.fullName || '—',
      s.user?.email || '',
      s.course?.title || `Cours #${s.courseId}`,
      formatDate(s.scheduledDate),
      s.timeSlot,
      s.status === 'attended' ? 'Présent' : s.status === 'absent' ? 'Absent' : 'Planifié',
      String(s.absenceCount),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presences_kilimo_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Export CSV', description: 'Le fichier CSV a été téléchargé.' });
  };

  const exportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: 'Erreur', description: 'Vérifiez votre bloqueur de popups.', variant: 'destructive' });
      return;
    }

    // Nom/email d'utilisateur et titre de cours viennent de la base : à
    // échapper avant injection dans du HTML construit à la main, sans quoi
    // une valeur piégée s'exécute dans la session admin (XSS stocké).
    const tableRows = filtered.map(s => `
      <tr style="${s.absenceCount >= 3 ? 'background:#fef2f2;' : ''}">
        <td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(s.user?.fullName || '—')}<br/><small style="color:#666;">${escapeHtml(s.user?.email || '')}</small></td>
        <td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(s.course?.title || `Cours #${s.courseId}`)}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(formatDate(s.scheduledDate))}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(s.timeSlot)}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">
          <span style="padding:2px 8px;border-radius:12px;font-size:12px;${
            s.status === 'attended' ? 'background:#dcfce7;color:#166534;' :
            s.status === 'absent' ? 'background:#fecaca;color:#991b1b;' :
            'background:#f3f4f6;color:#374151;'
          }">${s.status === 'attended' ? 'Présent' : s.status === 'absent' ? 'Absent' : 'Planifié'}</span>
        </td>
        <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;font-weight:bold;${s.absenceCount >= 3 ? 'color:#dc2626;' : ''}">${s.absenceCount}${s.absenceCount >= 3 ? ' ⚠️' : ''}</td>
      </tr>
    `).join('');

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Rapport de Présences - KILIMO</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:Arial,sans-serif; padding:40px; }
        h1 { color:#1E5B37; margin-bottom:8px; }
        .stats { display:flex; gap:24px; margin:16px 0 24px; }
        .stat { padding:12px 20px; border-radius:8px; background:#f9fafb; border:1px solid #e5e7eb; }
        .stat strong { display:block; font-size:20px; }
        table { width:100%; border-collapse:collapse; font-size:13px; }
        th { background:#1E5B37; color:white; padding:10px 8px; text-align:left; border:1px solid #1E5B37; }
        @media print { body { padding:20px; } }
      </style>
    </head><body>
      <h1>📋 Rapport de Présences - KILIMO E-Learning</h1>
      <p style="color:#666;margin-bottom:16px;">Généré le ${new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}</p>
      <div class="stats">
        <div class="stat"><strong>${stats.total}</strong><span>Total</span></div>
        <div class="stat"><strong style="color:#2563eb;">${stats.scheduled}</strong><span>Planifiés</span></div>
        <div class="stat"><strong style="color:#16a34a;">${stats.attended}</strong><span>Présents</span></div>
        <div class="stat"><strong style="color:#dc2626;">${stats.absent}</strong><span>Absents</span></div>
      </div>
      <table>
        <thead><tr><th>Étudiant</th><th>Cours</th><th>Date</th><th>Créneau</th><th>Statut</th><th>Absences</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      <p style="margin-top:24px;font-size:12px;color:#999;">KILIMO Agritech — Rapport de présences E-Learning</p>
      <script>setTimeout(()=>window.print(),500);</script>
    </body></html>`);
    printWindow.document.close();
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Users className="w-5 h-5 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10"><Calendar className="w-5 h-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Planifiés</p>
              <p className="text-xl font-bold">{stats.scheduled}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10"><CheckCircle className="w-5 h-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Présents</p>
              <p className="text-xl font-bold">{stats.attended}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10"><XCircle className="w-5 h-5 text-red-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Absents</p>
              <p className="text-xl font-bold">{stats.absent}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Gestion des Présences
              </CardTitle>
              <CardDescription>Marquez la présence ou l'absence des étudiants. Après 3 absences, une pénalité est appliquée.</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={exportCSV} disabled={filtered.length === 0}>
                <Download className="w-4 h-4 mr-1" /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={exportPDF} disabled={filtered.length === 0}>
                <FileText className="w-4 h-4 mr-1" /> PDF
              </Button>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Filtrer" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="scheduled">Planifiés</SelectItem>
                  <SelectItem value="attended">Présents</SelectItem>
                  <SelectItem value="absent">Absents</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Aucun créneau trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Étudiant</TableHead>
                    <TableHead>Cours</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Créneau</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Absences</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.id} className={s.absenceCount >= 3 ? 'bg-destructive/5' : ''}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{s.user?.fullName || '—'}</p>
                          <p className="text-xs text-muted-foreground">{s.user?.email || ''}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{s.course?.title || `Cours #${s.courseId}`}</TableCell>
                      <TableCell className="text-sm">{formatDate(s.scheduledDate)}</TableCell>
                      <TableCell className="text-sm">{s.timeSlot}</TableCell>
                      <TableCell>{getStatusBadge(s.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className={`font-bold text-sm ${s.absenceCount >= 3 ? 'text-destructive' : ''}`}>
                            {s.absenceCount}
                          </span>
                          {s.absenceCount >= 3 && <AlertTriangle className="w-3 h-3 text-destructive" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {s.status === 'scheduled' && (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => attendMutation.mutate(s.id)}
                              disabled={attendMutation.isPending}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" /> Présent
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => {
                                if (confirm('Marquer comme absent ? Cela peut entraîner une pénalité.'))
                                  absentMutation.mutate(s.id);
                              }}
                              disabled={absentMutation.isPending}
                            >
                              <XCircle className="w-3 h-3 mr-1" /> Absent
                            </Button>
                          </div>
                        )}
                        {s.status !== 'scheduled' && (
                          <span className="text-xs text-muted-foreground italic">Traité</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
