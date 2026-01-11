import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { FileUpload } from './FileUpload';

type DonationImpact = {
  id: number;
  title: string;
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
  description: string;
  impact: string;
  year?: string;
  imageUrl?: string;
  order?: number;
  isActive?: boolean;
};

export function AdminDonationsContent() {
  const { toast } = useToast();
  const [impacts, setImpacts] = useState<DonationImpact[]>([]);
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [impactForm, setImpactForm] = useState<Partial<DonationImpact>>({ isActive: true, order: 0, progress: 0 });
  const [impactEditing, setImpactEditing] = useState<DonationImpact | null>(null);
  const [storyForm, setStoryForm] = useState<Partial<SuccessStory>>({ isActive: true, order: 0 });
  const [storyEditing, setStoryEditing] = useState<SuccessStory | null>(null);

  const fetchAll = async () => {
    try {
      const [impRes, stoRes] = await Promise.all([
          fetch('/api/donation_impacts', { credentials: 'include' }),
          fetch('/api/success_stories', { credentials: 'include' }),
      ]);
      if (!impRes.ok || !stoRes.ok) throw new Error('Failed to load');
      const impBody = await impRes.json();
      const stoBody = await stoRes.json();
      const impItems = Array.isArray(impBody) ? impBody : impBody.data;
      const stoItems = Array.isArray(stoBody) ? stoBody : stoBody.data;
      setImpacts((impItems || []).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)));
      setStories((stoItems || []).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)));
    } catch (e) {
      console.error(e);
      toast({ title: 'Erreur', description: 'Chargement des contenus de dons échoué', variant: 'destructive' });
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const saveImpact = async () => {
    const payload: any = {
      title: impactForm.title?.trim(),
      description: impactForm.description || '',
      icon: impactForm.icon || null,
      progress: Number(impactForm.progress ?? 0),
      target: impactForm.target || null,
      order: Number(impactForm.order ?? 0),
      isActive: Boolean(impactForm.isActive),
    };
    if (!payload.title) { toast({ title: 'Validation', description: 'Titre requis', variant: 'destructive' }); return; }
    try {
      let res: Response;
      if (impactEditing) {
        res = await fetch(`/api/donation_impacts/${impactEditing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
      } else {
        res = await fetch('/api/donation_impacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
      }
      if (!res.ok) throw new Error(await res.text());
      setImpactEditing(null); setImpactForm({ isActive: true, order: 0, progress: 0 });
      await fetchAll();
      toast({ title: 'Succès', description: 'Impact enregistré.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Erreur', description: 'Enregistrement échoué', variant: 'destructive' });
    }
  };

  const deleteImpact = async (row: DonationImpact) => {
    if (!confirm(`Supprimer l'impact "${row.title}" ?`)) return;
    await fetch(`/api/donation_impacts/${row.id}`, { method: 'DELETE', credentials: 'include' });
    await fetchAll();
  };

  const saveStory = async () => {
    const payload: any = {
      title: storyForm.title?.trim(),
      description: storyForm.description || '',
      impact: storyForm.impact || '',
      year: storyForm.year || null,
      imageUrl: storyForm.imageUrl || null,
      order: Number(storyForm.order ?? 0),
      isActive: Boolean(storyForm.isActive),
    };
    if (!payload.title) { toast({ title: 'Validation', description: 'Titre requis', variant: 'destructive' }); return; }
    try {
      let res: Response;
      if (storyEditing) {
        res = await fetch(`/api/success_stories/${storyEditing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
      } else {
        res = await fetch('/api/success_stories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
      }
      if (!res.ok) throw new Error(await res.text());
      setStoryEditing(null); setStoryForm({ isActive: true, order: 0 });
      await fetchAll();
      toast({ title: 'Succès', description: 'Histoire enregistrée.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Erreur', description: 'Enregistrement échoué', variant: 'destructive' });
    }
  };

  const deleteStory = async (row: SuccessStory) => {
    if (!confirm(`Supprimer l'histoire "${row.title}" ?`)) return;
    await fetch(`/api/success_stories/${row.id}`, { method: 'DELETE', credentials: 'include' });
    await fetchAll();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Votre Don en Action</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Titre *</Label>
              <Input value={impactForm.title || ''} onChange={(e) => setImpactForm({ ...impactForm, title: e.target.value })} />
            </div>
            <div>
              <Label>Icône (emoji)</Label>
              <Input value={impactForm.icon || ''} onChange={(e) => setImpactForm({ ...impactForm, icon: e.target.value })} placeholder="🌱" />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <ReactQuill theme="snow" value={impactForm.description || ''} onChange={(value) => setImpactForm({ ...impactForm, description: value })} className="bg-white rounded" style={{ minHeight: 120 }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={!!impactForm.isActive} onCheckedChange={(v) => setImpactForm({ ...impactForm, isActive: v })} />
              <Label>Actif</Label>
            </div>
            <div className="ml-auto flex gap-2">
              <Button onClick={saveImpact}>{impactEditing ? 'Enregistrer' : 'Ajouter'}</Button>
              {impactEditing && <Button variant="outline" onClick={() => { setImpactEditing(null); setImpactForm({ isActive: true, order: 0, progress: 0 }); }}>Annuler</Button>}
            </div>
          </div>
          <div className="space-y-2">
            {impacts.map((i) => (
              <div key={i.id} className="p-3 border rounded flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{i.icon || '🎯'} {i.title}</div>
                  <div className="text-xs text-muted-foreground">{i.target} • {i.progress}%</div>
                  {i.description && <div className="text-sm mt-1">{i.description}</div>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setImpactEditing(i); setImpactForm(i); }}>Modifier</Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteImpact(i)}>Supprimer</Button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Titre *</Label>
              <Input value={storyForm.title || ''} onChange={(e) => setStoryForm({ ...storyForm, title: e.target.value })} />
            </div>
            <div>
              <Label>Année</Label>
              <Input value={storyForm.year || ''} onChange={(e) => setStoryForm({ ...storyForm, year: e.target.value })} placeholder="2024" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Impact</Label>
              <Input value={storyForm.impact || ''} onChange={(e) => setStoryForm({ ...storyForm, impact: e.target.value })} placeholder="Augmentation de 40% des rendements" />
            </div>
            <div>
              <FileUpload label="Image de l'histoire" accept="image/*" value={storyForm.imageUrl || ''} onChange={(url) => setStoryForm({ ...storyForm, imageUrl: url })} />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <ReactQuill theme="snow" value={storyForm.description || ''} onChange={(value) => setStoryForm({ ...storyForm, description: value })} className="bg-white rounded" style={{ minHeight: 120 }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
          <div className="space-y-2">
            {stories.map((s) => (
              <div key={s.id} className="p-3 border rounded flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{s.title} {s.year ? `• ${s.year}` : ''}</div>
                  <div className="text-xs text-muted-foreground">{s.impact}</div>
                  {s.description && <div className="text-sm mt-1">{s.description}</div>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setStoryEditing(s); setStoryForm(s); }}>Modifier</Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteStory(s)}>Supprimer</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


