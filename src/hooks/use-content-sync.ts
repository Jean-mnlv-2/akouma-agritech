import { useEffect, useCallback, useRef } from 'react';
import { api } from '@/integrations/api/client';

interface ContentSyncOptions {
  contentType: 'news' | 'shop_products' | 'courses' | 'seeds';
  onUpdate?: (data: unknown[]) => void;
  enabled?: boolean;
}

export function useContentSync({ contentType, onUpdate, enabled = true }: ContentSyncOptions) {
  const onUpdateRef = useRef<((data: unknown[]) => void) | undefined>(onUpdate);
  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);
  const lastHashRef = useRef<string>('');

  const publishedColumn = (type: string) => {
    // Adapter le filtre publié/actif selon la table
    if (type === 'shop_products' || type === 'seeds') return { col: 'is_active', value: true };
    return { col: 'is_published', value: true };
  };

  const fetchContent = useCallback(async () => {
    if (!enabled) return;

    try {
      const pub = publishedColumn(contentType);
      const { data, error } = await api
        .from(contentType)
        .eq(pub.col, pub.value as any)
        .select();

      if (error) {
        console.error(`Error fetching ${contentType}:`, error);
        onUpdateRef.current?.([]);
        return;
      }

      const list = Array.isArray(data) ? data : [];
      const sorted = list.sort((a: any, b: any) => {
        const da = a?.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b?.created_at ? new Date(b.created_at).getTime() : 0;
        return db - da;
      });

      // Dédup: n'émettre que si le contenu change réellement
      const hash = JSON.stringify(sorted?.map((x: any) => [x.id, x.updated_at || x.created_at]));
      if (hash !== lastHashRef.current) {
        lastHashRef.current = hash;
        onUpdateRef.current?.(sorted);
      }
    } catch (error) {
      console.error(`Error fetching ${contentType}:`, error);
      onUpdateRef.current?.([]);
    }
  }, [contentType, enabled]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Plus de realtime: re-fetch périodique léger (facultatif) ou manuel via fetchContent
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      fetchContent();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchContent, enabled]);

  return { fetchContent };
}
