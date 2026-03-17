import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/integrations/api/client';
import { Loader2, Save, Globe, Phone, Mail, MapPin, Facebook, Instagram, Linkedin, Youtube, Music2, Send, X, Clock } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

type ContactSettings = {
  id?: number;
  whatsappNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  country?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  youtubeUrl?: string | null;
  linkedinUrl?: string | null;
  xUrl?: string | null;
  websiteUrl?: string | null;
  telegramUrl?: string | null;
  supportEmail?: string | null;
  businessHours?: string | null;
  mapUrl?: string | null;
};

const Field = ({ label, value, onChange, type = 'text' as const, placeholder, icon: Icon }: { label: string; value?: string | null; onChange: (v: string) => void; type?: 'text' | 'email' | 'url'; placeholder?: string; icon?: React.ElementType; }) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium flex items-center gap-2">
      {Icon && <Icon className="w-4 h-4 text-primary" />}
      {label}
    </Label>
    <Input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="h-10" />
  </div>
);

export function AdminContactSettings() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const { data: settings = {}, isLoading } = useQuery<ContactSettings>({
    queryKey: ['admin', 'contact-settings'],
    queryFn: async () => {
      const res = await api.request('GET', '/api/contact_settings');
      const list = Array.isArray(res) ? res : res.data;
      return (list && list[0]) || {};
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
  const [localSettings, setLocalSettings] = useState<ContactSettings>({});

  const hasRecord = useMemo(() => Boolean(localSettings && localSettings.id), [localSettings]);


  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleChange = (key: keyof ContactSettings, value: string | null) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveMutation = useMutation({
    mutationFn: async (payload: ContactSettings) => {
      const cleanPayload = { ...payload } as Record<string, unknown>;

      delete cleanPayload.id;
      delete cleanPayload.createdAt;
      delete cleanPayload.updatedAt;
      delete cleanPayload.created_at;
      delete cleanPayload.updated_at;

      (Object.keys(cleanPayload) as Array<keyof ContactSettings>).forEach((key) => {
        const val = cleanPayload[key];
        if (typeof val === 'string' && val.trim() === '') {
          (cleanPayload as Record<string, unknown>)[key] = null;
        }
      });
      if (hasRecord && localSettings.id) {
        return api.request('PUT', `/api/contact_settings/${localSettings.id}`, { body: cleanPayload });
      }
      return api.request('POST', `/api/contact_settings`, { body: cleanPayload });
    },
    onSuccess: async () => {
      toast({ title: 'Enregistré', description: 'Paramètres de contact mis à jour' });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'contact-settings'] });
      setSaving(false);
    },
    onError: (e: unknown) => {
      console.error(e);
      toast({ title: 'Erreur', description: "Échec de l'enregistrement", variant: 'destructive' });
      setSaving(false);
    }
  });
  const save = async () => { setSaving(true); saveMutation.mutate(localSettings); };

  const quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['clean']
    ],
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Contacts & Réseaux</h2>
          <p className="text-muted-foreground">Gérez les informations de contact et les liens vers vos réseaux sociaux.</p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Enregistrer les modifications
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informations de base */}
        <Card className="bg-card/70 backdrop-blur border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              Informations de contact
            </CardTitle>
            <CardDescription>Coordonnées principales de l'entreprise.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Téléphone" value={localSettings.phone} onChange={(v) => handleChange('phone', v)} placeholder="+237 6XX XX XX XX" icon={Phone} />
            <Field label="WhatsApp" value={localSettings.whatsappNumber} onChange={(v) => handleChange('whatsappNumber', v)} placeholder="+237 6XX XX XX XX" icon={Phone} />
            <Field label="Email" type="email" value={localSettings.email} onChange={(v) => handleChange('email', v)} placeholder="contact@bia.cm" icon={Mail} />
            <Field label="Site Web" type="url" value={localSettings.websiteUrl} onChange={(v) => handleChange('websiteUrl', v)} placeholder="https://www.bia.cm" icon={Globe} />
          </CardContent>
        </Card>

        {/* Localisation */}
        <Card className="bg-card/70 backdrop-blur border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Adresse & Localisation
            </CardTitle>
            <CardDescription>Où vous trouver physiquement.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Adresse (ligne 1)" value={localSettings.addressLine1} onChange={(v) => handleChange('addressLine1', v)} placeholder="Rue, Quartier..." icon={MapPin} />
            <Field label="Adresse (ligne 2)" value={localSettings.addressLine2} onChange={(v) => handleChange('addressLine2', v)} placeholder="Bâtiment, Étage..." icon={MapPin} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Ville" value={localSettings.city} onChange={(v) => handleChange('city', v)} placeholder="Ville" />
              <Field label="Pays" value={localSettings.country} onChange={(v) => handleChange('country', v)} placeholder="Pays" />
            </div>
            <Field label="URL Google Maps" value={localSettings.mapUrl} onChange={(v) => handleChange('mapUrl', v)} placeholder="Lien vers votre position..." icon={MapPin} />
          </CardContent>
        </Card>

        {/* Horaires avec Rich Text */}
        <Card className="md:col-span-2 bg-card/70 backdrop-blur border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Horaires d'ouverture
            </CardTitle>
            <CardDescription>Précisez vos jours et heures de disponibilité.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="min-h-[200px] flex flex-col">
              <ReactQuill 
                theme="snow"
                value={localSettings.businessHours || ''}
                onChange={(content) => handleChange('businessHours', content)}
                modules={quillModules}
                className="h-[120px] mb-12 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Réseaux Sociaux */}
        <Card className="md:col-span-2 bg-card/70 backdrop-blur border-slate-800">
          <CardHeader>
            <CardTitle>Réseaux Sociaux</CardTitle>
            <CardDescription>Liens vers vos profils officiels.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Facebook" type="url" value={localSettings.facebookUrl} onChange={(v) => handleChange('facebookUrl', v)} placeholder="URL Facebook" icon={Facebook} />
              <Field label="Instagram" type="url" value={localSettings.instagramUrl} onChange={(v) => handleChange('instagramUrl', v)} placeholder="URL Instagram" icon={Instagram} />
              <Field label="LinkedIn" type="url" value={localSettings.linkedinUrl} onChange={(v) => handleChange('linkedinUrl', v)} placeholder="URL LinkedIn" icon={Linkedin} />
              <Field label="YouTube" type="url" value={localSettings.youtubeUrl} onChange={(v) => handleChange('youtubeUrl', v)} placeholder="URL YouTube" icon={Youtube} />
              <Field label="TikTok" type="url" value={localSettings.tiktokUrl} onChange={(v) => handleChange('tiktokUrl', v)} placeholder="URL TikTok" icon={Music2} />
              <Field label="Telegram" type="url" value={localSettings.telegramUrl} onChange={(v) => handleChange('telegramUrl', v)} placeholder="URL Telegram" icon={Send} />
              <Field label="X (Twitter)" type="url" value={localSettings.xUrl} onChange={(v) => handleChange('xUrl', v)} placeholder="URL X" icon={X} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


