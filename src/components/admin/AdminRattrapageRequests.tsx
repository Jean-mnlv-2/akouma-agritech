import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/integrations/api/client';
import { Loader2 } from 'lucide-react';

interface RattrapageRequest {
  id: number;
  status: 'pending' | 'granted' | 'rejected' | 'completed';
  requestedAt: string;
  resolutionNote: string | null;
  alternateModuleId: number | null;
  suggestedResolution: string | null;
  suggestedByAi: boolean;
  user: { id: string; fullName: string | null; email: string };
  module: { id: number; title: string };
  alternateModule: { id: number; title: string } | null;
  enrollment: { course: { id: number; title: string } };
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  granted: 'Accordé',
  rejected: 'Refusé',
  completed: 'Terminé',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  granted: 'default',
  rejected: 'destructive',
  completed: 'secondary',
};

export function AdminRattrapageRequests() {
  const [statusFilter, setStatusFilter] = useState('');
  const [resolving, setResolving] = useState<RattrapageRequest | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery<RattrapageRequest[]>({
    queryKey: ['admin', 'rattrapage-requests', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.request('GET', `/api/rattrapage_requests?${params.toString()}`);
      return res.data || [];
    },
    staleTime: 10000,
  });

  const resolveMutation = useMutation({
    mutationFn: async (payload: { id: number; status: 'granted' | 'rejected'; resolutionNote: string; alternateModuleId: number | null }) => {
      return api.request('PUT', `/api/rattrapage_requests/${payload.id}`, {
        body: { status: payload.status, resolutionNote: payload.resolutionNote || null, alternateModuleId: payload.alternateModuleId },
      });
    },
    onSuccess: () => {
      toast({ title: 'Demande résolue' });
      setResolving(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'rattrapage-requests'] });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de résoudre la demande', variant: 'destructive' });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demandes de rattrapage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Tous les statuts" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="granted">Accordé</SelectItem>
              <SelectItem value="rejected">Refusé</SelectItem>
              <SelectItem value="completed">Terminé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Apprenant</TableHead>
                <TableHead>Cours</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Demandé le</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium text-sm">{r.user.fullName || r.user.email}</div>
                    <div className="text-xs text-muted-foreground">{r.user.email}</div>
                  </TableCell>
                  <TableCell className="text-sm">{r.enrollment.course.title}</TableCell>
                  <TableCell className="text-sm">{r.module.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(r.requestedAt).toLocaleString('fr-FR')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                      {r.suggestedByAi && r.status === 'pending' && (
                        <Badge variant="outline" className="text-[10px] border-blue-300 text-blue-700 dark:text-blue-400">Suggestion IA</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {r.status === 'pending' && (
                      <Button size="sm" variant="outline" onClick={() => setResolving(r)}>Résoudre</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {requests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">Aucune demande</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {resolving && (
        <ResolveDialog
          request={resolving}
          onClose={() => setResolving(null)}
          onSubmit={(status, resolutionNote, alternateModuleId) =>
            resolveMutation.mutate({ id: resolving.id, status, resolutionNote, alternateModuleId })
          }
          saving={resolveMutation.isPending}
        />
      )}
    </Card>
  );
}

function ResolveDialog({
  request, onClose, onSubmit, saving,
}: {
  request: RattrapageRequest;
  onClose: () => void;
  onSubmit: (status: 'granted' | 'rejected', resolutionNote: string, alternateModuleId: number | null) => void;
  saving: boolean;
}) {
  const [resolutionNote, setResolutionNote] = useState(request.suggestedResolution || '');
  const [useAlternate, setUseAlternate] = useState(false);
  const [alternateModuleId, setAlternateModuleId] = useState<string>('');

  const { data: courseModules = [] } = useQuery<{ id: number; title: string }[]>({
    queryKey: ['admin', 'course-modules-for-alternate', request.enrollment.course.id],
    queryFn: async () => {
      const res = await api.request('GET', `/api/course_modules/course/${request.enrollment.course.id}`);
      return (res.data || []).filter((m: { id: number }) => m.id !== request.module.id);
    },
  });

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Résoudre la demande de {request.user.fullName || request.user.email}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Module concerné : <strong>{request.module.title}</strong> ({request.enrollment.course.title})
          </p>
          {request.suggestedByAi && request.suggestedResolution && (
            <p className="text-xs bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg px-3 py-2 text-blue-800 dark:text-blue-300">
              Suggestion rédigée par DeerFlow ci-dessous — relisez et modifiez avant de valider, la décision reste la vôtre.
            </p>
          )}
          <div className="space-y-2">
            <Label>Note (visible par l'apprenant en cas de refus)</Label>
            <Textarea value={resolutionNote} onChange={(e) => setResolutionNote(e.target.value)} rows={3} placeholder="Ex : session de rattrapage le 20/03 à 18h, ou instructions spécifiques…" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="use-alternate" checked={useAlternate} onChange={(e) => setUseAlternate(e.target.checked)} className="accent-primary" />
            <Label htmlFor="use-alternate" className="cursor-pointer">Assigner une évaluation différente pour le rattrapage</Label>
          </div>
          {useAlternate && (
            <Select value={alternateModuleId} onValueChange={setAlternateModuleId}>
              <SelectTrigger><SelectValue placeholder="Choisir un module quiz alternatif" /></SelectTrigger>
              <SelectContent>
                {courseModules.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>{m.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onSubmit('rejected', resolutionNote, null)} disabled={saving}>
            Refuser
          </Button>
          <Button onClick={() => onSubmit('granted', resolutionNote, useAlternate && alternateModuleId ? Number(alternateModuleId) : null)} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Accorder le rattrapage
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
