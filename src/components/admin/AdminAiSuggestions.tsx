import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/integrations/api/client';
import { Loader2 } from 'lucide-react';

interface AiSuggestion {
  id: number;
  type: 'attendance_outreach' | 'quiz_review' | 'cohort_schedule' | 'translation';
  targetType: string;
  targetId: number;
  title: string;
  payload: Record<string, any>;
  status: 'pending' | 'applied' | 'dismissed';
  createdAt: string;
}

const TYPE_LABEL: Record<string, string> = {
  attendance_outreach: 'Relance présence',
  quiz_review: 'Revue de quiz',
  cohort_schedule: 'Planification cohorte',
  translation: 'Traduction',
};

const STATUS_LABEL: Record<string, string> = { pending: 'En attente', applied: 'Appliquée', dismissed: 'Rejetée' };
const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline', applied: 'default', dismissed: 'secondary',
};

export function AdminAiSuggestions() {
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [viewing, setViewing] = useState<AiSuggestion | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suggestions = [], isLoading } = useQuery<AiSuggestion[]>({
    queryKey: ['admin', 'ai-suggestions', typeFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.request('GET', `/api/ai_suggestions?${params.toString()}`);
      return res.data || [];
    },
    staleTime: 10000,
  });

  const applyMutation = useMutation({
    mutationFn: async (id: number) => api.request('PUT', `/api/ai_suggestions/${id}/apply`, {}),
    onSuccess: () => {
      toast({ title: 'Suggestion appliquée' });
      setViewing(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'ai-suggestions'] });
    },
    onError: (e: any) => {
      toast({ title: 'Erreur', description: e?.message || 'Impossible d\'appliquer la suggestion', variant: 'destructive' });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async (id: number) => api.request('PUT', `/api/ai_suggestions/${id}/dismiss`, {}),
    onSuccess: () => {
      toast({ title: 'Suggestion rejetée' });
      setViewing(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'ai-suggestions'] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suggestions DeerFlow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Select value={typeFilter || 'all'} onValueChange={(v) => setTypeFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Tous les types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {Object.entries(TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tous les statuts" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="applied">Appliquée</SelectItem>
              <SelectItem value="dismissed">Rejetée</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Sujet</TableHead>
                <TableHead>Créée le</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suggestions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell><Badge variant="outline">{TYPE_LABEL[s.type] || s.type}</Badge></TableCell>
                  <TableCell className="text-sm">{s.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(s.createdAt).toLocaleString('fr-FR')}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[s.status]}>{STATUS_LABEL[s.status]}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setViewing(s)}>
                      {s.status === 'pending' ? 'Revoir' : 'Détails'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {suggestions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">Aucune suggestion</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {viewing && (
        <SuggestionDetailDialog
          suggestion={viewing}
          onClose={() => setViewing(null)}
          onApply={() => applyMutation.mutate(viewing.id)}
          onDismiss={() => dismissMutation.mutate(viewing.id)}
          applying={applyMutation.isPending}
          dismissing={dismissMutation.isPending}
        />
      )}
    </Card>
  );
}

function PayloadPreview({ type, payload }: { type: string; payload: Record<string, any> }) {
  switch (type) {
    case 'attendance_outreach':
      return (
        <div className="space-y-1 text-sm">
          <p className="font-medium">{payload.subject}</p>
          <p className="whitespace-pre-wrap text-muted-foreground">{payload.message}</p>
        </div>
      );
    case 'quiz_review':
      return (
        <div className="space-y-2 text-sm max-h-80 overflow-y-auto">
          {(payload.quizQuestions || []).map((q: any, i: number) => (
            <div key={i} className="border rounded-lg p-2">
              <p className="font-medium">{q.question}</p>
              <ul className="list-disc pl-5">
                {(q.options || []).map((o: string, oi: number) => (
                  <li key={oi} className={oi === q.correctAnswer ? 'text-emerald-600 font-medium' : ''}>{o}</li>
                ))}
              </ul>
              {q.explanation && <p className="text-xs text-muted-foreground mt-1">{q.explanation}</p>}
            </div>
          ))}
          {payload.note && <p className="text-xs text-muted-foreground italic">{payload.note}</p>}
        </div>
      );
    case 'cohort_schedule':
      return (
        <div className="text-sm space-y-1">
          <p>Date de début suggérée : <strong>{payload.cohortStartDate}</strong></p>
          <p>Intervalle entre modules : <strong>{payload.cohortIntervalDays} jour(s)</strong></p>
          {payload.rationale && <p className="text-xs text-muted-foreground mt-2">{payload.rationale}</p>}
        </div>
      );
    case 'translation':
      return (
        <div className="space-y-2 text-sm max-h-80 overflow-y-auto">
          <p className="text-xs text-muted-foreground">Langue : <strong>{payload.language}</strong> — copiez le texte ci-dessous dans un nouveau cours via le formulaire habituel (aucune création automatique).</p>
          {payload.title && <p><strong>Titre :</strong> {payload.title}</p>}
          {payload.description && <p><strong>Description :</strong> {payload.description}</p>}
          {payload.content && <p className="whitespace-pre-wrap"><strong>Contenu :</strong> {payload.content}</p>}
        </div>
      );
    default:
      return <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto">{JSON.stringify(payload, null, 2)}</pre>;
  }
}

function SuggestionDetailDialog({
  suggestion, onClose, onApply, onDismiss, applying, dismissing,
}: {
  suggestion: AiSuggestion;
  onClose: () => void;
  onApply: () => void;
  onDismiss: () => void;
  applying: boolean;
  dismissing: boolean;
}) {
  const isPending = suggestion.status === 'pending';
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{TYPE_LABEL[suggestion.type] || suggestion.type} — {suggestion.title}</DialogTitle>
        </DialogHeader>
        <PayloadPreview type={suggestion.type} payload={suggestion.payload} />
        {isPending && (
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onDismiss} disabled={dismissing || applying}>
              {dismissing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Rejeter
            </Button>
            <Button onClick={onApply} disabled={applying || dismissing}>
              {applying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {suggestion.type === 'translation' ? 'Marquer comme traité' : 'Appliquer'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
