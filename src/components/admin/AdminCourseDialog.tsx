import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Course } from './AdminCourses';
import { slugify } from '@/lib/utils';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useRef } from 'react';
import { Plus, Trash, ListPlus, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '@/integrations/api/client';
import { useToast } from '@/hooks/use-toast';

interface Module {
  id: string;
  title: string;
  duration: string;
  lessons: string[];
}

interface AdminCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course | null;
  onSave: (courseData: Record<string, unknown>) => void;
}

export function AdminCourseDialog({ open, onOpenChange, course, onSave }: AdminCourseDialogProps) {
  const { toast } = useToast();
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
    is_copy_protected: false,
    languages_csv: 'Français',
    slug: '',
    benefits_csv: '',
    requirements_csv: '',
    modules: [] as Module[],
    sertifier_design_id: '',
    sertifier_detail_id: '',
    sertifier_email_template_id: '',
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [testingSertifier, setTestingSertifier] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(formData.thumbnail_url || null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(formData.video_url || null);
  const thumbInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const [newCategory, setNewCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([
    "Agriculture Durable",
    "Technologie Agricole",
    "Gestion des Cultures",
    "Élevage",
    "Marketing Agricole"
  ]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.request('GET', '/api/courses');
        const courses = res.data || [];
        const existingCats = Array.from(new Set(courses.map((c: { category?: string }) => c.category).filter(Boolean))) as string[];
        setCategories(prev => Array.from(new Set([...prev, ...existingCats])).sort());
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        description: course.description || '',
        content: course.content || '',
        excerpt: course.excerpt || '',
        instructor_name: course.instructorName || '',
        instructor_bio: course.instructorBio || '',
        category: course.category || '',
        level: course.level || '',
        price_fcfa: course.price || 0,
        duration_minutes: course.duration || 0,
        thumbnail_url: course.thumbnailUrl || '',
        video_url: course.videoUrl || '',
        course_materials_url: course.course_materials_url || '',
        is_published: course.isPublished || false,
        is_featured: course.isFeatured || false,
        is_preview_available: course.isPreviewAvailable ?? false,
        is_copy_protected: course.isCopyProtected ?? false,
        languages_csv: Array.isArray(course.languages) ? (course.languages?.join(', ') || '') : '',
        slug: course.slug || slugify(course.title || ''),
        benefits_csv: Array.isArray(course.benefits) ? course.benefits.join('\n') : '',
        requirements_csv: Array.isArray(course.requirements) ? course.requirements.join('\n') : '',
        modules: Array.isArray(course.modules) ? (course.modules as Module[]) : [],
        sertifier_design_id: course.sertifierDesignId || '',
        sertifier_detail_id: course.sertifierDetailId || '',
        sertifier_email_template_id: course.sertifierEmailTemplateId || '',
      });
      setPreviewImageUrl(course.thumbnailUrl || null);
      setPreviewVideoUrl(course.videoUrl || null);
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
        is_copy_protected: false,
        languages_csv: 'Français',
        slug: '',
        benefits_csv: '',
        requirements_csv: '',
        modules: [],
        sertifier_design_id: '',
        sertifier_detail_id: '',
        sertifier_email_template_id: '',
      });
      setPreviewImageUrl(null);
      setPreviewVideoUrl(null);
    }
  }, [course, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation de la durée
    const newCourseDuration = Number(formData.duration_minutes);
    if (newCourseDuration > 0 && Array.isArray(course?.modules)) {
      const parseDuration = (dur: string | null): number => {
        if (!dur) return 0;
        const match = dur.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      };
      
      const totalModulesDuration = (course.modules as Module[]).reduce((sum, m) => sum + parseDuration(m.duration), 0);
      if (totalModulesDuration > newCourseDuration) {
        alert(`La durée totale des modules (${totalModulesDuration} min) dépasse la nouvelle durée du cours (${newCourseDuration} min).`);
        return;
      }
    }

    // Sertifier IDs validation: all-or-nothing, must match format
    const sId = formData.sertifier_design_id.trim();
    const sDet = formData.sertifier_detail_id.trim();
    const sTpl = formData.sertifier_email_template_id.trim();
    const provided = [sId, sDet, sTpl].filter(Boolean);
    if (provided.length > 0 && provided.length < 3) {
      toast({
        title: 'Configuration Sertifier incomplète',
        description: 'Renseignez les trois identifiants (Design, Detail, Email Template) ou laissez-les tous vides.',
        variant: 'destructive',
      });
      return;
    }
    const sertifierIdRegex = /^[A-Za-z0-9_-]{8,64}$/;
    if (provided.length === 3 && !provided.every((v) => sertifierIdRegex.test(v))) {
      toast({
        title: 'IDs Sertifier invalides',
        description: 'Chaque identifiant doit contenir 8 à 64 caractères alphanumériques (lettres, chiffres, "-", "_").',
        variant: 'destructive',
      });
      return;
    }

    const slug = formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const languages = formData.languages_csv
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const benefits = formData.benefits_csv
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const requirements = formData.requirements_csv
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
      
    const payload = {
      title: formData.title,
      description: formData.description || null,
      content: formData.content || null,
      excerpt: formData.excerpt || null,
      instructorName: formData.instructor_name || null,
      instructorBio: formData.instructor_bio || null,
      category: formData.category || null,
      price: formData.price_fcfa || 0,
      duration: formData.duration_minutes || 0,
      level: formData.level || null,
      thumbnailUrl: formData.thumbnail_url || null,
      videoUrl: formData.video_url || null,
      course_materials_url: formData.course_materials_url || null,
      isPublished: formData.is_published || false,
      isFeatured: formData.is_featured || false,
      isPreviewAvailable: formData.is_preview_available || false,
      isCopyProtected: formData.is_copy_protected || false,
      languages,
      benefits,
      requirements,
      modules: formData.modules,
      slug,
      sertifierDesignId: formData.sertifier_design_id.trim() || null,
      sertifierDetailId: formData.sertifier_detail_id.trim() || null,
      sertifierEmailTemplateId: formData.sertifier_email_template_id.trim() || null,
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
      const data = await api.request('POST', '/api/upload', { body: fd });
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
      const data = await api.request('POST', '/api/upload', { body: fd });
      const url: string = data.url;
      setFormData({ ...formData, video_url: url });
      setPreviewVideoUrl(url);
    } catch (err) {
      console.error('Video upload error:', err);
      alert('Erreur lors de l\'upload de la vidéo');
    }
    setUploadingVideo(false);
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
            {course ? "Modifier le cours" : "Ajouter un nouveau cours"}
          </DialogTitle>
          <DialogDescription>
            Remplissez les informations ci-dessous pour {course ? "mettre à jour" : "créer"} un cours.
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
          <div className="space-y-2 min-h-[200px] flex flex-col">
            <Label>Description *</Label>
            <div className="flex-1">
              <ReactQuill 
                theme="snow"
                value={formData.description}
                onChange={(content) => setFormData({ ...formData, description: content })}
                modules={quillModules}
                className="h-[120px] mb-12"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="excerpt">Extrait</Label>
            <Textarea 
              id="excerpt" 
              value={formData.excerpt} 
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })} 
              className="bg-white rounded" 
              placeholder="Court résumé du cours..."
            />
          </div>
          <div className="space-y-2 min-h-[300px] flex flex-col">
            <Label>Contenu du cours *</Label>
            <div className="flex-1">
              <ReactQuill 
                theme="snow"
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                modules={quillModules}
                className="h-[200px] mb-12"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="instructor_name">Nom de l'instructeur *</Label>
              <Input id="instructor_name" value={formData.instructor_name} onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructor_bio">Bio de l'instructeur</Label>
              <Textarea id="instructor_bio" value={formData.instructor_bio} onChange={(e) => setFormData({ ...formData, instructor_bio: e.target.value })} placeholder="Expert en agronomie..." />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie *</Label>
              <div className="flex gap-2">
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Sélectionner une catégorie" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" title="Ajouter une catégorie"><Plus className="w-4 h-4" /></Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Ajouter une nouvelle catégorie</DialogTitle>
                      <DialogDescription>Entrez le nom de la nouvelle catégorie à ajouter à la liste.</DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-2 pt-4">
                      <Input 
                        placeholder="Ex: Pisciculture" 
                        value={newCategory} 
                        onChange={(e) => setNewCategory(e.target.value)}
                      />
                      <Button onClick={() => {
                        if (newCategory.trim() && !categories.includes(newCategory.trim())) {
                          setCategories(prev => [...prev, newCategory.trim()].sort());
                          setFormData({ ...formData, category: newCategory.trim() });
                          setNewCategory('');
                          toast({ title: "Catégorie ajoutée", description: `La catégorie "${newCategory}" a été ajoutée.` });
                        }
                      }}>Ajouter</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="course_materials_url">URL des supports (PDF, docs)</Label>
              <Input id="course_materials_url" value={formData.course_materials_url} onChange={(e) => setFormData({ ...formData, course_materials_url: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="thumbnail_upload">Image du cours</Label>
              <div className="flex items-center gap-3">
                <Input id="thumbnail_upload" type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} ref={thumbInputRef} className="hidden" />
                <Button type="button" variant="outline" onClick={() => thumbInputRef.current?.click()} disabled={uploadingImage}>{uploadingImage ? 'Upload...' : 'Remplacer l\'image'}</Button>
              </div>
              {uploadingImage && <div className="text-xs text-muted-foreground">Upload en cours...</div>}
              {previewImageUrl && (<div className="mt-2"><img src={previewImageUrl} alt="Aperçu de la miniature du cours" className="w-32 h-32 object-cover rounded border" /></div>)}
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
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-bold">Modules et Leçons</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  const newModule: Module = {
                    id: Math.random().toString(36).substr(2, 9),
                    title: '',
                    duration: '',
                    lessons: ['']
                  };
                  setFormData({ ...formData, modules: [...formData.modules, newModule] });
                }}
              >
                <Plus className="w-4 h-4 mr-2" /> Ajouter un module
              </Button>
            </div>
            
            {formData.modules.map((module, mIdx) => (
              <div key={module.id} className="p-4 border-2 border-dashed rounded-xl space-y-4 relative bg-muted/30">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 text-destructive"
                  onClick={() => {
                    const newModules = formData.modules.filter((_, i) => i !== mIdx);
                    setFormData({ ...formData, modules: newModules });
                  }}
                >
                  <Trash className="w-4 h-4" />
                </Button>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Titre du module {mIdx + 1}</Label>
                    <Input 
                      value={module.title} 
                      onChange={(e) => {
                        const newModules = [...formData.modules];
                        newModules[mIdx].title = e.target.value;
                        setFormData({ ...formData, modules: newModules });
                      }}
                      placeholder="Ex: Introduction à l'agroécologie"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Durée du module</Label>
                    <Input 
                      value={module.duration} 
                      onChange={(e) => {
                        const newModules = [...formData.modules];
                        newModules[mIdx].duration = e.target.value;
                        setFormData({ ...formData, modules: newModules });
                      }}
                      placeholder="Ex: 45 min"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Leçons du module</Label>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        const newModules = [...formData.modules];
                        newModules[mIdx].lessons.push('');
                        setFormData({ ...formData, modules: newModules });
                      }}
                    >
                      <ListPlus className="w-3 h-3 mr-2" /> Ajouter une leçon
                    </Button>
                  </div>
                  {module.lessons.map((lesson, lIdx) => (
                    <div key={lIdx} className="flex items-center gap-2">
                      <Input 
                        value={lesson} 
                        onChange={(e) => {
                          const newModules = [...formData.modules];
                          newModules[mIdx].lessons[lIdx] = e.target.value;
                          setFormData({ ...formData, modules: newModules });
                        }}
                        placeholder={`Leçon ${lIdx + 1}`}
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          const newModules = [...formData.modules];
                          newModules[mIdx].lessons = newModules[mIdx].lessons.filter((_, i) => i !== lIdx);
                          setFormData({ ...formData, modules: newModules });
                        }}
                      >
                        <Trash className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="benefits_csv">Avantages (un par ligne)</Label>
              <Textarea 
                id="benefits_csv" 
                value={formData.benefits_csv} 
                onChange={(e) => setFormData({ ...formData, benefits_csv: e.target.value })} 
                placeholder="Maîtriser les techniques de semis&#10;Comprendre le cycle de l'eau..."
                className="h-32"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requirements_csv">Prérequis (un par ligne)</Label>
              <Textarea 
                id="requirements_csv" 
                value={formData.requirements_csv} 
                onChange={(e) => setFormData({ ...formData, requirements_csv: e.target.value })} 
                placeholder="Connaissances de base en sol&#10;Avoir accès à un jardin..."
                className="h-32"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 border-t pt-4">
            <div className="flex items-center space-x-2">
              <Switch id="is_published" checked={formData.is_published} onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })} />
              <Label htmlFor="is_published">Publié</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="is_featured" checked={formData.is_featured} onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })} />
              <Label htmlFor="is_featured">Vedette</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="is_preview_available" checked={formData.is_preview_available} onCheckedChange={(checked) => setFormData({ ...formData, is_preview_available: checked })} />
              <Label htmlFor="is_preview_available">Aperçu disponible</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="is_copy_protected" checked={formData.is_copy_protected} onCheckedChange={(checked) => setFormData({ ...formData, is_copy_protected: checked })} />
              <Label htmlFor="is_copy_protected">Protéger la copie</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="languages_csv">Langues (séparées par des virgules)</Label>
            <Input id="languages_csv" value={formData.languages_csv} onChange={(e) => setFormData({ ...formData, languages_csv: e.target.value })} placeholder="Français, Hausa, Swahili..." />
          </div>
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <Label className="text-base font-semibold">Certification Sertifier</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Configurez les identifiants Sertifier pour permettre l'émission de certificats authentifiés à la fin de ce cours.
              Récupérez les IDs depuis votre dashboard Sertifier (Designs, Details, Email Templates) ou via l'onglet Sertifier de l'administration.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sertifier_design_id">Design ID</Label>
                <Input
                  id="sertifier_design_id"
                  value={formData.sertifier_design_id}
                  onChange={(e) => setFormData({ ...formData, sertifier_design_id: e.target.value })}
                  placeholder="ex: 65f2..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sertifier_detail_id">Detail ID</Label>
                <Input
                  id="sertifier_detail_id"
                  value={formData.sertifier_detail_id}
                  onChange={(e) => setFormData({ ...formData, sertifier_detail_id: e.target.value })}
                  placeholder="ex: 65f3..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sertifier_email_template_id">Email Template ID</Label>
                <Input
                  id="sertifier_email_template_id"
                  value={formData.sertifier_email_template_id}
                  onChange={(e) => setFormData({ ...formData, sertifier_email_template_id: e.target.value })}
                  placeholder="ex: 65f4..."
                />
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={testingSertifier}
              onClick={async () => {
                setTestingSertifier(true);
                try {
                  await api.request('GET', '/api/sertifier/test');
                  toast({ title: 'Sertifier connecté', description: 'La connexion à l’API Sertifier fonctionne.' });
                } catch (err) {
                  toast({
                    title: 'Échec connexion Sertifier',
                    description: err instanceof Error ? err.message : 'Vérifiez la clé SERTIFIER_SECRET_KEY côté serveur.',
                    variant: 'destructive',
                  });
                } finally {
                  setTestingSertifier(false);
                }
              }}
            >
              {testingSertifier ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Test...</> : <><ShieldCheck className="w-4 h-4 mr-2" /> Tester la connexion Sertifier</>}
            </Button>
          </div>
          <div className="flex justify-end space-x-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit">{course ? 'Modifier' : 'Créer'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
