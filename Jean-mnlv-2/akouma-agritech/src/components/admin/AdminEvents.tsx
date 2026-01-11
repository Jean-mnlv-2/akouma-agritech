import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Calendar, MapPin, Eye, EyeOff } from 'lucide-react';
import { EventDialog } from './EventDialog';

interface Event {
  id: number;
  title: string;
  description?: string;
  date: string;
  location: string;
  imageUrl?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export const AdminEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const { toast } = useToast();

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/events', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load');
      const body = await res.json();
      const items = Array.isArray(body) ? body : body.data;
      setEvents(items || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les événements', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleSave = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      let res: Response;
      if (editingEvent) {
        res = await fetch(`/api/events/${editingEvent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(eventData),
        });
      } else {
        res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(eventData),
        });
      }
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Succès', description: editingEvent ? 'Événement mis à jour' : 'Événement créé' });
      setIsDialogOpen(false);
      setEditingEvent(null);
      fetchEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder l\'événement', variant: 'destructive' });
    }
  };

  const handleEdit = (event: Event) => { setEditingEvent(event); setIsDialogOpen(true); };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to delete');
      toast({ title: 'Succès', description: 'Événement supprimé avec succès' });
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({ title: 'Erreur', description: "Impossible de supprimer l'événement", variant: 'destructive' });
    }
  };

  const togglePublished = async (event: Event) => {
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isPublished: !event.isPublished }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Succès', description: `Événement ${!event.isPublished ? 'publié' : 'dépublié'} avec succès` });
      fetchEvents();
    } catch (error) {
      console.error('Error toggling event status:', error);
      toast({ title: 'Erreur', description: "Impossible de modifier le statut de l'événement", variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement des événements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Événements</h2>
          <p className="text-muted-foreground">Gérez les événements à venir et passés</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Nouvel Événement</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Événements</CardTitle>
          <CardDescription>{events.length} événement(s) au total</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun événement trouvé</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Lieu</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>{new Date(event.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</TableCell>
                    <TableCell><div className="flex items-center space-x-1"><MapPin className="w-4 h-4 text-muted-foreground" /><span>{event.location}</span></div></TableCell>
                    <TableCell><Badge variant={event.isPublished ? 'default' : 'secondary'}>{event.isPublished ? 'Publié' : 'Brouillon'}</Badge></TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(event)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="outline" size="sm" onClick={() => togglePublished(event)}>{event.isPublished ? (<EyeOff className="w-4 h-4" />) : (<Eye className="w-4 h-4" />)}</Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(event.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <EventDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} event={editingEvent} onSave={handleSave} />
    </div>
  );
};
