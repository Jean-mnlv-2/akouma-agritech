import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { slugify } from '@/lib/utils';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { FileUpload } from './FileUpload';

interface Event {
  id: number;
  title: string;
  slug: string;
  description?: string;
  date: string;
  location: string;
  imageUrl?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: Event | null;
  onSave: (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const EventDialog = ({ open, onOpenChange, event, onSave }: EventDialogProps) => {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    date: new Date(),
    location: '',
    imageUrl: '',
    isPublished: false
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        slug: event.slug || slugify(event.title),
        description: event.description || '',
        date: new Date(event.date),
        location: event.location,
        imageUrl: event.imageUrl || '',
        isPublished: event.isPublished
      });
    } else {
      setFormData({
        title: '',
        slug: '',
        description: '',
        date: new Date(),
        location: '',
        imageUrl: '',
        isPublished: false
      });
    }
  }, [event, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const eventData = {
      title: formData.title,
      slug: formData.slug || slugify(formData.title),
      description: formData.description || undefined,
      date: formData.date.toISOString(),
      location: formData.location,
      imageUrl: formData.imageUrl || undefined,
      isPublished: formData.isPublished
    };

    onSave(eventData);
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
            {event ? 'Modifier l\'événement' : 'Nouvel événement'}
          </DialogTitle>
          <DialogDescription>
            {event ? 'Modifiez les informations de l\'événement' : 'Créez un nouvel événement'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2">
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
              <Label htmlFor="location">Lieu *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Date et heure *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.date, 'PPP HH:mm', { locale: fr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => date && setFormData({ ...formData, date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2 min-h-[300px] flex flex-col">
            <Label>Description</Label>
            <div className="flex-1">
              <ReactQuill 
                theme="snow"
                value={formData.description}
                onChange={(content) => setFormData({ ...formData, description: content })}
                modules={quillModules}
                className="h-[200px] mb-12"
              />
            </div>
          </div>

          <FileUpload
            label="Image de l'événement"
            accept="image/*"
            value={formData.imageUrl}
            onChange={(url) => setFormData({ ...formData, imageUrl: url })}
          />

          <div className="flex items-center space-x-2 py-4">
            <Switch
              id="isPublished"
              checked={formData.isPublished}
              onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
            />
            <Label htmlFor="isPublished">Publier l'événement</Label>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">
              {event ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
