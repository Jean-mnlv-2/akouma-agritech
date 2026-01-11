import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { AdminProductDialog } from './AdminProductDialog';

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
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/shop_products', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load');
      const body = await res.json();
      const items = Array.isArray(body) ? body : body.data;
      setProducts(items || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les produits', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleCreate = () => { setEditingProduct(null); setDialogOpen(true); };
  const handleEdit = (product: ProductRow) => { setEditingProduct(product); setDialogOpen(true); };

  const handleDelete = async (productId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;
    try {
      const res = await fetch(`/api/shop_products/${productId}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to delete');
      toast({ title: 'Succès', description: 'Produit supprimé avec succès' });
      fetchProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({ title: 'Erreur', description: error?.message || 'Impossible de supprimer le produit', variant: 'destructive' });
    }
  };

  type ProductUpsert = Record<string, unknown>;
  const handleSave = async (productData: ProductUpsert) => {
    try {
      const isEditing = !!editingProduct;
      let res: Response;
      if (isEditing) {
        res = await fetch(`/api/shop_products/${(editingProduct as any).id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(productData),
        });
      } else {
        res = await fetch('/api/shop_products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(productData),
        });
      }
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Succès', description: `Produit ${editingProduct ? 'modifié' : 'créé'} avec succès` });
      setDialogOpen(false);
      fetchProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({ title: 'Erreur', description: error?.message || `Impossible de ${editingProduct ? 'modifier' : 'créer'} le produit`, variant: 'destructive' });
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