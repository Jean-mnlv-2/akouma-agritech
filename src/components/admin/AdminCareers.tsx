import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Briefcase, Eye, EyeOff, MapPin } from 'lucide-react';
import { CareerDialog } from './CareerDialog';

interface Career {
  id: number;
  title: string;
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
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCareer, setEditingCareer] = useState<Career | null>(null);
  const { toast } = useToast();

  const fetchCareers = useCallback(async () => {
    try {
      const res = await fetch('/api/careers', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load');
      const body = await res.json();
      const items = Array.isArray(body) ? body : body.data;
      setCareers(items || []);
    } catch (error) {
      console.error('Error fetching careers:', error);
      toast({ title: 'Erreur', description: "Impossible de charger les offres d'emploi", variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchCareers(); }, [fetchCareers]);

  const handleSave = async (careerData: Omit<Career, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      let res: Response;
      if (editingCareer) {
        res = await fetch(`/api/careers/${editingCareer.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(careerData) });
      } else {
        res = await fetch('/api/careers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(careerData) });
      }
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Succès', description: editingCareer ? "Offre d'emploi mise à jour" : "Offre d'emploi créée" });
      setIsDialogOpen(false);
      setEditingCareer(null);
      fetchCareers();
    } catch (error) {
      console.error('Error saving career:', error);
      toast({ title: 'Erreur', description: "Impossible de sauvegarder l'offre d'emploi", variant: 'destructive' });
    }
  };

  const handleEdit = (career: Career) => { setEditingCareer(career); setIsDialogOpen(true); };

  const handleDelete = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette offre d'emploi ?")) return;
    try {
      const res = await fetch(`/api/careers/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to delete');
      toast({ title: 'Succès', description: "Offre d'emploi supprimée avec succès" });
      fetchCareers();
    } catch (error) {
      console.error('Error deleting career:', error);
      toast({ title: 'Erreur', description: "Impossible de supprimer l'offre d'emploi", variant: 'destructive' });
    }
  };

  const togglePublished = async (career: Career) => {
    try {
      const res = await fetch(`/api/careers/${career.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ isPublished: !career.isPublished }) });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Succès', description: `Offre d'emploi ${!career.isPublished ? 'publiée' : 'dépubliée'} avec succès` });
      fetchCareers();
    } catch (error) {
      console.error('Error toggling career status:', error);
      toast({ title: 'Erreur', description: "Impossible de modifier le statut de l'offre d'emploi", variant: 'destructive' });
    }
  };

  const getEmploymentTypeLabel = (type: string) => {
    switch (type) {
      case 'full-time': return 'Temps plein';
      case 'part-time': return 'Temps partiel';
      case 'contract': return 'Contrat';
      case 'internship': return 'Stage';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement des offres d'emploi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Offres d'Emploi</h2>
          <p className="text-muted-foreground">Gérez les offres d'emploi et les opportunités de carrière</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Nouvelle Offre</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Offres d'Emploi</CardTitle>
          <CardDescription>{careers.length} offre(s) d'emploi au total</CardDescription>
        </CardHeader>
        <CardContent>
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
                  <TableRow key={career.id}>
                    <TableCell className="font-medium">{career.title}</TableCell>
                    <TableCell>{career.department || '-'}</TableCell>
                    <TableCell><div className="flex items-center space-x-1"><MapPin className="w-4 h-4 text-muted-foreground" /><span>{career.location}</span></div></TableCell>
                    <TableCell><Badge variant="outline">{getEmploymentTypeLabel(career.employmentType)}</Badge></TableCell>
                    <TableCell><Badge variant={career.isPublished ? 'default' : 'secondary'}>{career.isPublished ? 'Publié' : 'Brouillon'}</Badge></TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(career)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="outline" size="sm" onClick={() => togglePublished(career)}>{career.isPublished ? (<EyeOff className="w-4 h-4" />) : (<Eye className="w-4 h-4" />)}</Button>
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

      <CareerDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} career={editingCareer} onSave={handleSave} />
    </div>
  );
};
