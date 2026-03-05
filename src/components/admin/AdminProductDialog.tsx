import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { slugify } from '@/lib/utils';
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
  is_copy_protected: boolean;
  rating: number;
  total_reviews: number;
  gallery?: string[];
}

interface AdminProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSave: (productData: Record<string, unknown>) => void;
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
    is_copy_protected: false,
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
        description: (product as any).description || '',
        category: product.category || '',
        price_fcfa: product.price_fcfa || 0,
        original_price_fcfa: product.original_price_fcfa || 0,
        stock_quantity: product.stock_quantity || 0,
        dimensions: (product as any).dimensions || '',
        weight_kg: (product as any).weight_kg || 0,
        warranty_info: (product as any).warranty_info || '',
        shipping_info: (product as any).shipping_info || '',
        image_url: (product as any).imageUrl || (product as any).image_url || '',
        gallery_urls: Array.isArray(product.gallery) ? product.gallery.join(',') : ((product as any).gallery_urls || ''),
        features: Array.isArray((product as any).features) ? (product as any).features.join(',') : ((product as any).features || ''),
        specifications: typeof (product as any).specifications === 'object' ? JSON.stringify((product as any).specifications) : ((product as any).specifications || ''),
        in_stock: !!product.in_stock,
        is_published: !!product.is_published,
        is_featured: !!product.is_featured,
        is_bestseller: !!product.is_bestseller,
        is_new: !!product.is_new,
        is_copy_protected: !!product.is_copy_protected,
        slug: (product as any).slug || slugify(product.name || '')
      });
      setGalleryUrls(Array.isArray(product.gallery) ? product.gallery : []);
      setPreviewUrl((product as any).imageUrl || (product as any).image_url || null);
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
        in_stock: false,
        is_published: false,
        is_featured: false,
        is_bestseller: false,
        is_new: false,
        is_copy_protected: false,
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
      imageUrl: formData.image_url || null,
      gallery: galleryUrls.length ? galleryUrls : [],
      isActive: formData.in_stock,
      isPublished: formData.is_published,
      isFeatured: formData.is_featured,
      isNew: formData.is_new,
      isCopyProtected: formData.is_copy_protected,
      slug,
      features: formData.features ? formData.features.split(',').map(f => f.trim()).filter(Boolean) : [],
      specifications: specifications
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
    } catch {
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
    } catch {
      alert('Erreur lors de l\'upload de la galerie');
    } finally {
      setGalleryUploading(false);
    }
  };

  const removeGalleryImage = (url: string) => {
    setGalleryUrls((prev) => (prev || []).filter((u) => u !== url));
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'clean']
    ],
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {product ? "Modifier le produit" : "Ajouter un produit"}
          </DialogTitle>
          <DialogDescription>
            Gérez les articles de la boutique AKOUMA.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => {
                  const newName = e.target.value;
                  const newSlug = slugify(newName);
                  if (!formData.slug || formData.slug === slugify(formData.name)) {
                    setFormData({ ...formData, name: newName, slug: newSlug });
                  } else {
                    setFormData({ ...formData, name: newName });
                  }
                }} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input id="slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="genere-automatiquement" />
            </div>
          </div>
          <div className="space-y-2 min-h-[250px] flex flex-col">
            <Label>Description *</Label>
            <div className="flex-1">
              <ReactQuill 
                theme="snow"
                value={formData.description}
                onChange={(content) => setFormData({ ...formData, description: content })}
                modules={quillModules}
                className="h-[150px] mb-12"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price_fcfa">Prix (FCFA) *</Label>
              <Input id="price_fcfa" type="number" value={formData.price_fcfa} onChange={(e) => setFormData({ ...formData, price_fcfa: parseInt(e.target.value) || 0 })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="original_price_fcfa">Prix original (FCFA)</Label>
              <Input id="original_price_fcfa" type="number" value={formData.original_price_fcfa} onChange={(e) => setFormData({ ...formData, original_price_fcfa: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 min-h-[250px] flex flex-col">
              <Label>Caractéristiques</Label>
              <div className="flex-1">
                <ReactQuill 
                  theme="snow"
                  value={formData.features}
                  onChange={(content) => setFormData({ ...formData, features: content })}
                  modules={quillModules}
                  className="h-[150px] mb-12"
                />
              </div>
            </div>
            <div className="space-y-2 min-h-[250px] flex flex-col">
              <Label>Spécifications</Label>
              <div className="flex-1">
                <ReactQuill 
                  theme="snow"
                  value={formData.specifications}
                  onChange={(content) => setFormData({ ...formData, specifications: content })}
                  modules={quillModules}
                  className="h-[150px] mb-12"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="flex items-center space-x-2">
              <Switch id="in_stock" checked={formData.in_stock} onCheckedChange={(checked) => setFormData({ ...formData, in_stock: checked })} />
              <Label htmlFor="in_stock">En stock</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="is_published" checked={formData.is_published} onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })} />
              <Label htmlFor="is_published">Publié</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="is_featured" checked={formData.is_featured} onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })} />
              <Label htmlFor="is_featured">Vedette</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="is_new" checked={formData.is_new} onCheckedChange={(checked) => setFormData({ ...formData, is_new: checked })} />
              <Label htmlFor="is_new">Nouveau</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="is_copy_protected" checked={formData.is_copy_protected} onCheckedChange={(checked) => setFormData({ ...formData, is_copy_protected: checked })} />
              <Label htmlFor="is_copy_protected">Protéger la copie</Label>
            </div>
          </div>
          <div className="flex justify-end space-x-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit">{product ? "Modifier" : "Créer"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}