import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { AdminProductDialog } from './AdminProductDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/integrations/api/client';

interface ProductRow {
  id: string;
  name: string;
  category?: string;
  price?: number;
  stock?: number;
  imageUrl?: string;
  isActive?: boolean;
  // legacy for UI compatibility
  price_fcfa?: number;
  stock_quantity?: number;
  image_url?: string;
  is_published?: boolean;
  is_featured?: boolean;
  is_bestseller?: boolean;
  is_new?: boolean;
}

export function AdminProducts() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
  const { toast } = useToast();

  const { data: products = [], isLoading } = useQuery<ProductRow[]>({
    queryKey: ['admin', 'products'],
    queryFn: async () => {
      const res = await api.request('GET', '/api/shop_products');
      const items = Array.isArray(res) ? res : res.data;
      return items || [];
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const handleCreate = () => { setEditingProduct(null); setDialogOpen(true); };
  const handleEdit = (product: ProductRow) => { setEditingProduct(product); setDialogOpen(true); };

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => api.request('DELETE', `/api/shop_products/${productId}`),
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Produit supprimé avec succès' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
    onError: (error: unknown) => {
      console.error('Error deleting product:', error);
      toast({ title: 'Erreur', description: 'Impossible de supprimer le produit', variant: 'destructive' });
    }
  });
  const handleDelete = (productId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;
    deleteMutation.mutate(productId);
  };

  type ProductUpsert = Record<string, unknown>;
  const upsertMutation = useMutation({
    mutationFn: async (args: { data: ProductUpsert; id?: string }) => {
      if (args.id) return api.request('PUT', `/api/shop_products/${args.id}`, { body: args.data });
      return api.request('POST', '/api/shop_products', { body: args.data });
    },
    onSuccess: () => {
      toast({ title: 'Succès', description: `Produit ${editingProduct ? 'modifié' : 'créé'} avec succès` });
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
    onError: (error: unknown) => {
      console.error('Error saving product:', error);
      toast({ title: 'Erreur', description: `Impossible de ${editingProduct ? 'modifier' : 'créer'} le produit`, variant: 'destructive' });
    }
  });
  const handleSave = (productData: ProductUpsert) => {
    const id = editingProduct ? (editingProduct as any).id : undefined;
    upsertMutation.mutate({ data: productData, id });
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
            <CardTitle>Gestion des Produits</CardTitle>
            <CardDescription>Créez et gérez le catalogue de produits de la boutique</CardDescription>
          </div>
          <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" />Nouveau Produit</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aperçu</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product: any) => (
              <TableRow key={product.id}>
                <TableCell>
                  {product.image_url || product.imageUrl ? (
                    <img src={(product.image_url || product.imageUrl)!} alt={product.name} className="w-10 h-10 rounded object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted" />)
                  }
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>{Number(product.price_fcfa ?? product.price ?? 0).toLocaleString()} FCFA</TableCell>
                <TableCell>{product.stock_quantity ?? product.stock ?? 0}</TableCell>
                <TableCell>
                  <Badge variant={(product.is_published ?? product.isActive) ? 'default' : 'secondary'}>
                    {(product.is_published ?? product.isActive) ? 'Publié' : 'Brouillon'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {products.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Aucun produit trouvé</p>
          </div>
        )}
      </CardContent>

      <AdminProductDialog open={dialogOpen} onOpenChange={setDialogOpen} product={editingProduct as any} onSave={handleSave} />
    </Card>
  );
}
