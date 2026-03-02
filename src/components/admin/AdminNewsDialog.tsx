import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Textarea unused - rich editor used instead
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Uploads handled by backend API
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useRef } from 'react';

interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  author_name: string;
  category: string;
  is_published: boolean;
  is_featured: boolean;
  created_at: string;
  views_count: number;
  image_url?: string;
}

interface AdminNewsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  news: NewsArticle | null;
  onSave: (newsData: any) => void;
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
        content: (news as any).content || '',
        author_name: news.author_name || '',
        author_bio: '',
        category: news.category || '',
        image_url: news.image_url || '',
        is_published: news.is_published || false,
        is_featured: news.is_featured || false,
        slug: news.title?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || ''
      });
      setPreviewUrl(news.image_url || null);
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
    } catch (_err) {
      alert('Erreur lors de l\'upload de l\'image');
    }
    setUploading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {news ? "Modifier l'actualité" : "Ajouter une actualité"}
          </DialogTitle>
          <DialogDescription>
            Publiez ou modifiez un article d'actualité pour la plateforme.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input id="slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="genere-automatiquement" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="excerpt">Extrait</Label>
            <ReactQuill id="excerpt" theme="snow" value={formData.excerpt} onChange={(value) => setFormData({ ...formData, excerpt: value })} className="bg-white rounded" style={{ minHeight: 80, marginBottom: 16 }} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Contenu de l'article *</Label>
            <ReactQuill id="content" theme="snow" value={formData.content} onChange={(value) => setFormData({ ...formData, content: value })} className="bg-white rounded" style={{ minHeight: 180 }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit">{news ? 'Modifier' : 'Créer'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}