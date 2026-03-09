import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Calendar, MapPin, Eye, EyeOff } from 'lucide-react';
import { EventDialog } from './EventDialog';
import AdminDetailsDialog from './AdminDetailsDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/integrations/api/client';

export interface Event {
  id: number;
  title: string;
  slug: string;
  description?: string;
  date: string;
  location: string;
  imageUrl?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export const AdminEvents = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [viewingEvent, setViewingEvent] = useState<Event | null>(null);
  const { toast } = useToast();

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['admin', 'events'],
    queryFn: async () => {
      const res = await api.request('GET', '/api/events');
      const items = Array.isArray(res) ? res : res.data;
      return items || [];
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const upsertMutation = useMutation({
    mutationFn: async (payload: { data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>; id?: number }) => {
      if (payload.id) return api.request('PUT', `/api/events/${payload.id}`, { body: payload.data });
      return api.request('POST', '/api/events', { body: payload.data });
    },
    onSuccess: () => {
      toast({ title: 'Succès', description: editingEvent ? 'Événement mis à jour' : 'Événement créé' });
      setIsDialogOpen(false);
      setEditingEvent(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
    },
    onError: (error: unknown) => {
      console.error('Error saving event:', error);
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder l\'événement', variant: 'destructive' });
    }
  });
  const handleSave = (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = editingEvent?.id;
    upsertMutation.mutate({ data: eventData, id });
  };

  const handleEdit = (event: Event) => { setEditingEvent(event); setIsDialogOpen(true); };

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.request('DELETE', `/api/events/${id}`),
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Événement supprimé avec succès' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
    },
    onError: (error: unknown) => {
      console.error('Error deleting event:', error);
      toast({ title: 'Erreur', description: "Impossible de supprimer l'événement", variant: 'destructive' });
    }
  });
  const handleDelete = (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;
    deleteMutation.mutate(id);
  };

  const togglePublishedMutation = useMutation({
    mutationFn: async (event: Event) => api.request('PUT', `/api/events/${event.id}`, { body: { isPublished: !event.isPublished } }),
    onSuccess: (_res, event) => {
      toast({ title: 'Succès', description: `Événement ${!event.isPublished ? 'publié' : 'dépublié'} avec succès` });
      queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
    },
    onError: (error: unknown) => {
      console.error('Error toggling event status:', error);
      toast({ title: 'Erreur', description: "Impossible de modifier le statut de l'événement", variant: 'destructive' });
    }
  });
  const togglePublished = (event: Event) => { togglePublishedMutation.mutate(event); };

  if (isLoading) {
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
                  <TableRow 
                    key={event.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      setViewingEvent(event);
                      setIsDetailsOpen(true);
                    }}
                  >
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>{new Date(event.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</TableCell>
                    <TableCell><div className="flex items-center space-x-1"><MapPin className="w-4 h-4 text-muted-foreground" /><span>{event.location}</span></div></TableCell>
                    <TableCell><Badge variant={event.isPublished ? 'default' : 'secondary'}>{event.isPublished ? 'Publié' : 'Brouillon'}</Badge></TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(event);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePublished(event);
                          }}
                        >
                          {event.isPublished ? (<EyeOff className="w-4 h-4" />) : (<Eye className="w-4 h-4" />)}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(event.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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

      <AdminDetailsDialog
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={viewingEvent?.title || ''}
        data={viewingEvent as any}
        type="event"
      />
    </div>
  );
};
