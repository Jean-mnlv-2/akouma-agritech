import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ContactSettings>({});

  const hasRecord = useMemo(() => Boolean(settings && settings.id), [settings]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/contact_settings');
      if (!res.ok) throw new Error('Failed');
      const body = await res.json();
      const list = Array.isArray(body) ? body : body.data;
      const first = (list && list[0]) || {};
      setSettings(first || {});
    } catch (e) {
      console.error(e);
      toast({ title: 'Erreur', description: "Impossible de charger les paramètres de contact", variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSettings(); }, []);

  const handleChange = (key: keyof ContactSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload: ContactSettings = { ...settings };
      // Clean empty strings to nulls for consistency
      Object.keys(payload).forEach((k) => {
        const key = k as keyof ContactSettings;
        const val = payload[key];
        if (typeof val === 'string' && val.trim() === '') {
          (payload as any)[key] = null;
        }
      });

      let res: Response;
      if (hasRecord && settings.id) {
        res = await fetch(`/api/contact_settings/${settings.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/contact_settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) throw new Error(await res.text());
      await loadSettings();
      toast({ title: 'Enregistré', description: 'Paramètres de contact mis à jour' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Erreur', description: "Échec de l'enregistrement", variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

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
        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Téléphone" value={settings.phone ?? ''} onChange={(v) => handleChange('phone', v)} placeholder="Ex: +237 6XX XX XX XX" />
              <Field label="WhatsApp" value={settings.whatsappNumber ?? ''} onChange={(v) => handleChange('whatsappNumber', v)} placeholder="Ex: +237 6XX XX XX XX" />
              <Field label="Email" type="email" value={settings.email ?? ''} onChange={(v) => handleChange('email', v)} placeholder="Ex: contact@akouma.cm" />
              <Field label="Site Web" type="url" value={settings.websiteUrl ?? ''} onChange={(v) => handleChange('websiteUrl', v)} placeholder="https://www.akouma.cm" />
              <Field label="Adresse (ligne 1)" value={settings.addressLine1 ?? ''} onChange={(v) => handleChange('addressLine1', v)} />
              <Field label="Adresse (ligne 2)" value={settings.addressLine2 ?? ''} onChange={(v) => handleChange('addressLine2', v)} />
              <Field label="Ville" value={settings.city ?? ''} onChange={(v) => handleChange('city', v)} />
              <Field label="Pays" value={settings.country ?? ''} onChange={(v) => handleChange('country', v)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Facebook" type="url" value={settings.facebookUrl ?? ''} onChange={(v) => handleChange('facebookUrl', v)} placeholder="https://facebook.com/..." />
              <Field label="Instagram" type="url" value={settings.instagramUrl ?? ''} onChange={(v) => handleChange('instagramUrl', v)} placeholder="https://instagram.com/..." />
              <Field label="TikTok" type="url" value={settings.tiktokUrl ?? ''} onChange={(v) => handleChange('tiktokUrl', v)} placeholder="https://tiktok.com/@..." />
              <Field label="YouTube" type="url" value={settings.youtubeUrl ?? ''} onChange={(v) => handleChange('youtubeUrl', v)} placeholder="https://youtube.com/@..." />
              <Field label="LinkedIn" type="url" value={settings.linkedinUrl ?? ''} onChange={(v) => handleChange('linkedinUrl', v)} placeholder="https://linkedin.com/company/..." />
              <Field label="X (Twitter)" type="url" value={settings.xUrl ?? ''} onChange={(v) => handleChange('xUrl', v)} placeholder="https://x.com/..." />
              <Field label="Telegram" type="url" value={settings.telegramUrl ?? ''} onChange={(v) => handleChange('telegramUrl', v)} placeholder="https://t.me/..." />
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


