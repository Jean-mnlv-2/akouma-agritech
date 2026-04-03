import { useEffect, useState } from 'react';

export type ContactSettings = {
  id?: number;
  companyName?: string | null;
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

export function useContactSettings() {
  const [data, setData] = useState<ContactSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string) || window.location.origin;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const url = new URL('/api/contact_settings', apiBaseUrl);
        const res = await fetch(url.toString(), { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load contact settings');
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          throw new Error('Réponse invalide du serveur pour les paramètres de contact');
        }
        const body = await res.json();
        const list = Array.isArray(body) ? body : body.data;
        const first = (list && list[0]) || null;
        if (!cancelled) setData(first);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}


