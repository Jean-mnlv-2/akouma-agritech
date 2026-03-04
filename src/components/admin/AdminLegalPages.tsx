import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { AdminLegalPageDialog } from './AdminLegalPageDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/integrations/api/client';

interface LegalPage {
  id: string;
  title: string;
  type?: string;
  version?: string;
  effectiveDate?: string;
  effective_date?: string;
  createdAt?: string;
  slug?: string;
  content?: string;
}

export function AdminLegalPages() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<LegalPage | null>(null);
  const { toast } = useToast();
  const { data: legalPages = [], isLoading } = useQuery<LegalPage[]>({
    queryKey: ['admin', 'legal-pages'],
    queryFn: async () => {
      const res = await api.request('GET', '/api/legal_pages');
      const items = Array.isArray(res) ? res : res.data;
      return items || [];
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const handleCreate = () => {
    setEditingPage(null);
    setDialogOpen(true);
  };

  const handleEdit = (page: LegalPage) => {
    setEditingPage(page);
    setDialogOpen(true);
  };

  const deleteMutation = useMutation({
    mutationFn: async (pageId: string) => api.request('DELETE', `/api/legal_pages/${pageId}`),
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Page supprimée avec succès' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'legal-pages'] });
    },
    onError: (error: unknown) => {
      console.error('Error deleting legal page:', error);
      toast({ title: 'Erreur', description: "Impossible de supprimer la page", variant: 'destructive' });
    }
  });
  const handleDelete = (pageId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette page ?')) return;
    deleteMutation.mutate(pageId);
  };

  const upsertMutation = useMutation({
    mutationFn: async (payload: { data: Partial<LegalPage>; id?: string }) => {
      if (payload.id) return api.request('PUT', `/api/legal_pages/${payload.id}`, { body: payload.data });
      return api.request('POST', '/api/legal_pages', { body: payload.data });
    },
    onSuccess: () => {
      toast({ title: 'Succès', description: `Page ${editingPage ? 'modifiée' : 'créée'} avec succès` });
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'legal-pages'] });
    },
    onError: (error: unknown) => {
      console.error('Error saving legal page:', error);
      toast({ title: 'Erreur', description: `Impossible de ${editingPage ? 'modifier' : 'créer'} la page`, variant: 'destructive' });
    }
  });
  const handleSave = (pageData: Partial<LegalPage>) => {
    const id = editingPage?.id;
    upsertMutation.mutate({ data: pageData, id });
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
            <CardTitle>Gestion des Pages Légales</CardTitle>
            <CardDescription>Créez et gérez les pages légales (CGU, Politique de confidentialité, etc.)</CardDescription>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Page
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {legalPages.map((page) => (
              <TableRow 
                key={page.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleEdit(page)}
              >
                <TableCell className="font-medium">{page.title}</TableCell>
                <TableCell>
                  <Badge variant="outline">{page.slug}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(page);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(page.id);
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
        {legalPages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Aucune page légale trouvée</p>
          </div>
        )}
      </CardContent>

      <AdminLegalPageDialog open={dialogOpen} onOpenChange={setDialogOpen} page={editingPage as any} onSave={handleSave} />
    </Card>
  );
}
