import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { AdminCourseDialog } from './AdminCourseDialog';
import AdminDetailsDialog from './AdminDetailsDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/integrations/api/client';

export interface Course {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  content?: string;
  excerpt?: string;
  instructor_name?: string;
  instructor_bio?: string;
  price_fcfa?: number;
  duration_minutes?: number;
  category?: string;
  level?: string;
  is_published?: boolean;
  is_featured?: boolean;
  isCopyProtected?: boolean;
  isPreviewAvailable?: boolean;
  languages?: string[];
  course_materials_url?: string;
  thumbnail_url?: string;
  video_url?: string;
  modules?: unknown[];
  benefits?: string[];
  requirements?: string[];
  created_at?: string;
  enrollment_count?: number;
  rating?: number;
}

export function AdminCourses() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);
  const { toast } = useToast();

  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ['admin', 'courses'],
    queryFn: async () => {
      const res = await api.request('GET', '/api/courses');
      const items = Array.isArray(res) ? res : res.data;
      return items || [];
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const handleCreate = () => { setEditingCourse(null); setDialogOpen(true); };
  const handleEdit = (course: Course) => { setEditingCourse(course); setDialogOpen(true); };

  const deleteMutation = useMutation({
    mutationFn: async (courseId: string) => api.request('DELETE', `/api/courses/${courseId}`),
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Cours supprimé avec succès' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
    },
    onError: (error: unknown) => {
      console.error('Error deleting course:', error);
      toast({ title: 'Erreur', description: 'Impossible de supprimer le cours', variant: 'destructive' });
    }
  });
  const handleDelete = (courseId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) return;
    deleteMutation.mutate(courseId);
  };

  const upsertMutation = useMutation({
    mutationFn: async (payload: { data: Record<string, unknown>; id?: string }) => {
      if (payload.id) return api.request('PUT', `/api/courses/${payload.id}`, { body: payload.data });
      return api.request('POST', '/api/courses', { body: payload.data });
    },
    onSuccess: () => {
      toast({ title: 'Succès', description: `Cours ${editingCourse ? 'modifié' : 'créé'} avec succès` });
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
    },
    onError: (error: unknown) => {
      console.error('Error saving course:', error);
      toast({ title: 'Erreur', description: `Impossible de ${editingCourse ? 'modifier' : 'créer'} le cours`, variant: 'destructive' });
    }
  });
  const handleSave = (courseData: Record<string, unknown>) => {
    const id = editingCourse ? editingCourse.id : undefined;
    upsertMutation.mutate({ data: courseData, id });
  };

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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gestion des Cours</CardTitle>
            <CardDescription>Créez et gérez les cours de formation disponibles sur la plateforme</CardDescription>
          </div>
          <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" />Nouveau Cours</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aperçu</TableHead>
              <TableHead>Titre</TableHead>
              <TableHead>Instructeur</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Durée</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Aperçu Gratuit</TableHead>
              <TableHead>Langues</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((course: Course) => (
              <TableRow 
                key={course.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  setViewingCourse(course);
                  setIsDetailsOpen(true);
                }}
              >
                <TableCell>
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="w-10 h-10 rounded object-cover" />
                  ) : course.video_url ? (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">▶</div>
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted" />)
                  }
                </TableCell>
                <TableCell className="font-medium">{course.title}</TableCell>
                <TableCell>{course.instructor_name}</TableCell>
                <TableCell>{course.category}</TableCell>
                <TableCell>{Number(course.price_fcfa ?? 0).toLocaleString()} FCFA</TableCell>
                <TableCell>{course.duration_minutes ?? 0} min</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Badge variant={course.is_published ? 'default' : 'secondary'}>
                      {course.is_published ? 'Publié' : 'Brouillon'}
                    </Badge>
                    {course.is_featured && (<Badge variant="outline">Mis en avant</Badge>)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={(course.isPreviewAvailable ?? false) ? 'default' : 'secondary'}>
                    {(course.isPreviewAvailable ?? false) ? 'Oui' : 'Non'}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[240px]">
                  {Array.isArray(course.languages) && course.languages.length > 0 ? course.languages.join(', ') : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(course);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          const next = !(course.isPreviewAvailable ?? false);
                          await api.request('PUT', `/api/courses/${course.id}`, { body: { isPreviewAvailable: next } });
                          toast({ title: 'Mis à jour', description: 'Disponibilité de l’aperçu gratuit modifiée.' });
                          queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
                        } catch {
                          toast({ title: 'Erreur', description: 'Impossible de mettre à jour', variant: 'destructive' });
                        }
                      }}
                    >
                      {(course.isPreviewAvailable ?? false) ? 'Désactiver Aperçu' : 'Activer Aperçu'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(course.id);
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
        {courses.length === 0 && (<div className="text-center py-8"><p className="text-muted-foreground">Aucun cours trouvé</p></div>)}
      </CardContent>

      <AdminCourseDialog open={dialogOpen} onOpenChange={setDialogOpen} course={editingCourse} onSave={handleSave} />

      <AdminDetailsDialog
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={viewingCourse?.title || ''}
        data={viewingCourse}
        type="course"
      />
    </Card>
  );
}
