import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Course } from './AdminCourses';
// import ReactQuill from 'react-quill';
// import 'react-quill/dist/quill.snow.css';
import { useRef } from 'react';

interface CourseData {
  title: string;
  description: string | null;
  content: string | null;
  price: number;
  duration: number;
  level: string | null;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  isPublished: boolean;
  isPreviewAvailable: boolean;
  languages: string[];
  slug: string;
}

interface AdminCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course | null;
  onSave: (courseData: CourseData) => void;
}

export function AdminCourseDialog({ open, onOpenChange, course, onSave }: AdminCourseDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    excerpt: '',
    instructor_name: '',
    instructor_bio: '',
    category: '',
    level: '',
    price_fcfa: 0,
    duration_minutes: 0,
    thumbnail_url: '',
    video_url: '',
    course_materials_url: '',
    is_published: false,
    is_featured: false,
    is_preview_available: false,
    languages_csv: 'Français',
    slug: ''
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(formData.thumbnail_url || null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(formData.video_url || null);
  const thumbInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        description: course.description || '',
        content: '',
        excerpt: '',
        instructor_name: course.instructor_name || '',
        instructor_bio: '',
        category: course.category || '',
        level: course.level || '',
        price_fcfa: course.price_fcfa || 0,
        duration_minutes: course.duration_minutes || 0,
        thumbnail_url: '',
        video_url: '',
        course_materials_url: '',
        is_published: course.is_published || false,
        is_featured: course.is_featured || false,
        is_preview_available: (course as Course & { isPreviewAvailable?: boolean }).isPreviewAvailable ?? false,
        languages_csv: Array.isArray((course as Course & { languages?: string[] }).languages) ? ((course as Course & { languages?: string[] }).languages?.join(', ') || '') : '',
        slug: course.title?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        content: '',
        excerpt: '',
        instructor_name: '',
        instructor_bio: '',
        category: '',
        level: '',
        price_fcfa: 0,
        duration_minutes: 0,
        thumbnail_url: '',
        video_url: '',
        course_materials_url: '',
        is_published: false,
        is_featured: false,
        is_preview_available: false,
        languages_csv: '',
        slug: ''
      });
    }
  }, [course, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const languages = formData.languages_csv
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const payload = {
      title: formData.title,
      description: formData.description || null,
      content: formData.content || null,
      price: formData.price_fcfa || 0,
      duration: formData.duration_minutes || 0,
      level: formData.level || null,
      thumbnailUrl: formData.thumbnail_url || null,
      videoUrl: formData.video_url || null,
      isPublished: formData.is_published || false,
      isPreviewAvailable: formData.is_preview_available || false,
      languages,
      slug,
    };
    onSave(payload);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', credentials: 'include', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const url: string = data.url;
      setFormData({ ...formData, thumbnail_url: url });
      setPreviewImageUrl(url);
    } catch (err) {
      console.error('Image upload error:', err);
      alert('Erreur lors de l\'upload de l\'image');
    }
    setUploadingImage(false);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', credentials: 'include', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const url: string = data.url;
      setFormData({ ...formData, video_url: url });
      setPreviewVideoUrl(url);
    } catch (err) {
      console.error('Video upload error:', err);
      alert('Erreur lors de l\'upload de la vidéo');
    }
    setUploadingVideo(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {course ? "Modifier le cours" : "Ajouter un nouveau cours"}
          </DialogTitle>
          <DialogDescription>
            Remplissez les informations ci-dessous pour {course ? "mettre à jour" : "créer"} un cours.
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
            <Label htmlFor="description">Description *</Label>
            <Textarea 
              id="description" 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              className="bg-white rounded" 
              style={{ minHeight: 100 }} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="excerpt">Extrait</Label>
            <Textarea 
              id="excerpt" 
              value={formData.excerpt} 
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })} 
              className="bg-white rounded" 
              style={{ minHeight: 80, marginBottom: 16 }} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Contenu du cours (HTML) *</Label>
            <Textarea 
              id="content" 
              value={formData.content} 
              onChange={(e) => setFormData({ ...formData, content: e.target.value })} 
              className="bg-white rounded" 
              style={{ minHeight: 150 }} 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instructor_name">Nom de l'instructeur *</Label>
              <Input id="instructor_name" value={formData.instructor_name} onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner une catégorie" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Agriculture Durable">Agriculture Durable</SelectItem>
                  <SelectItem value="Technologie Agricole">Technologie Agricole</SelectItem>
                  <SelectItem value="Gestion des Cultures">Gestion des Cultures</SelectItem>
                  <SelectItem value="Élevage">Élevage</SelectItem>
                  <SelectItem value="Marketing Agricole">Marketing Agricole</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="level">Niveau</Label>
              <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un niveau" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Débutant">Débutant</SelectItem>
                  <SelectItem value="Intermédiaire">Intermédiaire</SelectItem>
                  <SelectItem value="Avancé">Avancé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price_fcfa">Prix (FCFA)</Label>
              <Input id="price_fcfa" type="number" value={formData.price_fcfa} onChange={(e) => setFormData({ ...formData, price_fcfa: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Durée (minutes)</Label>
              <Input id="duration_minutes" type="number" value={formData.duration_minutes} onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="thumbnail_upload">Image du cours</Label>
              <div className="flex items-center gap-3">
                <Input id="thumbnail_upload" type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} ref={thumbInputRef} className="hidden" />
                <Button type="button" variant="outline" onClick={() => thumbInputRef.current?.click()} disabled={uploadingImage}>{uploadingImage ? 'Upload...' : 'Remplacer l\'image'}</Button>
              </div>
              {uploadingImage && <div className="text-xs text-muted-foreground">Upload en cours...</div>}
              {previewImageUrl && (<div className="mt-2"><img src={previewImageUrl} alt="Aperçu" className="w-32 h-32 object-cover rounded border" /></div>)}
            </div>
            <div className="space-y-2">
              <Label htmlFor="video_upload">Vidéo du cours</Label>
              <div className="flex items-center gap-3">
                <Input id="video_upload" type="file" accept="video/*" onChange={handleVideoUpload} disabled={uploadingVideo} ref={videoInputRef} className="hidden" />
                <Button type="button" variant="outline" onClick={() => videoInputRef.current?.click()} disabled={uploadingVideo}>{uploadingVideo ? 'Upload...' : 'Remplacer la vidéo'}</Button>
              </div>
              {uploadingVideo && <div className="text-xs text-muted-foreground">Upload en cours...</div>}
              {previewVideoUrl && (<div className="mt-2"><video src={previewVideoUrl} controls className="w-64 h-36 rounded border" /></div>)}
            </div>
          </div>
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2"><Switch id="is_published" checked={formData.is_published} onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })} /><Label htmlFor="is_published">Publié</Label></div>
            <div className="flex items-center space-x-2"><Switch id="is_featured" checked={formData.is_featured} onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })} /><Label htmlFor="is_featured">Mis en avant</Label></div>
            <div className="flex items-center space-x-2"><Switch id="is_preview_available" checked={formData.is_preview_available} onCheckedChange={(checked) => setFormData({ ...formData, is_preview_available: checked })} /><Label htmlFor="is_preview_available">Aperçu Gratuit</Label></div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="languages_csv">Langues (séparées par des virgules)</Label>
            <Input id="languages_csv" value={formData.languages_csv} onChange={(e) => setFormData({ ...formData, languages_csv: e.target.value })} placeholder="Français, Hausa, Swahili..." />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit">{course ? 'Modifier' : 'Créer'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
