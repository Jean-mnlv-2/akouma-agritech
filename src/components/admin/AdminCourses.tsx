import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import { AdminCourseDialog } from './AdminCourseDialog';

export interface Course {
  id: string;
  title: string;
  description?: string;
  instructor_name?: string;
  price_fcfa?: number;
  duration_minutes?: number;
  category?: string;
  level?: string;
  is_published?: boolean;
  is_featured?: boolean;
  created_at?: string;
  enrollment_count?: number;
  rating?: number;
  thumbnail_url?: string;
  video_url?: string;
}

export function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const { toast } = useToast();

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/courses', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load');
      const body = await res.json();
      const items = Array.isArray(body) ? body : body.data;
      setCourses(items || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les cours', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const handleCreate = () => { setEditingCourse(null); setDialogOpen(true); };
  const handleEdit = (course: Course) => { setEditingCourse(course); setDialogOpen(true); };

  const handleDelete = async (courseId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) return;
    try {
      const res = await fetch(`/api/courses/${courseId}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Succès', description: 'Cours supprimé avec succès' });
      fetchCourses();
    } catch (error: unknown) {
      console.error('Error deleting course:', error);
      toast({ title: 'Erreur', description: (error as Error).message || 'Impossible de supprimer le cours', variant: 'destructive' });
    }
  };

  const handleSave = async (courseData: any) => {
    try {
      const isEditing = !!editingCourse;
      let res: Response;
      if (isEditing) {
        res = await fetch(`/api/courses/${(editingCourse as any).id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(courseData) });
      } else {
        res = await fetch('/api/courses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(courseData) });
      }
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Succès', description: `Cours ${editingCourse ? 'modifié' : 'créé'} avec succès` });
      setDialogOpen(false);
      fetchCourses();
    } catch (error) {
      const err = error as { message?: string };
      console.error('Error saving course:', error);
      toast({ title: 'Erreur', description: err.message || `Impossible de ${editingCourse ? 'modifier' : 'créer'} le cours`, variant: 'destructive' });
    }
  };

  if (loading) {
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
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((course: any) => (
              <TableRow key={course.id}>
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
                <TableCell>{Number(course.price_fcfa ?? course.price ?? 0).toLocaleString()} FCFA</TableCell>
                <TableCell>{course.duration_minutes ?? course.duration ?? 0} min</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Badge variant={(course.is_published ?? course.isPublished) ? 'default' : 'secondary'}>
                      {(course.is_published ?? course.isPublished) ? 'Publié' : 'Brouillon'}
                    </Badge>
                    {(course.is_featured ?? course.isFeatured) && (<Badge variant="outline">Mis en avant</Badge>)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(course)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(course.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {courses.length === 0 && (<div className="text-center py-8"><p className="text-muted-foreground">Aucun cours trouvé</p></div>)}
      </CardContent>

      <AdminCourseDialog open={dialogOpen} onOpenChange={setDialogOpen} course={editingCourse} onSave={handleSave} />
    </Card>
  );
}