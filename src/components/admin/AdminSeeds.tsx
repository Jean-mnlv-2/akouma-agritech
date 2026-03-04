import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Loader2, Search, Leaf } from 'lucide-react';
import { AdminSeedDialog } from './AdminSeedDialog';
import AdminDetailsDialog from './AdminDetailsDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/integrations/api/client';

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
  price_fcfa?: number;
  stock_quantity?: number;
  is_published?: boolean;
  is_featured?: boolean;
  image_url?: string;
  harvestTime?: string;
  harvest_time?: string;
  yield?: string;
  yield_info?: string;
  features?: string[];
  fullDescription?: string;
  origin?: string;
  purity?: string;
  germination?: string;
  moisture?: string;
  packaging?: string;
  soilType?: string;
  plantingDepth?: string;
  spacing?: string;
  watering?: string;
  fertilizer?: string;
  diseases?: string[];
  plantingInstructions?: string;
  planting_instructions?: string;
  careInstructions?: string;
  care_instructions?: string;
  totalReviews?: number;
  total_reviews?: number;
  slug?: string;
}

export function AdminSeeds() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingSeed, setEditingSeed] = useState<Seed | null>(null);
  const [viewingSeed, setViewingSeed] = useState<Seed | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const { data: seeds = [], isLoading } = useQuery<Seed[]>({
    queryKey: ['admin', 'seeds'],
    queryFn: async () => {
      const res = await api.request('GET', '/api/seeds');
      const items = Array.isArray(res) ? res : res.data;
      return items || [];
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const handleCreate = () => {
    setEditingSeed(null);
    setDialogOpen(true);
  };

  const handleEdit = (seed: Seed) => {
    setEditingSeed(seed);
    setDialogOpen(true);
  };

  const deleteMutation = useMutation({
    mutationFn: async (seedId: string) => api.request('DELETE', `/api/seeds/${seedId}`),
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Semence supprimée avec succès' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'seeds'] });
    },
    onError: (error: unknown) => {
      console.error('Error deleting seed:', error);
      toast({ title: 'Erreur', description: 'Impossible de supprimer la semence', variant: 'destructive' });
    }
  });
  const handleDelete = (seedId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette semence ?')) return;
    deleteMutation.mutate(seedId);
  };

  type SeedUpsert = Record<string, unknown>;
  const upsertMutation = useMutation({
    mutationFn: async (payload: { data: SeedUpsert; id?: string }) => {
      const seedData = payload.data;
      const mapped = {
        name: seedData.name || '',
        description: seedData.description || null,
        category: seedData.category || null,
        variety: seedData.variety || null,
        price: seedData.price_fcfa ?? seedData.price ?? 0,
        unit: seedData.unit || null,
        stock: seedData.stock_quantity ?? seedData.stock ?? 0,
        availability: seedData.availability || null,
        imageUrl: seedData.image_url ?? seedData.imageUrl ?? null,
        isPublished: seedData.is_published ?? seedData.isPublished ?? false,
        isFeatured: seedData.is_featured ?? seedData.isFeatured ?? false,
        slug: seedData.slug || undefined,
        // New enriched fields
        harvestTime: seedData.harvest_time ?? seedData.harvestTime ?? null,
        yield: seedData.yield_info ?? seedData.yield ?? null,
        features: seedData.features ?? [],
        fullDescription: seedData.fullDescription ?? null,
        origin: seedData.origin ?? null,
        purity: seedData.purity ?? null,
        germination: seedData.germination ?? null,
        moisture: seedData.moisture ?? null,
        packaging: seedData.packaging ?? null,
        soilType: seedData.soilType ?? null,
        plantingDepth: seedData.plantingDepth ?? null,
        spacing: seedData.spacing ?? null,
        watering: seedData.watering ?? null,
        fertilizer: seedData.fertilizer ?? null,
        diseases: seedData.diseases ?? [],
        plantingInstructions: seedData.planting_instructions ?? seedData.plantingInstructions ?? null,
        careInstructions: seedData.care_instructions ?? seedData.careInstructions ?? null,
      };
      if (payload.id) return api.request('PUT', `/api/seeds/${payload.id}`, { body: mapped });
      return api.request('POST', '/api/seeds', { body: mapped });
    },
    onSuccess: () => {
      toast({ title: 'Succès', description: `Semence ${editingSeed ? 'modifiée' : 'créée'} avec succès` });
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'seeds'] });
    },
    onError: (error: unknown) => {
      console.error('Error saving seed:', error);
      toast({ title: 'Erreur', description: `Impossible de ${editingSeed ? 'modifier' : 'créer'} la semence`, variant: 'destructive' });
    }
  });
  const handleSave = (seedData: SeedUpsert) => {
    const id = editingSeed?.id;
    upsertMutation.mutate({
      data: {
        ...seedData,
        price: seedData.price_fcfa || seedData.price,
        stock: seedData.stock_quantity || seedData.stock,
      },
      id
    });
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
              <TableRow 
                key={seed.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  setViewingSeed(seed);
                  setIsDetailsOpen(true);
                }}
              >
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(seed);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(seed.id);
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
        {seeds.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Aucune semence trouvée</p>
          </div>
        )}
      </CardContent>

      <AdminSeedDialog open={dialogOpen} onOpenChange={setDialogOpen} seed={editingSeed as any} onSave={handleSave} />

      <AdminDetailsDialog
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={viewingSeed?.name || ''}
        data={viewingSeed}
        type="seed"
      />
    </Card>
  );
}
