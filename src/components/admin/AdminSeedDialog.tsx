import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { slugify } from '@/lib/utils';
// import ReactQuill from 'react-quill';
// import 'react-quill/dist/quill.snow.css';
import { useRef } from 'react';

interface Seed {
  id: string;
  name: string;
  category: string;
  variety: string;
  price_fcfa: number;
  unit: string;
  stock_quantity: number;
  availability: string;
  is_published: boolean;
  is_featured: boolean;
  rating: number;
  total_reviews: number;
}

interface AdminSeedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seed: Seed | null;
  onSave: (seedData: Record<string, unknown>) => void;
}

export function AdminSeedDialog({ open, onOpenChange, seed, onSave }: AdminSeedDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    variety: '',
    price_fcfa: 0,
    unit: '',
    stock_quantity: 0,
    availability: 'En stock',
    image_url: '',
    gallery_urls: '',
    planting_instructions: '',
    care_instructions: '',
    harvest_time: '',
    yield_info: '',
    features: '',
    is_published: true,
    is_featured: false,
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
    if (seed) {
      setFormData({
        name: seed.name || '',
        description: '',
        category: seed.category || '',
        variety: seed.variety || '',
        price_fcfa: seed.price_fcfa || 0,
        unit: seed.unit || '',
        stock_quantity: seed.stock_quantity || 0,
        availability: seed.availability || 'En stock',
        image_url: '',
        gallery_urls: '',
        planting_instructions: '',
        care_instructions: '',
        harvest_time: '',
        yield_info: '',
        features: '',
        is_published: seed.is_published || true,
        is_featured: seed.is_featured || false,
        slug: (seed as any).slug || slugify(seed.name || '')
      });
      setGalleryUrls([]);
      setPreviewUrl(null);
    } else {
      setFormData({
        name: '',
        description: '',
        category: '',
        variety: '',
        price_fcfa: 0,
        unit: '',
        stock_quantity: 0,
        availability: 'En stock',
        image_url: '',
        gallery_urls: '',
        planting_instructions: '',
        care_instructions: '',
        harvest_time: '',
        yield_info: '',
        features: '',
        is_published: true,
        is_featured: false,
        slug: ''
      });
      setGalleryUrls([]);
      setPreviewUrl(null);
    }
  }, [seed, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const features = formData.features ? formData.features.split(',').map(f => f.trim()) : [];
    onSave({
      ...formData,
      slug,
      features,
      image_url: formData.image_url || galleryUrls[0] || '',
      gallery: galleryUrls.length ? galleryUrls : undefined,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const resp = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include' });
      if (!resp.ok) throw new Error('Upload failed');
      const data = await resp.json();
      const url = data.url as string;
      setFormData({ ...formData, image_url: url });
      setPreviewUrl(url);
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Erreur lors de l\'upload de l\'image');
    } finally {
      setUploading(false);
    }
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
    } catch (error) {
      console.error('Gallery upload error:', error);
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
            {seed ? 'Modifier la semence' : 'Ajouter une semence'}
          </DialogTitle>
          <DialogDescription>
            Renseignez les détails techniques et commerciaux de la semence.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
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

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea 
              id="description" 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              className="bg-white rounded" 
              style={{ minHeight: 120 }} 
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner une catégorie" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Légumes">Légumes</SelectItem>
                  <SelectItem value="Fruits">Fruits</SelectItem>
                  <SelectItem value="Céréales">Céréales</SelectItem>
                  <SelectItem value="Légumineuses">Légumineuses</SelectItem>
                  <SelectItem value="Aromates">Aromates</SelectItem>
                  <SelectItem value="Fleurs">Fleurs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="variety">Variété</Label>
              <Input id="variety" value={formData.variety} onChange={(e) => setFormData({ ...formData, variety: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unité *</Label>
              <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner une unité" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gramme">Gramme</SelectItem>
                  <SelectItem value="kg">Kilogramme</SelectItem>
                  <SelectItem value="paquet">Paquet</SelectItem>
                  <SelectItem value="sachet">Sachet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price_fcfa">Prix (FCFA) *</Label>
              <Input id="price_fcfa" type="number" value={formData.price_fcfa} onChange={(e) => setFormData({ ...formData, price_fcfa: parseInt(e.target.value) || 0 })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock_quantity">Stock</Label>
              <Input id="stock_quantity" type="number" value={formData.stock_quantity} onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="availability">Disponibilité</Label>
              <Select value={formData.availability} onValueChange={(value) => setFormData({ ...formData, availability: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="En stock">En stock</SelectItem>
                  <SelectItem value="Rupture de stock">Rupture de stock</SelectItem>
                  <SelectItem value="Bientôt disponible">Bientôt disponible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="planting_instructions">Instructions de plantation</Label>
              <Textarea 
                id="planting_instructions" 
                value={formData.planting_instructions} 
                onChange={(e) => setFormData({ ...formData, planting_instructions: e.target.value })} 
                className="bg-white rounded" 
                style={{ minHeight: 120 }} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="care_instructions">Instructions d'entretien</Label>
              <Textarea 
                id="care_instructions" 
                value={formData.care_instructions} 
                onChange={(e) => setFormData({ ...formData, care_instructions: e.target.value })} 
                className="bg-white rounded" 
                style={{ minHeight: 120 }} 
              />
            </div>
          </div>

          {/* Image principale */}
          <div className="space-y-2">
            <Label htmlFor="image_upload">Image de la semence</Label>
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
            <Input id="features" value={formData.features} onChange={(e) => setFormData({ ...formData, features: e.target.value })} placeholder="Résistant aux maladies, Croissance rapide, Bio" />
          </div>

          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2"><Switch id="is_published" checked={formData.is_published} onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })} /><Label htmlFor="is_published">Publié</Label></div>
            <div className="flex items-center space-x-2"><Switch id="is_featured" checked={formData.is_featured} onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })} /><Label htmlFor="is_featured">Mis en avant</Label></div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit">{seed ? 'Modifier' : 'Créer'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}