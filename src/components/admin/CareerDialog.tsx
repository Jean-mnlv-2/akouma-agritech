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
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface Career {
  id: number;
  title: string;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {career ? 'Modifier l\'offre d\'emploi' : 'Nouvelle offre d\'emploi'}
          </DialogTitle>
          <DialogDescription>
            {career ? 'Modifiez les informations de l\'offre d\'emploi' : 'Créez une nouvelle offre d\'emploi'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre du poste *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Développeur Full Stack"
              />
            </div>

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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Département</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Technologie, Marketing, RH..."
              />
            </div>

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

          <div className="space-y-2">
            <Label htmlFor="description">Description du poste *</Label>
            <ReactQuill
              id="description"
              theme="snow"
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              className="bg-white rounded"
              style={{ minHeight: 150 }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">Exigences et compétences</Label>
            <ReactQuill
              id="requirements"
              theme="snow"
              value={formData.requirements}
              onChange={(value) => setFormData({ ...formData, requirements: value })}
              className="bg-white rounded"
              style={{ minHeight: 120 }}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isPublished"
              checked={formData.isPublished}
              onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
            />
            <Label htmlFor="isPublished">Publier l'offre d'emploi</Label>
          </div>

          <DialogFooter>
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
