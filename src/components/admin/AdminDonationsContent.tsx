import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import ReactQuill from 'react-quill';
import 'quill/dist/quill.snow.css';
import { FileUpload } from './FileUpload';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/integrations/api/client';
import { slugify } from '@/lib/utils';

type DonationImpact = {
  id: number;
  title: string;
  slug: string;
  description: string;
  icon?: string;
  progress?: number;
  target?: string;
  order?: number;
  isActive?: boolean;
};

type SuccessStory = {
  id: number;
  title: string;
  slug: string;
  description: string;
  impact: string;
  year?: string;
  imageUrl?: string;
  order?: number;
  isActive?: boolean;
};

export function AdminDonationsContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: impacts = [] } = useQuery<DonationImpact[]>({
    queryKey: ['admin', 'donation-impacts'],
    queryFn: async () => {
      const res = await api.request('GET', '/api/donation_impacts');
      const items = Array.isArray(res) ? res : res.data;
      return (items || []).sort((a: DonationImpact, b: DonationImpact) => (a.order ?? 0) - (b.order ?? 0));
    },
    staleTime: 30000, refetchOnWindowFocus: false,
  });
  const { data: stories = [] } = useQuery<SuccessStory[]>({
    queryKey: ['admin', 'success-stories'],
    queryFn: async () => {
      const res = await api.request('GET', '/api/success_stories');
      const items = Array.isArray(res) ? res : res.data;
      return (items || []).sort((a: SuccessStory, b: SuccessStory) => (a.order ?? 0) - (b.order ?? 0));
    },
    staleTime: 30000, refetchOnWindowFocus: false,
  });
  const [impactForm, setImpactForm] = useState<Partial<DonationImpact>>({ isActive: true, order: 0, progress: 0 });
  const [impactEditing, setImpactEditing] = useState<DonationImpact | null>(null);
  const [storyForm, setStoryForm] = useState<Partial<SuccessStory>>({ isActive: true, order: 0 });
  const [storyEditing, setStoryEditing] = useState<SuccessStory | null>(null);

  useEffect(() => { /* React Query charge les données */ }, []);

  const saveImpactMutation = useMutation({
    mutationFn: async (payload: Partial<DonationImpact>) => {
      if (impactEditing) return api.request('PUT', `/api/donation_impacts/${impactEditing.id}`, { body: payload });
      return api.request('POST', `/api/donation_impacts`, { body: payload });
    },
    onSuccess: async () => {
      setImpactEditing(null); setImpactForm({ isActive: true, order: 0, progress: 0 });
      toast({ title: 'Succès', description: 'Impact enregistré.' });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'donation-impacts'] });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Enregistrement échoué', variant: 'destructive' });
    }
  });
  const saveImpact = async () => {
    const payload: Partial<DonationImpact> = {
      title: impactForm.title?.trim(),
      slug: impactForm.slug || slugify(impactForm.title || ''),
      description: impactForm.description || '',
      icon: impactForm.icon || undefined,
      progress: Number(impactForm.progress ?? 0),
      target: impactForm.target || undefined,
      order: Number(impactForm.order ?? 0),
      isActive: Boolean(impactForm.isActive),
    };
    if (!payload.title) { toast({ title: 'Validation', description: 'Titre requis', variant: 'destructive' }); return; }
    if (!payload.slug) { toast({ title: 'Validation', description: 'Slug requis', variant: 'destructive' }); return; }
    saveImpactMutation.mutate(payload);
  };

  const deleteImpactMutation = useMutation({
    mutationFn: async (id: number) => api.request('DELETE', `/api/donation_impacts/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'donation-impacts'] });
    }
  });
  const deleteImpact = async (row: DonationImpact) => {
    if (!confirm(`Supprimer l'impact "${row.title}" ?`)) return;
    deleteImpactMutation.mutate(row.id);
  };

  const saveStoryMutation = useMutation({
    mutationFn: async (payload: Partial<SuccessStory>) => {
      if (storyEditing) return api.request('PUT', `/api/success_stories/${storyEditing.id}`, { body: payload });
      return api.request('POST', `/api/success_stories`, { body: payload });
    },
    onSuccess: async () => {
      setStoryEditing(null); setStoryForm({ isActive: true, order: 0 });
      toast({ title: 'Succès', description: 'Histoire enregistrée.' });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'success-stories'] });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Enregistrement échoué', variant: 'destructive' });
    }
  });
  const saveStory = async () => {
    const payload: Partial<SuccessStory> = {
      title: storyForm.title?.trim(),
      slug: storyForm.slug || slugify(storyForm.title || ''),
      description: storyForm.description || '',
      impact: storyForm.impact || '',
      year: storyForm.year || undefined,
      imageUrl: storyForm.imageUrl || undefined,
      order: Number(storyForm.order ?? 0),
      isActive: Boolean(storyForm.isActive),
    };
    if (!payload.title) { toast({ title: 'Validation', description: 'Titre requis', variant: 'destructive' }); return; }
    if (!payload.slug) { toast({ title: 'Validation', description: 'Slug requis', variant: 'destructive' }); return; }
    saveStoryMutation.mutate(payload);
  };

  const deleteStoryMutation = useMutation({
    mutationFn: async (id: number) => api.request('DELETE', `/api/success_stories/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'success-stories'] });
    }
  });
  const deleteStory = async (row: SuccessStory) => {
    if (!confirm(`Supprimer l'histoire "${row.title}" ?`)) return;
    deleteStoryMutation.mutate(row.id);
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Votre Don en Action</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Titre *</Label>
              <Input 
                value={impactForm.title || ''} 
                onChange={(e) => {
                  const newTitle = e.target.value;
                  const newSlug = slugify(newTitle);
                  if (!impactForm.slug || impactForm.slug === slugify(impactForm.title || '')) {
                    setImpactForm({ ...impactForm, title: newTitle, slug: newSlug });
                  } else {
                    setImpactForm({ ...impactForm, title: newTitle });
                  }
                }} 
              />
            </div>
            <div className="space-y-2">
              <Label>Slug (URL)</Label>
              <Input value={impactForm.slug || ''} onChange={(e) => setImpactForm({ ...impactForm, slug: e.target.value })} placeholder="genere-automatiquement" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Icône (emoji)</Label>
              <Input value={impactForm.icon || ''} onChange={(e) => setImpactForm({ ...impactForm, icon: e.target.value })} placeholder="🌱" />
            </div>
          </div>
          <div className="space-y-2 min-h-[200px] flex flex-col">
            <Label>Description</Label>
            <div className="flex-1">
              <ReactQuill 
                theme="snow"
                value={impactForm.description || ''}
                onChange={(content) => setImpactForm({ ...impactForm, description: content })}
                modules={quillModules}
                className="h-[120px] mb-12"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
            <div>
              <Label>Progression (%)</Label>
              <Input type="number" value={impactForm.progress ?? 0} onChange={(e) => setImpactForm({ ...impactForm, progress: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Cible</Label>
              <Input value={impactForm.target || ''} onChange={(e) => setImpactForm({ ...impactForm, target: e.target.value })} placeholder="1000 agriculteurs formés" />
            </div>
            <div>
              <Label>Ordre</Label>
              <Input type="number" value={impactForm.order ?? 0} onChange={(e) => setImpactForm({ ...impactForm, order: Number(e.target.value) })} />
            </div>
          </div>
          <div className="flex items-center gap-4 pt-4">
            <div className="flex items-center gap-2">
              <Switch checked={!!impactForm.isActive} onCheckedChange={(v) => setImpactForm({ ...impactForm, isActive: v })} />
              <Label>Actif</Label>
            </div>
            <div className="ml-auto flex gap-2">
              <Button onClick={saveImpact}>{impactEditing ? 'Enregistrer' : 'Ajouter'}</Button>
              {impactEditing && <Button variant="outline" onClick={() => { setImpactEditing(null); setImpactForm({ isActive: true, order: 0, progress: 0 }); }}>Annuler</Button>}
            </div>
          </div>
          <div className="space-y-2 mt-6">
            {impacts.map((i) => (
              <div 
                key={i.id} 
                className="p-3 border rounded flex items-start justify-between gap-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => { setImpactEditing(i); setImpactForm(i); }}
              >
                <div>
                  <div className="font-medium">{i.icon || '🎯'} {i.title}</div>
                  <div className="text-xs text-muted-foreground">{i.target} • {i.progress}%</div>
                  {i.description && <div className="text-sm mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(i.description)}} />}
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setImpactEditing(i); 
                      setImpactForm(i);
                    }}
                  >
                    Modifier
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteImpact(i);
                    }}
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histoires de Succès</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Titre *</Label>
              <Input 
                value={storyForm.title || ''} 
                onChange={(e) => {
                  const newTitle = e.target.value;
                  const newSlug = slugify(newTitle);
                  if (!storyForm.slug || storyForm.slug === slugify(storyForm.title || '')) {
                      setStoryForm({ ...storyForm, title: newTitle, slug: newSlug });
                    } else {
                      setStoryForm({ ...storyForm, title: newTitle });
                    }
                }} 
              />
            </div>
            <div className="space-y-2">
              <Label>Slug (URL)</Label>
              <Input value={storyForm.slug || ''} onChange={(e) => setStoryForm({ ...storyForm, slug: e.target.value })} placeholder="genere-automatiquement" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Année</Label>
              <Input value={storyForm.year || ''} onChange={(e) => setStoryForm({ ...storyForm, year: e.target.value })} placeholder="2024" />
            </div>
            <div>
              <Label>Impact Rapide</Label>
              <Input value={storyForm.impact || ''} onChange={(e) => setStoryForm({ ...storyForm, impact: e.target.value })} placeholder="Augmentation de 40% des rendements" />
            </div>
          </div>
          <div className="space-y-2">
            <FileUpload label="Image de l'histoire" accept="image/*" value={storyForm.imageUrl || ''} onChange={(url) => setStoryForm({ ...storyForm, imageUrl: url })} />
          </div>
          <div className="space-y-2 min-h-[250px] flex flex-col">
            <Label>Contenu de l'histoire</Label>
            <div className="flex-1">
              <ReactQuill 
                theme="snow"
                value={storyForm.description || ''}
                onChange={(content) => setStoryForm({ ...storyForm, description: content })}
                modules={quillModules}
                className="h-[150px] mb-12"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
            <div>
              <Label>Ordre</Label>
              <Input type="number" value={storyForm.order ?? 0} onChange={(e) => setStoryForm({ ...storyForm, order: Number(e.target.value) })} />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <Switch checked={!!storyForm.isActive} onCheckedChange={(v) => setStoryForm({ ...storyForm, isActive: v })} />
              <Label>Actif</Label>
            </div>
            <div className="ml-auto flex gap-2 mt-6 justify-end">
              <Button onClick={saveStory}>{storyEditing ? 'Enregistrer' : 'Ajouter'}</Button>
              {storyEditing && <Button variant="outline" onClick={() => { setStoryEditing(null); setStoryForm({ isActive: true, order: 0 }); }}>Annuler</Button>}
            </div>
          </div>
          <div className="space-y-2 mt-6">
            {stories.map((s) => (
              <div 
                key={s.id} 
                className="p-3 border rounded flex items-start justify-between gap-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => { setStoryEditing(s); setStoryForm(s); }}
              >
                <div className="flex gap-3">
                  {s.imageUrl && (
                    <img src={s.imageUrl} alt={s.title} className="w-12 h-12 rounded object-cover flex-shrink-0" />
                  )}
                  <div>
                    <div className="font-medium">{s.title} {s.year ? `• ${s.year}` : ''}</div>
                    <div className="text-xs text-muted-foreground">{s.impact}</div>
                    {s.description && <div className="text-sm mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(s.description)}} />}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setStoryEditing(s); 
                      setStoryForm(s);
                    }}
                  >
                    Modifier
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteStory(s);
                    }}
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


