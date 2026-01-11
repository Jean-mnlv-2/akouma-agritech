import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Uploads handled by backend API
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useRef } from 'react';

interface Product {
  id: string;
  name: string;
  category: string;
  price_fcfa: number;
  original_price_fcfa: number;
  stock_quantity: number;
  in_stock: boolean;
  is_published: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new: boolean;
  rating: number;
  total_reviews: number;
}

interface AdminProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSave: (productData: any) => void;
}

export function AdminProductDialog({ open, onOpenChange, product, onSave }: AdminProductDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price_fcfa: 0,
    original_price_fcfa: 0,
    stock_quantity: 0,
    dimensions: '',
    weight_kg: 0,
    warranty_info: '',
    shipping_info: '',
    image_url: '',
    gallery_urls: '',
    features: '',
    specifications: '',
    in_stock: true,
    is_published: true,
    is_featured: false,
    is_bestseller: false,
    is_new: false,
    slug: ''
  });

  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(formData.image_url || null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // New: gallery state
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: '',
        category: product.category || '',
        price_fcfa: product.price_fcfa || 0,
        original_price_fcfa: product.original_price_fcfa || 0,
        stock_quantity: product.stock_quantity || 0,
        dimensions: '',
        weight_kg: 0,
        warranty_info: '',
        shipping_info: '',
        image_url: '',
        gallery_urls: '',
        features: '',
        specifications: '',
        in_stock: product.in_stock || true,
        is_published: product.is_published || true,
        is_featured: product.is_featured || false,
        is_bestseller: product.is_bestseller || false,
        is_new: product.is_new || false,
        slug: product.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || ''
      });
      // Reset gallery on open edit
      setGalleryUrls([]);
      setPreviewUrl(null);
    } else {
      setFormData({
        name: '',
        description: '',
        category: '',
        price_fcfa: 0,
        original_price_fcfa: 0,
        stock_quantity: 0,
        dimensions: '',
        weight_kg: 0,
        warranty_info: '',
        shipping_info: '',
        image_url: '',
        gallery_urls: '',
        features: '',
        specifications: '',
        in_stock: true,
        is_published: true,
        is_featured: false,
        is_bestseller: false,
        is_new: false,
        slug: ''
      });
      setGalleryUrls([]);
      setPreviewUrl(null);
    }
  }, [product, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const features = formData.features ? formData.features.split(',').map(f => f.trim()) : [];
    let specifications = {} as any;
    if (formData.specifications) {
      try { specifications = JSON.parse(formData.specifications); } catch { specifications = { description: formData.specifications }; }
    }
    // Map to Prisma ShopProduct fields
    const payload = {
      name: formData.name,
      description: formData.description || null,
      category: formData.category || null,
      price: formData.price_fcfa || 0,
      stock: formData.stock_quantity || 0,
      imageUrl: formData.image_url || galleryUrls[0] || null,
      gallery: galleryUrls.length ? galleryUrls : undefined,
      isActive: formData.is_published !== false,
      slug,
      _ui: { features, specifications, original_price_fcfa: formData.original_price_fcfa, in_stock: formData.in_stock, is_featured: formData.is_featured, is_bestseller: formData.is_bestseller, is_new: formData.is_new, gallery_urls_legacy: formData.gallery_urls }
    };
    onSave(payload);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', credentials: 'include', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const url = data.url;
      setFormData({ ...formData, image_url: url });
      setPreviewUrl(url);
    } catch (err) {
      alert('Erreur lors de l\'upload de l\'image');
    }
    setUploading(false);
  };

  // New: handle multiple gallery uploads
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setGalleryUploading(true);
    try {
      const remainingSlots = Math.max(0, 4 - (galleryUrls?.length || 0));
      const toUpload = files.slice(0, remainingSlots);
      const uploads = toUpload.map(async (file) => {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', credentials: 'include', body: fd });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        return data.url as string;
      });
      const urls = await Promise.all(uploads);
      setGalleryUrls((prev) => Array.from(new Set([...(prev || []), ...urls])));
    } catch (_e) {
      alert('Erreur lors de l\'upload de la galerie');
    } finally {
      setGalleryUploading(false);
    }
  };

  const removeGalleryImage = (url: string) => {
    setGalleryUrls((prev) => (prev || []).filter((u) => u !== url));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Modifier le produit' : 'Nouveau produit'}
          </DialogTitle>
          <DialogDescription>
            Remplissez les informations du produit
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input id="slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="genere-automatiquement" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <ReactQuill id="description" theme="snow" value={formData.description} onChange={(value) => setFormData({ ...formData, description: value })} className="bg-white rounded" style={{ minHeight: 120 }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner une catégorie" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Outils Agricoles">Outils Agricoles</SelectItem>
                  <SelectItem value="Équipements">Équipements</SelectItem>
                  <SelectItem value="Capteurs IoT">Capteurs IoT</SelectItem>
                  <SelectItem value="Irrigation">Irrigation</SelectItem>
                  <SelectItem value="Fertilisants">Fertilisants</SelectItem>
                  <SelectItem value="Protection">Protection</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock_quantity">Stock</Label>
              <Input id="stock_quantity" type="number" value={formData.stock_quantity} onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price_fcfa">Prix (FCFA) *</Label>
              <Input id="price_fcfa" type="number" value={formData.price_fcfa} onChange={(e) => setFormData({ ...formData, price_fcfa: parseInt(e.target.value) || 0 })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="original_price_fcfa">Prix original (FCFA)</Label>
              <Input id="original_price_fcfa" type="number" value={formData.original_price_fcfa} onChange={(e) => setFormData({ ...formData, original_price_fcfa: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dimensions">Dimensions</Label>
              <Input id="dimensions" value={formData.dimensions} onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })} placeholder="ex: 50x30x20 cm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight_kg">Poids (kg)</Label>
              <Input id="weight_kg" type="number" step="0.1" value={formData.weight_kg} onChange={(e) => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>

          {/* Image principale */}
          <div className="space-y-2">
            <Label htmlFor="image_upload">Image du produit</Label>
            <div className="flex items-center gap-3">
              <Input id="image_upload" type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} ref={imageInputRef} className="hidden" />
              <Button type="button" variant="outline" onClick={() => imageInputRef.current?.click()} disabled={uploading}>{uploading ? 'Upload...' : 'Remplacer l\'image'}</Button>
            </div>
            {uploading && <div className="text-xs text-muted-foreground">Upload en cours...</div>}
            {previewUrl && (<div className="mt-2"><img src={previewUrl} alt="Aperçu" className="w-32 h-32 object-cover rounded border" /></div>)}
          </div>

          {/* Galerie d'images (multi) */}
          <div className="space-y-2">
            <Label htmlFor="gallery_upload">Galerie (au plus 4 images)</Label>
            <div className="flex items-center gap-3">
              <Input id="gallery_upload" type="file" accept="image/*" multiple onChange={handleGalleryUpload} disabled={galleryUploading || (galleryUrls.length >= 4)} ref={galleryInputRef} className="hidden" />
              <Button type="button" variant="outline" onClick={() => galleryInputRef.current?.click()} disabled={galleryUploading || (galleryUrls.length >= 4)}>{galleryUploading ? 'Upload...' : 'Ajouter des images'}</Button>
              <div className="text-sm text-muted-foreground">{galleryUrls.length} / 4 image(s)</div>
            </div>
            {galleryUrls.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mt-2">
                {galleryUrls.map((url) => (
                  <div key={url} className="relative group">
                    <img src={url} alt="Galerie" className="w-24 h-24 object-cover rounded border" />
                    <button type="button" onClick={() => removeGalleryImage(url)} className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100">×</button>
                  </div>
                ))}
              </div>
            )}
            {galleryUrls.length >= 4 && (
              <div className="text-xs text-muted-foreground">Limite atteinte (4 images max).</div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="features">Caractéristiques (séparées par des virgules)</Label>
            <Input id="features" value={formData.features} onChange={(e) => setFormData({ ...formData, features: e.target.value })} placeholder="Haute qualité, Durable, Garantie 2 ans" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="flex items-center space-x-2"><Switch id="in_stock" checked={formData.in_stock} onCheckedChange={(checked) => setFormData({ ...formData, in_stock: checked })} /><Label htmlFor="in_stock">En stock</Label></div>
            <div className="flex items-center space-x-2"><Switch id="is_published" checked={formData.is_published} onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })} /><Label htmlFor="is_published">Publié</Label></div>
            <div className="flex items-center space-x-2"><Switch id="is_featured" checked={formData.is_featured} onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })} /><Label htmlFor="is_featured">Mis en avant</Label></div>
            <div className="flex items-center space-x-2"><Switch id="is_new" checked={formData.is_new} onCheckedChange={(checked) => setFormData({ ...formData, is_new: checked })} /><Label htmlFor="is_new">Nouveau</Label></div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit">{product ? 'Modifier' : 'Créer'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}