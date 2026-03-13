import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, FileText, ExternalLink, Eye } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/integrations/api/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface JobApplication {
  id: number;
  careerId?: number | null;
  careerTitle: string;
  fullName: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  cvUrl?: string | null;
  attachments?: string[];
  status: string;
  createdAt: string;
  career?: { title: string; department?: string } | null;
}

export function AdminJobApplications() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [viewingApp, setViewingApp] = useState<JobApplication | null>(null);

  const { data: applications = [], isLoading } = useQuery<JobApplication[]>({
    queryKey: ['admin', 'job-applications'],
    queryFn: async () => {
      const res = await api.request('GET', '/api/job-applications');
      return res.data || [];
    },
    staleTime: 30000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) =>
      api.request('PUT', `/api/job-applications/${id}`, { body: { status } }),
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Statut mis à jour' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'job-applications'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.request('DELETE', `/api/job-applications/${id}`),
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Candidature supprimée' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'job-applications'] });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary">En attente</Badge>;
      case 'reviewing': return <Badge className="bg-blue-500 text-white">En cours d'examen</Badge>;
      case 'accepted': return <Badge className="bg-green-500 text-white">Acceptée</Badge>;
      case 'rejected': return <Badge variant="destructive">Refusée</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Candidatures Reçues</CardTitle>
          <CardDescription>{applications.length} candidature(s) au total</CardDescription>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune candidature reçue</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidat</TableHead>
                  <TableHead>Poste</TableHead>
                  <TableHead>CV</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setViewingApp(app)}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{app.fullName}</p>
                        <p className="text-sm text-muted-foreground">{app.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{app.careerTitle}</TableCell>
                    <TableCell>
                      {app.cvUrl ? (
                        <a href={app.cvUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-primary hover:underline flex items-center gap-1">
                          <ExternalLink className="w-4 h-4" /> CV
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(app.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(app.createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={app.status}
                          onValueChange={(value) => updateStatusMutation.mutate({ id: app.id, status: value })}
                        >
                          <SelectTrigger className="w-[140px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="reviewing">En examen</SelectItem>
                            <SelectItem value="accepted">Acceptée</SelectItem>
                            <SelectItem value="rejected">Refusée</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" onClick={() => setViewingApp(app)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('Supprimer cette candidature ?')) deleteMutation.mutate(app.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!viewingApp} onOpenChange={(open) => !open && setViewingApp(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails de la candidature</DialogTitle>
          </DialogHeader>
          {viewingApp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nom complet</p>
                  <p className="font-medium">{viewingApp.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{viewingApp.email}</p>
                </div>
                {viewingApp.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Téléphone</p>
                    <p className="font-medium">{viewingApp.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Poste visé</p>
                  <p className="font-medium">{viewingApp.careerTitle}</p>
                </div>
              </div>
              {viewingApp.message && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Message / Motivation</p>
                  <div className="bg-muted/50 p-3 rounded-lg text-sm whitespace-pre-wrap">{viewingApp.message}</div>
                </div>
              )}
              {viewingApp.cvUrl && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">CV / Pièces jointes</p>
                  <a href={viewingApp.cvUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline">
                    <FileText className="w-4 h-4" /> Télécharger le CV
                  </a>
                </div>
              )}
              {viewingApp.attachments && viewingApp.attachments.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pièces jointes supplémentaires</p>
                  <div className="space-y-1">
                    {viewingApp.attachments.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline text-sm">
                        <FileText className="w-4 h-4" /> Pièce {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Statut</p>
                {getStatusBadge(viewingApp.status)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date de candidature</p>
                <p className="text-sm">{new Date(viewingApp.createdAt).toLocaleString('fr-FR')}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
