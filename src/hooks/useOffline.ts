import { useState, useEffect } from 'react';

interface OfflineContent {
  id: string;
  title: string;
  content: string;
  type: 'news' | 'course';
  downloadDate: string;
}

export const useOffline = () => {
  const [offlineContent, setOfflineContent] = useState<OfflineContent[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Load offline content from localStorage
    const stored = localStorage.getItem('bia-offline-content');
    if (stored) {
      setOfflineContent(JSON.parse(stored));
    }

    // Monitor online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const saveOfflineContent = (content: Omit<OfflineContent, 'downloadDate'>) => {
    const newContent: OfflineContent = {
      ...content,
      downloadDate: new Date().toISOString(),
    };

    const updated = [...offlineContent.filter(item => item.id !== content.id), newContent];
    setOfflineContent(updated);
    localStorage.setItem('bia-offline-content', JSON.stringify(updated));
  };

  const removeOfflineContent = (id: string) => {
    const updated = offlineContent.filter(item => item.id !== id);
    setOfflineContent(updated);
    localStorage.setItem('bia-offline-content', JSON.stringify(updated));
  };

  const isContentOffline = (id: string) => {
    return offlineContent.some(item => item.id === id);
  };

  const getOfflineContent = (id: string) => {
    return offlineContent.find(item => item.id === id);
  };

  return {
    offlineContent,
    isOnline,
    saveOfflineContent,
    removeOfflineContent,
    isContentOffline,
    getOfflineContent,
  };
};