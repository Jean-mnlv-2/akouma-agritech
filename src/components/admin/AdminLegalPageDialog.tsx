import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { slugify } from '@/lib/utils';
import ReactQuill from 'react-quill';
import 'quill/dist/quill.snow.css';

interface LegalPage {
  id: string;
  title: string;
  type?: string;
  version?: string;
  effectiveDate?: string;
  slug?: string;
  content?: string;
}

interface AdminLegalPageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<LegalPage>) => void;
  page?: LegalPage | null;
}

export function AdminLegalPageDialog({ open, onOpenChange, page, onSave }: AdminLegalPageDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    slug: '',
    type: 'legal',
    version: '1.0',
    effectiveDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (page) {
      setFormData({
        title: page.title || '',
        content: page.content || '',
        slug: page.slug || '',
        type: page.type || 'legal',
        version: page.version || '1.0',
        effectiveDate: page.effectiveDate ? new Date(page.effectiveDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
    } else {
      setFormData({
        title: '', content: '', slug: '', type: 'legal', version: '1.0',
        effectiveDate: new Date().toISOString().split('T')[0]
      });
    }
  }, [page, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type de page</Label>
              <select 
                id="type"
                className="w-full flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.type} 
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="legal">Mentions Légales</option>
                <option value="privacy">Confidentialité</option>
                <option value="terms">Conditions d'utilisation</option>
                <option value="cookies">Politique de Cookies</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input id="version" value={formData.version} onChange={(e) => setFormData({ ...formData, version: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="effectiveDate">Date d'effet</Label>
              <Input id="effectiveDate" type="date" value={formData.effectiveDate} onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })} />
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