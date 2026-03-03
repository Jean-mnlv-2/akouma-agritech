import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { slugify } from '@/lib/utils';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface LegalPage {
  id: string;
  title: string;
  type: string;
  version: string;
  effective_date: string;
  created_at: string;
  content?: string;
  slug?: string;
}

interface AdminLegalPageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page: LegalPage | null;
  onSave: (pageData: Partial<LegalPage>) => void;
}

export function AdminLegalPageDialog({ open, onOpenChange, page, onSave }: AdminLegalPageDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    content: '',
    version: '1.0',
    effective_date: new Date().toISOString().split('T')[0],
    slug: ''
  });

  useEffect(() => {
    if (page) {
      setFormData({
        title: page.title || '',
        type: page.type || '',
        content: page.content || '',
        version: page.version || '1.0',
        effective_date: page.effective_date ? new Date(page.effective_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        slug: page.slug || slugify(page.title || '')
      });
    } else {
      setFormData({ title: '', type: '', content: '', version: '1.0', effective_date: new Date().toISOString().split('T')[0], slug: '' });
    }
  }, [page, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const payload = { 
      title: formData.title, 
      type: formData.type,
      content: formData.content, 
      version: formData.version,
      effective_date: formData.effective_date,
      slug 
    };
    onSave(payload);
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
            {page ? "Modifier la page" : "Ajouter une nouvelle page"}
          </DialogTitle>
          <DialogDescription>
            Éditez le contenu légal de la page {page?.title || ''}.
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="terms">Conditions Générales d'Utilisation</SelectItem>
                  <SelectItem value="privacy">Politique de Confidentialité</SelectItem>
                  <SelectItem value="cookies">Politique des Cookies</SelectItem>
                  <SelectItem value="legal">Mentions Légales</SelectItem>
                  <SelectItem value="refund">Politique de Remboursement</SelectItem>
                  <SelectItem value="shipping">Conditions de Livraison</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input id="version" value={formData.version} onChange={(e) => setFormData({ ...formData, version: e.target.value })} placeholder="ex: 1.0, 2.1" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="effective_date">Date d'effet</Label>
              <Input id="effective_date" type="date" value={formData.effective_date} onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2 min-h-[300px] flex flex-col">
            <Label>Contenu *</Label>
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

          <div className="flex justify-end space-x-2 pt-4 border-t mt-8">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit">{page ? 'Modifier' : 'Créer'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}