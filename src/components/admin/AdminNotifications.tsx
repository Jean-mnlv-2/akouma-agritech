import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, ShoppingCart, Briefcase, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/integrations/api/client';

interface Notification {
  id: string;
  type: 'order' | 'application';
  title: string;
  description: string;
  createdAt: string;
}

const POLL_INTERVAL = 30_000; // 30 seconds

export function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const res = await api.request('GET', `/api/stats/notifications?since=${since}`);
      setNotifications(res.data || []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const unseen = notifications.filter(n => !seen.has(n.id)).length;

  const handleOpen = () => {
    setOpen(prev => !prev);
  };

  const markAllSeen = () => {
    setSeen(new Set(notifications.map(n => n.id)));
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Il y a ${diffH}h`;
    return d.toLocaleDateString('fr-FR');
  };

  return (
    <div className="relative" ref={panelRef}>
      <Button variant="outline" size="sm" className="relative" onClick={handleOpen}>
        <Bell className="w-4 h-4" />
        {unseen > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 min-w-[20px] flex items-center justify-center text-[10px] px-1 bg-destructive text-destructive-foreground border-0">
            {unseen > 99 ? '99+' : unseen}
          </Badge>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card border border-border rounded-lg shadow-xl z-50">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <h3 className="font-semibold text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              {unseen > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllSeen} className="text-xs h-7">
                  Tout marquer lu
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="max-h-[400px]">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                Aucune notification récente
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={`p-3 flex items-start gap-3 transition-colors ${!seen.has(n.id) ? 'bg-primary/5' : ''}`}
                  >
                    <div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${n.type === 'order' ? 'bg-primary/10 text-primary' : 'bg-purple-500/10 text-purple-600'}`}>
                      {n.type === 'order' ? <ShoppingCart className="w-3.5 h-3.5" /> : <Briefcase className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.description}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">{formatTime(n.createdAt)}</p>
                    </div>
                    {!seen.has(n.id) && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
