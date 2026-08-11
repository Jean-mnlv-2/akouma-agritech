import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/integrations/api/client';
import { Send, Bell } from 'lucide-react';

export function AdminPushNotifications() {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');

  const sendMutation = useMutation({
    mutationFn: async () => api.request('POST', '/api/push/broadcast', { body: { title, body, url: url || undefined } }),
    onSuccess: (res: any) => {
      const { sent, removed, failed } = res?.data || {};
      toast({ title: 'Notification envoyée', description: `${sent ?? 0} appareil(s) atteint(s)${removed ? `, ${removed} abonnement(s) expiré(s) nettoyé(s)` : ''}${failed ? `, ${failed} échec(s)` : ''}.` });
      setTitle(''); setBody(''); setUrl('');
    },
    onError: (e: unknown) => {
      const message = e instanceof Error ? e.message : '';
      const description = message.includes('503') || message.includes('non configurées')
        ? "Notifications non configurées : définissez VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY côté serveur."
        : "Impossible d'envoyer la notification.";
      toast({ title: 'Erreur', description, variant: 'destructive' });
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast({ title: 'Validation', description: 'Titre et message sont requis.', variant: 'destructive' });
      return;
    }
    sendMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" />Notifications Push</CardTitle>
        <CardDescription>
          Envoie une notification à tous les appareils abonnés (PWA installée uniquement — Menu → Notifications).
          Utilise-la avec parcimonie pour éviter la fatigue de notification.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4 max-w-lg">
          <div className="space-y-2">
            <Label>Titre *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nouvel article disponible" maxLength={120} />
          </div>
          <div className="space-y-2">
            <Label>Message *</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Découvrez notre dernière actualité sur..." rows={3} maxLength={500} />
          </div>
          <div className="space-y-2">
            <Label>Lien à l'ouverture (optionnel)</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/news/mon-article" />
          </div>
          <Button type="submit" disabled={sendMutation.isPending}>
            <Send className="w-4 h-4 mr-2" />
            {sendMutation.isPending ? 'Envoi...' : 'Envoyer à tous les abonnés'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
