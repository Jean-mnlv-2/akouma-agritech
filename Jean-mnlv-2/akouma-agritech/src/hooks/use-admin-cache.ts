import { useState, useEffect, useCallback } from 'react';
import { api } from '@/integrations/api/client';

interface CacheData {
  courses: unknown[];
  news: unknown[];
  seeds: unknown[];
  products: unknown[];
  legalPages: unknown[];
  submissions: unknown[];
  lastUpdated: Record<string, number>;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useAdminCache() {
  const [cache, setCache] = useState<CacheData>({
    courses: [],
    news: [],
    seeds: [],
    products: [],
    legalPages: [],
    submissions: [],
    lastUpdated: {},
  });

  const isCacheValid = useCallback((key: string) => {
    const lastUpdated = cache.lastUpdated[key];
    return lastUpdated && Date.now() - lastUpdated < CACHE_DURATION;
  }, [cache.lastUpdated]);

  const updateCache = useCallback((key: keyof Omit<CacheData, 'lastUpdated'>, data: unknown[]) => {
    setCache(prev => ({
      ...prev,
      [key]: data,
      lastUpdated: {
        ...prev.lastUpdated,
        [key]: Date.now(),
      },
    }));
  }, []);

  const invalidateCache = useCallback((key?: string) => {
    if (key) {
      setCache(prev => ({
        ...prev,
        lastUpdated: {
          ...prev.lastUpdated,
          [key]: 0,
        },
      }));
    } else {
      setCache(prev => ({
        ...prev,
        lastUpdated: {},
      }));
    }
  }, []);

  const fetchData = useCallback(async (contentType: string) => {
    try {
      const { data: session } = await api.auth.getSession();
      if (!session) return null;

      // Map content types to table names
      const tableMap: Record<string, string> = {
        courses: 'courses',
        news: 'news',
        seeds: 'seeds',
        products: 'shop_products',
        legalPages: 'legal_pages',
        submissions: 'form_submissions'
      };

      const tableName = tableMap[contentType];
      if (!tableName) {
        throw new Error(`Unknown content type: ${contentType}`);
      }

      const { data, error } = await api
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const result = data || [];
      updateCache(contentType as keyof Omit<CacheData, 'lastUpdated'>, result);
      return result;
    } catch (error) {
      console.error(`Error fetching ${contentType}:`, error);
      throw error;
    }
  }, [updateCache]);

  const getData = useCallback(async (contentType: string) => {
    if (isCacheValid(contentType)) {
      return cache[contentType as keyof Omit<CacheData, 'lastUpdated'>];
    }
    return await fetchData(contentType);
  }, [cache, isCacheValid, fetchData]);

  return {
    cache,
    getData,
    updateCache,
    invalidateCache,
    isCacheValid,
  };
}
