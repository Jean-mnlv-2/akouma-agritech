import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { slugify } from '@/lib/utils';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useRef } from 'react';

interface NewsArticle {
  id: string;
  title: string;
  excerpt?: string | null;
  content?: string | null;
  author?: string | null;
  author_name?: string | null;
  category?: string | null;
  isPublished?: boolean;
  is_published?: boolean;
  is_featured?: boolean;
  createdAt?: string;
  created_at?: string;
  imageUrl?: string | null;
  image_url?: string | null;
  slug?: string;
}

interface AdminNewsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  news: NewsArticle | null;
  onSave: (newsData: Partial<NewsArticle>) => void;
}

export function AdminNewsDialog({ open, onOpenChange, news, onSave }: AdminNewsDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    author_name: '',
    author_bio: '',
    category: '',
    image_url: '',
    is_published: false,
    is_featured: false,
    slug: ''
  });

  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(formData.image_url || null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (news) {
      setFormData({
        title: news.title || '',
        excerpt: news.excerpt || '',
        content: news.content || '',
        author_name: news.author || news.author_name || '',
        author_bio: '',
        category: news.category || '',
        image_url: news.imageUrl || news.image_url || '',
        is_published: news.isPublished ?? news.is_published ?? false,
        is_featured: news.is_featured || false,
        slug: news.slug || slugify(news.title || '')
      });
      setPreviewUrl(news.imageUrl || news.image_url || null);
    } else {
      setFormData({
        title: '', excerpt: '', content: '', author_name: '', author_bio: '', category: '', image_url: '', is_published: false, is_featured: false, slug: ''
      });
      setPreviewUrl(null);
    }
  }, [news, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    // Map to Prisma fields
    const payload = {
      title: formData.title,
      excerpt: formData.excerpt || null,
      content: formData.content || null,
      author: formData.author_name || null,
      category: formData.category || null,
      imageUrl: formData.image_url || null,
      isPublished: formData.is_published || false,
      // is_featured/views_count non supportés côté modèle -> ignorer
      slug,
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
      console.error('Image upload error:', err);
      alert('Erreur lors de l\'upload de l\'image');
    }
    setUploading(false);
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image', 'clean']
    ],
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {news ? "Modifier l'actualité" : "Ajouter une actualité"}
          </DialogTitle>
          <DialogDescription>
            Publiez ou modifiez un article d'actualité pour la plateforme.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input 
                id="title" 
                value={formData.title} 
                onChange={(e) => {
                  const newTitle = e.target.value;
                  const newSlug = slugify(newTitle);
                  if (!formData.slug || formData.slug === slugify(formData.title)) {
                    setFormData({ ...formData, title: newTitle, slug: newSlug });
                  } else {
                    setFormData({ ...formData, title: newTitle });
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
            <Label htmlFor="excerpt">Extrait</Label>
            <Textarea 
              id="excerpt" 
              value={formData.excerpt} 
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })} 
              className="bg-white rounded" 
              placeholder="Court résumé de l'article..."
            />
          </div>
          <div className="space-y-2 min-h-[300px] flex flex-col">
            <Label>Contenu de l'article *</Label>
            <div className="flex-1">
              <ReactQuill 
                theme="snow"
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                modules={quillModules}
                className="h-[250px] mb-12"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="author_name">Nom de l'auteur *</Label>
              <Input id="author_name" value={formData.author_name} onChange={(e) => setFormData({ ...formData, author_name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner une catégorie" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Agriculture">Agriculture</SelectItem>
                  <SelectItem value="Technologie">Technologie</SelectItem>
                  <SelectItem value="Innovation">Innovation</SelectItem>
                  <SelectItem value="Environnement">Environnement</SelectItem>
                  <SelectItem value="Économie">Économie</SelectItem>
                  <SelectItem value="Formation">Formation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="image_upload">Image de l'article</Label>
            <div className="flex items-center gap-3">
              <Input id="image_upload" type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} ref={imageInputRef} className="hidden" />
              <Button type="button" variant="outline" onClick={() => imageInputRef.current?.click()} disabled={uploading}>{uploading ? 'Upload...' : 'Remplacer l\'image'}</Button>
            </div>
            {uploading && <div className="text-xs text-muted-foreground">Upload en cours...</div>}
            {previewUrl && (<div className="mt-2"><img src={previewUrl} alt="Aperçu" className="w-32 h-32 object-cover rounded border" /></div>)}
          </div>
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Switch id="is_published" checked={formData.is_published} onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })} />
              <Label htmlFor="is_published">Publié</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="is_featured" checked={formData.is_featured} onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })} />
              <Label htmlFor="is_featured">Mis en avant</Label>
            </div>
          </div>
          <div className="flex justify-end space-x-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit">{news ? 'Modifier' : 'Créer'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}