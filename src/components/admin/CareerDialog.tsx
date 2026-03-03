import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { slugify } from '@/lib/utils';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface Career {
  id: number;
  title: string;
  slug: string;
  description: string;
  requirements?: string;
  location: string;
  employmentType: string;
  department?: string;
  salaryRange?: string;
  isPublished: boolean;
  applicationDeadline?: string;
  createdAt: string;
  updatedAt: string;
}

interface CareerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  career?: Career | null;
  onSave: (careerData: Omit<Career, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const CareerDialog = ({ open, onOpenChange, career, onSave }: CareerDialogProps) => {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    requirements: '',
    location: '',
    employmentType: 'full-time',
    department: '',
    salaryRange: '',
    isPublished: false,
    applicationDeadline: null as Date | null
  });

  useEffect(() => {
    if (career) {
      setFormData({
        title: career.title,
        slug: career.slug || slugify(career.title),
        description: career.description,
        requirements: career.requirements || '',
        location: career.location,
        employmentType: career.employmentType,
        department: career.department || '',
        salaryRange: career.salaryRange || '',
        isPublished: career.isPublished,
        applicationDeadline: career.applicationDeadline ? new Date(career.applicationDeadline) : null
      });
    } else {
      setFormData({
        title: '',
        slug: '',
        description: '',
        requirements: '',
        location: '',
        employmentType: 'full-time',
        department: '',
        salaryRange: '',
        isPublished: false,
        applicationDeadline: null
      });
    }
  }, [career, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const careerData = {
      title: formData.title,
      slug: formData.slug || slugify(formData.title),
      description: formData.description,
      requirements: formData.requirements || undefined,
      location: formData.location,
      employmentType: formData.employmentType,
      department: formData.department || undefined,
      salaryRange: formData.salaryRange || undefined,
      isPublished: formData.isPublished,
      applicationDeadline: formData.applicationDeadline ? formData.applicationDeadline.toISOString() : undefined
    };

    onSave(careerData);
  };

  const employmentTypes = [
    { value: 'full-time', label: 'Temps plein' },
    { value: 'part-time', label: 'Temps partiel' },
    { value: 'contract', label: 'Contrat' },
    { value: 'internship', label: 'Stage' },
    { value: 'freelance', label: 'Freelance' }
  ];

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
            {career ? "Modifier l'offre" : "Nouvelle offre d'emploi"}
          </DialogTitle>
          <DialogDescription>
            Publiez une opportunité de carrière chez AKOUMA.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre du poste *</Label>
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
                placeholder="Développeur Full Stack"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="genere-automatiquement"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Lieu de travail *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
                placeholder="Ouagadougou, Burkina Faso"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Département</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Technologie, Marketing, RH..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employmentType">Type d'emploi</Label>
              <Select value={formData.employmentType} onValueChange={(value) => setFormData({ ...formData, employmentType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {employmentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salaryRange">Fourchette salariale</Label>
              <Input
                id="salaryRange"
                value={formData.salaryRange}
                onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })}
                placeholder="300 000 - 500 000 FCFA"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Date limite de candidature</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.applicationDeadline ? format(formData.applicationDeadline, 'PPP', { locale: fr }) : "Sélectionner une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.applicationDeadline ?? undefined}
                  onSelect={(date) => setFormData({ ...formData, applicationDeadline: date ?? null })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2 min-h-[250px] flex flex-col">
            <Label>Description du poste *</Label>
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

          <div className="space-y-2 min-h-[250px] flex flex-col">
            <Label>Exigences et compétences</Label>
            <div className="flex-1">
              <ReactQuill 
                theme="snow"
                value={formData.requirements}
                onChange={(content) => setFormData({ ...formData, requirements: content })}
                modules={quillModules}
                className="h-[150px] mb-12"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 py-4">
            <Switch
              id="isPublished"
              checked={formData.isPublished}
              onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
            />
            <Label htmlFor="isPublished">Publier l'offre d'emploi</Label>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">
              {career ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
