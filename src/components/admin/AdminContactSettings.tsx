import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/integrations/api/client';

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
};

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

  const handleChange = (key: keyof ContactSettings, value: string) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveMutation = useMutation({
    mutationFn: async (payload: ContactSettings) => {
      const cleanPayload = { ...payload };
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

  const Field = ({ label, value, onChange, type = 'text' as const, placeholder }: { label: string; value?: string | null; onChange: (v: string) => void; type?: 'text' | 'email' | 'url'; placeholder?: string; }) => (
    <div className="space-y-2">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      <Input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="h-10" />
    </div>
  );

  return (
    <Card className="bg-card/70 backdrop-blur">
      <CardHeader>
        <CardTitle>Contacts & Réseaux sociaux</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Téléphone" value={localSettings.phone ?? ''} onChange={(v) => handleChange('phone', v)} placeholder="Ex: +237 6XX XX XX XX" />
              <Field label="WhatsApp" value={localSettings.whatsappNumber ?? ''} onChange={(v) => handleChange('whatsappNumber', v)} placeholder="Ex: +237 6XX XX XX XX" />
              <Field label="Email" type="email" value={localSettings.email ?? ''} onChange={(v) => handleChange('email', v)} placeholder="Ex: contact@akouma.cm" />
              <Field label="Site Web" type="url" value={localSettings.websiteUrl ?? ''} onChange={(v) => handleChange('websiteUrl', v)} placeholder="https://www.akouma.cm" />
              <Field label="Adresse (ligne 1)" value={localSettings.addressLine1 ?? ''} onChange={(v) => handleChange('addressLine1', v)} />
              <Field label="Adresse (ligne 2)" value={localSettings.addressLine2 ?? ''} onChange={(v) => handleChange('addressLine2', v)} />
              <Field label="Ville" value={localSettings.city ?? ''} onChange={(v) => handleChange('city', v)} />
              <Field label="Pays" value={localSettings.country ?? ''} onChange={(v) => handleChange('country', v)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Facebook" type="url" value={localSettings.facebookUrl ?? ''} onChange={(v) => handleChange('facebookUrl', v)} placeholder="https://facebook.com/..." />
              <Field label="Instagram" type="url" value={localSettings.instagramUrl ?? ''} onChange={(v) => handleChange('instagramUrl', v)} placeholder="https://instagram.com/..." />
              <Field label="TikTok" type="url" value={localSettings.tiktokUrl ?? ''} onChange={(v) => handleChange('tiktokUrl', v)} placeholder="https://tiktok.com/@..." />
              <Field label="YouTube" type="url" value={localSettings.youtubeUrl ?? ''} onChange={(v) => handleChange('youtubeUrl', v)} placeholder="https://youtube.com/@..." />
              <Field label="LinkedIn" type="url" value={localSettings.linkedinUrl ?? ''} onChange={(v) => handleChange('linkedinUrl', v)} placeholder="https://linkedin.com/company/..." />
              <Field label="X (Twitter)" type="url" value={localSettings.xUrl ?? ''} onChange={(v) => handleChange('xUrl', v)} placeholder="https://x.com/..." />
              <Field label="Telegram" type="url" value={localSettings.telegramUrl ?? ''} onChange={(v) => handleChange('telegramUrl', v)} placeholder="https://t.me/..." />
            </div>

            <div className="pt-2">
              <Button onClick={save} disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}


