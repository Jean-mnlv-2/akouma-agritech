import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Briefcase, Eye, EyeOff, MapPin, FileText } from 'lucide-react';
import { CareerDialog } from './CareerDialog';
import AdminDetailsDialog from './AdminDetailsDialog';
import { AdminJobApplications } from './AdminJobApplications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/integrations/api/client';

export interface Career {
  id: number;
  title: string;
  slug: string;
  description: string;
  requirements?: string;
  location: string;
  employmentType: string;
  department?: string;
  salaryRange?: string;
  isPublished: boolean;
  applicationDeadline?: string;
  createdAt: string;
  updatedAt: string;
}

export const AdminCareers = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingCareer, setEditingCareer] = useState<Career | null>(null);
  const [viewingCareer, setViewingCareer] = useState<Career | null>(null);
  const { toast } = useToast();

  const { data: careers = [], isLoading } = useQuery<Career[]>({
    queryKey: ['admin', 'careers'],
    queryFn: async () => {
      const res = await api.request('GET', '/api/careers');
      const items = Array.isArray(res) ? res : res.data;
      return items || [];
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const upsertMutation = useMutation({
    mutationFn: async (payload: { data: Omit<Career, 'id' | 'createdAt' | 'updatedAt'>; id?: number }) => {
      if (payload.id) return api.request('PUT', `/api/careers/${payload.id}`, { body: payload.data });
      return api.request('POST', '/api/careers', { body: payload.data });
    },
    onSuccess: () => {
      toast({ title: 'Succès', description: editingCareer ? "Offre d'emploi mise à jour" : "Offre d'emploi créée" });
      setIsDialogOpen(false);
      setEditingCareer(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'careers'] });
    },
    onError: (error: unknown) => {
      console.error('Error saving career:', error);
      toast({ title: 'Erreur', description: "Impossible de sauvegarder l'offre d'emploi", variant: 'destructive' });
    }
  });
  const handleSave = (careerData: Omit<Career, 'id' | 'createdAt' | 'updatedAt'>) => {
    upsertMutation.mutate({ data: careerData, id: editingCareer?.id });
  };

  const handleEdit = (career: Career) => { setEditingCareer(career); setIsDialogOpen(true); };

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.request('DELETE', `/api/careers/${id}`),
    onSuccess: () => {
      toast({ title: 'Succès', description: "Offre d'emploi supprimée avec succès" });
      queryClient.invalidateQueries({ queryKey: ['admin', 'careers'] });
    },
    onError: (error: unknown) => {
      console.error('Error deleting career:', error);
      toast({ title: 'Erreur', description: "Impossible de supprimer l'offre d'emploi", variant: 'destructive' });
    }
  });
  const handleDelete = (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette offre d'emploi ?")) return;
    deleteMutation.mutate(id);
  };

  const togglePublishedMutation = useMutation({
    mutationFn: async (career: Career) => api.request('PUT', `/api/careers/${career.id}`, { body: { isPublished: !career.isPublished } }),
    onSuccess: (_res, career) => {
      toast({ title: 'Succès', description: `Offre d'emploi ${!career.isPublished ? 'publiée' : 'dépubliée'} avec succès` });
      queryClient.invalidateQueries({ queryKey: ['admin', 'careers'] });
    },
  });

  const getEmploymentTypeLabel = (type: string) => {
    switch (type) {
      case 'full-time': return 'Temps plein';
      case 'part-time': return 'Temps partiel';
      case 'contract': return 'Contrat';
      case 'internship': return 'Stage';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="offers" className="w-full">
        <TabsList>
          <TabsTrigger value="offers" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Offres d'emploi
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <FileText className="w-4 h-4" /> Candidatures
          </TabsTrigger>
        </TabsList>

        <TabsContent value="offers" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Gestion des Offres d'Emploi</h2>
              <p className="text-muted-foreground">{careers.length} offre(s) d'emploi au total</p>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Nouvelle Offre</Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              {careers.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune offre d'emploi trouvée</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Poste</TableHead>
                      <TableHead>Département</TableHead>
                      <TableHead>Lieu</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {careers.map((career) => (
                      <TableRow 
                        key={career.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => { setViewingCareer(career); setIsDetailsOpen(true); }}
                      >
                        <TableCell className="font-medium">{career.title}</TableCell>
                        <TableCell>{career.department || '-'}</TableCell>
                        <TableCell><div className="flex items-center gap-1"><MapPin className="w-4 h-4 text-muted-foreground" /><span>{career.location}</span></div></TableCell>
                        <TableCell><Badge variant="outline">{getEmploymentTypeLabel(career.employmentType)}</Badge></TableCell>
                        <TableCell><Badge variant={career.isPublished ? 'default' : 'secondary'}>{career.isPublished ? 'Publié' : 'Brouillon'}</Badge></TableCell>
                        <TableCell>
                          <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                            <Button variant="outline" size="sm" onClick={() => handleEdit(career)}><Edit className="w-4 h-4" /></Button>
                            <Button variant="outline" size="sm" onClick={() => togglePublishedMutation.mutate(career)}>
                              {career.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(career.id)}><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications">
          <AdminJobApplications />
        </TabsContent>
      </Tabs>

      <CareerDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} career={editingCareer} onSave={handleSave} />
      <AdminDetailsDialog
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={viewingCareer?.title || ''}
        data={viewingCareer as any}
        type="career"
      />
    </div>
  );
};
