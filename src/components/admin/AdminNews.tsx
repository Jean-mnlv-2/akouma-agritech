import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { AdminNewsDialog } from './AdminNewsDialog';
import AdminDetailsDialog from './AdminDetailsDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/integrations/api/client';

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
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsArticle | null>(null);
  const [viewingNews, setViewingNews] = useState<NewsArticle | null>(null);
  const [_searchQuery, _setSearchQuery] = useState('');
  const { toast } = useToast();

  const { data: news = [], isLoading } = useQuery<NewsArticle[]>({
    queryKey: ['admin', 'news'],
    queryFn: async () => {
      const res = await api.request('GET', '/api/news');
      const items = Array.isArray(res) ? res : res.data;
      return items || [];
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const handleCreate = () => { setEditingNews(null); setDialogOpen(true); };
  const handleEdit = (newsItem: NewsArticle) => { setEditingNews(newsItem); setDialogOpen(true); };

  const deleteMutation = useMutation({
    mutationFn: async (newsId: number) => api.request('DELETE', `/api/news/${newsId}`),
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Actualité supprimée avec succès' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'news'] });
    },
    onError: (error: unknown) => {
      console.error('Error deleting news:', error);
      toast({ title: 'Erreur', description: "Impossible de supprimer l'actualité", variant: 'destructive' });
    }
  });
  const handleDelete = (newsId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette actualité ?')) return;
    deleteMutation.mutate(newsId);
  };

  const upsertMutation = useMutation({
    mutationFn: async (payload: { data: Record<string, unknown>; id?: number }) => {
      if (payload.id) return api.request('PUT', `/api/news/${payload.id}`, { body: payload.data });
      return api.request('POST', '/api/news', { body: payload.data });
    },
    onSuccess: () => {
      toast({ title: 'Succès', description: `Actualité ${editingNews ? 'modifiée' : 'créée'} avec succès` });
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'news'] });
    },
    onError: (error: unknown) => {
      console.error('Error saving news:', error);
      toast({ title: 'Erreur', description: `Impossible de ${editingNews ? 'modifier' : 'créer'} l'actualité`, variant: 'destructive' });
    }
  });
  const handleSave = (newsData: Record<string, unknown>) => {
    const id = editingNews ? editingNews.id : undefined;
    upsertMutation.mutate({ data: newsData, id });
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
              <TableRow 
                key={newsItem.id} 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  setViewingNews(newsItem);
                  setIsDetailsOpen(true);
                }}
              >
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(newsItem);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(newsItem.id);
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
        {news.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Aucun article trouvé</p>
          </div>
        )}
      </CardContent>

      <AdminNewsDialog open={dialogOpen} onOpenChange={setDialogOpen} news={editingNews as any} onSave={handleSave} />

      <AdminDetailsDialog
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={viewingNews?.title || ''}
        data={viewingNews}
        type="news"
      />
    </Card>
  );
}
