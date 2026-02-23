import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { AdminNewsDialog } from './AdminNewsDialog';

interface NewsArticle {
  id: number;
  title: string;
  excerpt?: string | null;
  author?: string | null;
  isPublished: boolean;
  createdAt: string;
  imageUrl?: string | null;
}

export function AdminNews() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsArticle | null>(null);
  const { toast } = useToast();
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string) || window.location.origin;

  const fetchNews = useCallback(async () => {
    try {
      const url = new URL('/api/news', apiBaseUrl);
      const res = await fetch(url.toString(), { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load');
      const body = await res.json();
      const items = Array.isArray(body) ? body : body.data;
      setNews(items || []);
    } catch (error) {
      console.error('Error fetching news:', error);
      toast({ title: 'Erreur', description: "Impossible de charger les actualités", variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const handleCreate = () => { setEditingNews(null); setDialogOpen(true); };
  const handleEdit = (newsItem: NewsArticle) => { setEditingNews(newsItem); setDialogOpen(true); };

  const handleDelete = async (newsId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette actualité ?')) return;
    try {
      const url = new URL(`/api/news/${newsId}`, apiBaseUrl);
      const res = await fetch(url.toString(), { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to delete');
      toast({ title: 'Succès', description: 'Actualité supprimée avec succès' });
      fetchNews();
    } catch (error: any) {
      console.error('Error deleting news:', error);
      toast({ title: 'Erreur', description: error?.message || "Impossible de supprimer l'actualité", variant: 'destructive' });
    }
  };

  const handleSave = async (newsData: any) => {
    try {
      const isEditing = !!editingNews;
      let res: Response;
      if (isEditing) {
        const url = new URL(`/api/news/${(editingNews as any).id}`, apiBaseUrl);
        res = await fetch(url.toString(), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(newsData),
        });
      } else {
        const url = new URL('/api/news', apiBaseUrl);
        res = await fetch(url.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(newsData),
        });
      }
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Succès', description: `Actualité ${editingNews ? 'modifiée' : 'créée'} avec succès` });
      setDialogOpen(false);
      fetchNews();
    } catch (error: any) {
      console.error('Error saving news:', error);
      toast({ title: 'Erreur', description: error?.message || `Impossible de ${editingNews ? 'modifier' : 'créer'} l'actualité`, variant: 'destructive' });
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
            <CardTitle>Gestion des Actualités</CardTitle>
            <CardDescription>Créez et gérez les articles d'actualité de la plateforme</CardDescription>
          </div>
          <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" />Nouvel Article</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aperçu</TableHead>
              <TableHead>Titre</TableHead>
              <TableHead>Auteur</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {news.map((newsItem: any) => (
              <TableRow key={newsItem.id}>
                <TableCell>
                  {newsItem.imageUrl ? (
                    <img src={newsItem.imageUrl} alt={newsItem.title} className="w-10 h-10 rounded object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted" />)
                  }
                </TableCell>
                <TableCell className="font-medium">{newsItem.title}</TableCell>
                <TableCell>{newsItem.author || ''}</TableCell>
                <TableCell>
                  <Badge variant={newsItem.isPublished ? 'default' : 'secondary'}>
                    {newsItem.isPublished ? 'Publié' : 'Brouillon'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(newsItem)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(newsItem.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {news.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Aucun article trouvé</p>
          </div>
        )}
      </CardContent>

      <AdminNewsDialog open={dialogOpen} onOpenChange={setDialogOpen} news={editingNews as any} onSave={handleSave} />
    </Card>
  );
}
