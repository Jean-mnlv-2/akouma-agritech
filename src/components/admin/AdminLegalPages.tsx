import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { AdminLegalPageDialog } from './AdminLegalPageDialog';

interface LegalPage {
  id: string;
  title: string;
  type?: string;
  version?: string;
  effective_date?: string;
  created_at?: string;
  slug?: string;
  content?: string;
}

export function AdminLegalPages() {
  const [legalPages, setLegalPages] = useState<LegalPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<LegalPage | null>(null);
  const { toast } = useToast();
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string) || window.location.origin;

  useEffect(() => {
    fetchLegalPages();
  }, []);

  const fetchLegalPages = async () => {
    try {
      const url = new URL('/api/legal_pages', apiBaseUrl);
      const res = await fetch(url.toString(), { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load');
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Réponse invalide du serveur pour les pages légales');
      }
      const body = await res.json();
      const items = Array.isArray(body) ? body : body.data;
      setLegalPages(items || []);
    } catch (error) {
      console.error('Error fetching legal pages:', error);
      toast({ title: 'Erreur', description: "Impossible de charger les pages légales", variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPage(null);
    setDialogOpen(true);
  };

  const handleEdit = (page: LegalPage) => {
    setEditingPage(page);
    setDialogOpen(true);
  };

  const handleDelete = async (pageId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette page ?')) return;
    try {
      const res = await fetch(`/api/legal_pages/${pageId}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to delete');
      toast({ title: 'Succès', description: 'Page supprimée avec succès' });
      fetchLegalPages();
    } catch (error) {
      console.error('Error deleting legal page:', error);
      toast({ title: 'Erreur', description: "Impossible de supprimer la page", variant: 'destructive' });
    }
  };

  const handleSave = async (pageData: { title: string; content: string; slug?: string }) => {
    try {
      const isEditing = !!editingPage;
      const payload = { title: pageData.title, content: pageData.content, slug: pageData.slug };
      let res: Response;
      if (isEditing) {
        const url = new URL(`/api/legal_pages/${editingPage!.id}`, apiBaseUrl);
        res = await fetch(url.toString(), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
      } else {
        const url = new URL('/api/legal_pages', apiBaseUrl);
        res = await fetch(url.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Succès', description: `Page ${isEditing ? 'modifiée' : 'créée'} avec succès` });
      setDialogOpen(false);
      fetchLegalPages();
    } catch (error) {
      console.error('Error saving legal page:', error);
      toast({ title: 'Erreur', description: `Impossible de ${editingPage ? 'modifier' : 'créer'} la page`, variant: 'destructive' });
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
              <TableRow key={page.id}>
                <TableCell className="font-medium">{page.title}</TableCell>
                <TableCell>
                  <Badge variant="outline">{page.slug}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(page)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(page.id)}>
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
