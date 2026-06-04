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
import { api } from '@/integrations/api/client';

interface Seed {
  id: string;
  name: string;
  description: string;
  category: string;
  variety: string;
  price_fcfa: number;
  unit: string;
  stock_quantity: number;
  availability: string;
  image_url: string;
  gallery?: string[];
  gallery_urls?: string;
  planting_instructions: string;
  care_instructions: string;
  harvest_time: string;
  yield_info: string;
  features: string | string[];
  fullDescription: string;
  origin: string;
  purity: string;
  germination: string;
  moisture: string;
  packaging: string;
  soilType: string;
  plantingDepth: string;
  spacing: string;
  watering: string;
  fertilizer: string;
  diseases: string | string[];
  isPublished?: boolean;
  isFeatured?: boolean;
  isCopyProtected?: boolean;
  is_published: boolean;
  is_featured: boolean;
  is_copy_protected: boolean;
  rating: number;
  total_reviews: number;
  slug: string;
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
    fullDescription: '',
    origin: '',
    purity: '',
    germination: '',
    moisture: '',
    packaging: '',
    soilType: '',
    plantingDepth: '',
    spacing: '',
    watering: '',
    fertilizer: '',
    diseases: '',
    is_published: true,
    is_featured: false,
    is_copy_protected: false,
    slug: ''
  });

  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // New: gallery state
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (seed) {
      setFormData({
        name: seed.name || '',
        description: seed.description || '',
        category: seed.category || '',
        variety: seed.variety || '',
        price_fcfa: seed.price_fcfa || 0,
        unit: seed.unit || '',
        stock_quantity: seed.stock_quantity || 0,
        availability: seed.availability || 'En stock',
        image_url: seed.image_url || '',
        gallery_urls: seed.gallery_urls || (Array.isArray(seed.gallery) ? seed.gallery.join(',') : ''),
        planting_instructions: seed.planting_instructions || '',
        care_instructions: seed.care_instructions || '',
        harvest_time: seed.harvest_time || '',
        yield_info: seed.yield_info || '',
        features: Array.isArray(seed.features) ? seed.features.join(', ') : (seed.features || ''),
        fullDescription: seed.fullDescription || '',
        origin: seed.origin || '',
        purity: seed.purity || '',
        germination: seed.germination || '',
        moisture: seed.moisture || '',
        packaging: seed.packaging || '',
        soilType: seed.soilType || '',
        plantingDepth: seed.plantingDepth || '',
        spacing: seed.spacing || '',
        watering: seed.watering || '',
        fertilizer: seed.fertilizer || '',
        diseases: Array.isArray(seed.diseases) ? seed.diseases.join(', ') : (seed.diseases || ''),
        is_published: seed.is_published ?? seed.isPublished ?? false,
        is_featured: !!(seed.is_featured ?? seed.isFeatured),
        is_copy_protected: !!(seed.is_copy_protected ?? seed.isCopyProtected),
        slug: seed.slug || slugify(seed.name || '')
      });
      setGalleryUrls(Array.isArray(seed.gallery) ? seed.gallery : []);
      setPreviewUrl(seed.image_url || null);
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
        fullDescription: '',
        origin: '',
        purity: '',
        germination: '',
        moisture: '',
        packaging: '',
        soilType: '',
        plantingDepth: '',
        spacing: '',
        watering: '',
        fertilizer: '',
        diseases: '',
        is_published: false,
        is_featured: false,
        is_copy_protected: false,
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
    const diseases = formData.diseases ? formData.diseases.split(',').map(d => d.trim()) : [];
    
    onSave({
      ...formData,
      slug,
      features,
      diseases,
      image_url: formData.image_url || galleryUrls[0] || '',
      gallery: galleryUrls,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const data = await api.request('POST', '/api/upload', { body: fd });
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
        const data = await api.request('POST', '/api/upload', { body: fd });
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
            {seed ? 'Modifier la semence' : 'Ajouter une semence'}
          </DialogTitle>
          <DialogDescription>
            Renseignez les détails techniques et commerciaux de la semence.
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 min-h-[250px] flex flex-col">
              <Label>Description Complète (HTML)</Label>
              <div className="flex-1">
                <ReactQuill 
                  theme="snow"
                  value={formData.fullDescription}
                  onChange={(content) => setFormData({ ...formData, fullDescription: content })}
                  modules={quillModules}
                  className="h-[150px] mb-12"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="origin">Origine</Label>
                  <Input id="origin" value={formData.origin} onChange={(e) => setFormData({ ...formData, origin: e.target.value })} placeholder="ex: Local" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="purity">Pureté</Label>
                  <Input id="purity" value={formData.purity} onChange={(e) => setFormData({ ...formData, purity: e.target.value })} placeholder="ex: 99%" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="germination">Germination</Label>
                  <Input id="germination" value={formData.germination} onChange={(e) => setFormData({ ...formData, germination: e.target.value })} placeholder="ex: 95%" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="moisture">Humidité</Label>
                  <Input id="moisture" value={formData.moisture} onChange={(e) => setFormData({ ...formData, moisture: e.target.value })} placeholder="ex: 12%" />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="packaging">Conditionnement</Label>
                <Input id="packaging" value={formData.packaging} onChange={(e) => setFormData({ ...formData, packaging: e.target.value })} placeholder="ex: Sachet 25kg" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <Label className="font-bold">Guide de Culture</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="soilType">Type de sol</Label>
                  <Input id="soilType" value={formData.soilType} onChange={(e) => setFormData({ ...formData, soilType: e.target.value })} placeholder="ex: Argileux" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="plantingDepth">Profondeur</Label>
                  <Input id="plantingDepth" value={formData.plantingDepth} onChange={(e) => setFormData({ ...formData, plantingDepth: e.target.value })} placeholder="ex: 2-3 cm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="spacing">Espacement</Label>
                  <Input id="spacing" value={formData.spacing} onChange={(e) => setFormData({ ...formData, spacing: e.target.value })} placeholder="ex: 75x25 cm" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="watering">Arrosage</Label>
                  <Input id="watering" value={formData.watering} onChange={(e) => setFormData({ ...formData, watering: e.target.value })} placeholder="ex: Régulier" />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="fertilizer">Engrais recommandé</Label>
                <Input id="fertilizer" value={formData.fertilizer} onChange={(e) => setFormData({ ...formData, fertilizer: e.target.value })} placeholder="ex: NPK 15-15-15" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="diseases">Maladies communes (séparées par des virgules)</Label>
                <Input id="diseases" value={formData.diseases} onChange={(e) => setFormData({ ...formData, diseases: e.target.value })} placeholder="ex: Mildiou, Pucerons" />
              </div>
            </div>
            
            <div className="space-y-4">
              <Label className="font-bold">Infos Récolte</Label>
              <div className="space-y-1">
                <Label htmlFor="harvest_time">Temps de récolte</Label>
                <Input id="harvest_time" value={formData.harvest_time} onChange={(e) => setFormData({ ...formData, harvest_time: e.target.value })} placeholder="ex: 120-140 jours" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="yield_info">Rendement estimé</Label>
                <Input id="yield_info" value={formData.yield_info} onChange={(e) => setFormData({ ...formData, yield_info: e.target.value })} placeholder="ex: 8-12 tonnes/ha" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 min-h-[250px] flex flex-col">
              <Label>Instructions de plantation</Label>
              <div className="flex-1">
                <ReactQuill 
                  theme="snow"
                  value={formData.planting_instructions}
                  onChange={(content) => setFormData({ ...formData, planting_instructions: content })}
                  modules={quillModules}
                  className="h-[150px] mb-12"
                />
              </div>
            </div>
            <div className="space-y-2 min-h-[250px] flex flex-col">
              <Label>Instructions d'entretien</Label>
              <div className="flex-1">
                <ReactQuill 
                  theme="snow"
                  value={formData.care_instructions}
                  onChange={(content) => setFormData({ ...formData, care_instructions: content })}
                  modules={quillModules}
                  className="h-[150px] mb-12"
                />
              </div>
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
            {previewUrl && (<div className="mt-2"><img src={previewUrl} alt="Aperçu de la photo de la semence" className="w-32 h-32 object-cover rounded border" /></div>)}
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
            <div className="flex items-center space-x-2"><Switch id="is_copy_protected" checked={formData.is_copy_protected} onCheckedChange={(checked) => setFormData({ ...formData, is_copy_protected: checked })} /><Label htmlFor="is_copy_protected">Protéger la copie</Label></div>
          </div>

          <div className="flex justify-end space-x-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit">{seed ? 'Modifier' : 'Créer'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}