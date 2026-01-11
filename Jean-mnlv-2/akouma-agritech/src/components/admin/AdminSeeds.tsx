import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { AdminSeedDialog } from './AdminSeedDialog';

interface Seed {
  id: string;
  name: string;
  category?: string;
  variety?: string;
  price?: number;
  unit?: string;
  stock?: number;
  availability?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  imageUrl?: string;
  createdAt?: string;
  // Legacy fields for backward display compatibility
  price_fcfa?: number;
  stock_quantity?: number;
  is_published?: boolean;
  is_featured?: boolean;
  image_url?: string;
}

export function AdminSeeds() {
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSeed, setEditingSeed] = useState<Seed | null>(null);
  const { toast } = useToast();

  const fetchSeeds = useCallback(async () => {
    try {
      const res = await fetch('/api/seeds', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load');
      const body = await res.json();
      const items = Array.isArray(body) ? body : body.data;
      setSeeds(items || []);
    } catch (error) {
      console.error('Error fetching seeds:', error);
      toast({ title: 'Erreur', description: "Impossible de charger les semences", variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSeeds();
  }, [fetchSeeds]);

  const handleCreate = () => {
    setEditingSeed(null);
    setDialogOpen(true);
  };

  const handleEdit = (seed: Seed) => {
    setEditingSeed(seed);
    setDialogOpen(true);
  };

  const handleDelete = async (seedId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette semence ?')) return;
    try {
      const res = await fetch(`/api/seeds/${seedId}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to delete');
      toast({ title: 'Succès', description: 'Semence supprimée avec succès' });
      fetchSeeds();
    } catch (error) {
      console.error('Error deleting seed:', error);
      toast({ title: 'Erreur', description: 'Impossible de supprimer la semence', variant: 'destructive' });
    }
  };

  type SeedUpsert = Record<string, unknown>;
  const handleSave = async (seedData: SeedUpsert) => {
    try {
      const isEditing = !!editingSeed;
      // Map legacy dialog fields to Prisma API
      const payload = {
        name: seedData.name || '',
        description: (seedData as any).description || null,
        category: (seedData as any).category || null,
        variety: (seedData as any).variety || null,
        price: (seedData as any).price_fcfa || 0,
        unit: (seedData as any).unit || null,
        stock: (seedData as any).stock_quantity || 0,
        availability: (seedData as any).availability || null,
        imageUrl: (seedData as any).image_url || null,
        isPublished: (seedData as any).is_published !== false,
        slug: (seedData as any).slug || undefined,
      };

      let res: Response;
      if (isEditing) {
        res = await fetch(`/api/seeds/${editingSeed!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/seeds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Request failed');
      }

      toast({ title: 'Succès', description: `Semence ${isEditing ? 'modifiée' : 'créée'} avec succès` });
      setDialogOpen(false);
      fetchSeeds();
    } catch (error) {
      console.error('Error saving seed:', error);
      toast({ title: 'Erreur', description: `Impossible de ${editingSeed ? 'modifier' : 'créer'} la semence`, variant: 'destructive' });
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
            <CardTitle>Gestion des Semences</CardTitle>
            <CardDescription>Créez et gérez le catalogue de semences</CardDescription>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Semence
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aperçu</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Variété</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {seeds.map((seed) => (
              <TableRow key={seed.id}>
                <TableCell>
                  {seed.image_url || seed.imageUrl ? (
                    <img src={(seed.image_url || seed.imageUrl)!} alt={seed.name} className="w-10 h-10 rounded object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted" />
                  )}
                </TableCell>
                <TableCell className="font-medium">{seed.name}</TableCell>
                <TableCell>{seed.category}</TableCell>
                <TableCell>{seed.variety}</TableCell>
                <TableCell>{(seed.price_fcfa || seed.price || 0).toLocaleString()} FCFA/{seed.unit || ''}</TableCell>
                <TableCell>{seed.stock_quantity ?? seed.stock ?? 0}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Badge variant={(seed.is_published ?? seed.isPublished) ? 'default' : 'secondary'}>
                      {(seed.is_published ?? seed.isPublished) ? 'Publié' : 'Brouillon'}
                    </Badge>
                    {(seed.is_featured ?? seed.isFeatured) && (<Badge variant="outline">Mis en avant</Badge>)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(seed)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(seed.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {seeds.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Aucune semence trouvée</p>
          </div>
        )}
      </CardContent>

      <AdminSeedDialog open={dialogOpen} onOpenChange={setDialogOpen} seed={editingSeed as any} onSave={handleSave} />
    </Card>
  );
}