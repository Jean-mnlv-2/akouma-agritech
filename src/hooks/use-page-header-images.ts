import { useQuery } from '@tanstack/react-query';
import { api } from '@/integrations/api/client';

export interface PageHeaderImage {
  id: number;
  pageKey: string;
  imageUrl: string;
  altText?: string | null;
  title?: string | null;
  subtitle?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  order: number;
  isActive: boolean;
}

/**
 * Fetches active header images for a given page key.
 * Falls back gracefully (empty array) if the API is unavailable.
 */
export function usePageHeaderImages(pageKey: string) {
  return useQuery<PageHeaderImage[]>({
    queryKey: ['page-header-images', pageKey],
    queryFn: async () => {
      try {
        const res = await api.request('GET', '/api/page_header_images', { params: { pageKey } });
        return Array.isArray(res?.data) ? res.data : [];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}