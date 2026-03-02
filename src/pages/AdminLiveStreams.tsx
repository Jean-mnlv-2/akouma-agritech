import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/integrations/api/client';
import { 
  Loader2, 
  Plus, 
  Edit, 
  Trash2, 
  Video, 
  Calendar,
  Users,
  Eye,
  EyeOff
} from 'lucide-react';

const liveStreamSchema = z.object({
  title: z.string().min(1, 'Titre requis'),
  instructorName: z.string().min(1, 'Instructeur requis'),
  scheduledTime: z.string().optional(),
  durationMinutes: z.number().min(1, 'Durée requise').optional(),
  viewerCount: z.number().min(0).default(0),
  isLive: z.boolean().default(false),
  description: z.string().optional(),
  category: z.string().optional(),
  thumbnailUrl: z.string().url('URL invalide').optional().or(z.literal('')),
  streamUrl: z.string().url('URL invalide').optional().or(z.literal(''))
});

type LiveStreamFormData = z.infer<typeof liveStreamSchema>;

interface LiveStream {
  id: number;
  title: string;
  instructorName: string | null;
  scheduledTime: string | null;
  durationMinutes: number | null;
  viewerCount: number;
  isLive: boolean;
  description: string | null;
  category: string | null;
  thumbnailUrl: string | null;
  streamUrl?: string | null;
  createdAt: string;
}

export default function AdminLiveStreams() {
  const queryClient = useQueryClient();
  const { data: liveStreams = [], isLoading } = useQuery<LiveStream[]>({
    queryKey: ['admin', 'live-streams'],
    queryFn: async () => {
      const res = await api.request('GET', '/api/live_streams');
      const list = Array.isArray(res) ? res : res.data;
      const sorted = (list || []).slice().sort((a: any, b: any) => {
        const aVal = a.scheduledTime ? new Date(a.scheduledTime).getTime() : 0;
        const bVal = b.scheduledTime ? new Date(b.scheduledTime).getTime() : 0;
        return aVal - bVal;
      });
      return sorted;
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
  const { data: users = [] } = useQuery<Array<{id: string, fullName: string, email: string}>>({
    queryKey: ['admin', 'users-list'],
    queryFn: async () => {
      const res = await api.request('GET', '/api/profiles');
      const { data } = Array.isArray(res) ? { data: res } : res;
      const adminUsers = (data || []).filter((user: any) => 
        user.role === 'admin' || user.role === 'supervisor'
      ).map((user: any) => ({
        id: user.id,
        fullName: user.fullName || user.email,
        email: user.email
      }));
      return adminUsers;
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingStream, setEditingStream] = useState<LiveStream | undefined>(undefined);
  const { toast } = useToast();

  const form = useForm<LiveStreamFormData>({
    resolver: zodResolver(liveStreamSchema),
    defaultValues: {
      title: '',
      instructorName: '',
      scheduledTime: '',
      durationMinutes: undefined,
      viewerCount: 0,
      isLive: false,
      description: '',
      category: '',
      thumbnailUrl: '',
      streamUrl: ''
    }
  });

  useEffect(() => { /* initial effects no longer needed due to React Query */ }, []);

  const upsertMutation = useMutation({
    mutationFn: async (payload: { data: LiveStreamFormData; id?: number }) => {
      const d = payload.data;
      const mapped = {
        title: d.title.trim(),
        instructorName: d.instructorName?.trim() || null,
        scheduledTime: d.scheduledTime || null,
        durationMinutes: d.durationMinutes || null,
        viewerCount: d.viewerCount,
        isLive: d.isLive,
        description: d.description?.trim() || null,
        category: d.category?.trim() || null,
        thumbnailUrl: d.thumbnailUrl?.trim() || null,
        streamUrl: d.streamUrl?.trim() || null,
      };
      if (payload.id) {
        return api.request('PUT', `/api/live_streams/${payload.id}`, { body: mapped });
      }
      return api.request('POST', `/api/live_streams`, { body: mapped });
    },
    onSuccess: () => {
      toast({ title: editingStream ? 'Succès' : 'Succès', description: editingStream ? 'Live stream mis à jour avec succès' : 'Live stream créé avec succès' });
      form.reset();
      setEditingStream(undefined);
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'live-streams'] });
    },
    onError: (error: unknown) => {
      console.error('Error saving live stream:', error);
      const errorMessage = error instanceof Error ? error.message : 'Impossible de sauvegarder le live stream';
      toast({ title: 'Erreur', description: errorMessage, variant: 'destructive' });
    },
    onSettled: () => setIsSubmitting(false),
  });
  const onSubmit = async (data: LiveStreamFormData) => {
    setIsSubmitting(true);
    upsertMutation.mutate({ data, id: editingStream?.id });
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.request('DELETE', `/api/live_streams/${id}`),
    onSuccess: () => {
      toast({ title: 'Live stream supprimé' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'live-streams'] });
    },
    onError: (error: unknown) => {
      console.error('Error deleting live stream:', error);
      toast({ title: 'Erreur', description: 'Impossible de supprimer le live stream', variant: 'destructive' });
    }
  });
  const deleteLiveStream = (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce live stream ?')) return;
    deleteMutation.mutate(id);
  };

  const openEditDialog = (stream: LiveStream) => {
    setEditingStream(stream);
    form.reset({
      title: stream.title,
      instructorName: stream.instructorName || '',
      scheduledTime: stream.scheduledTime ? new Date(stream.scheduledTime).toISOString().slice(0, 16) : '',
      durationMinutes: stream.durationMinutes || undefined,
      viewerCount: stream.viewerCount,
      isLive: stream.isLive,
      description: stream.description || '',
      category: stream.category || '',
      thumbnailUrl: stream.thumbnailUrl || '',
      streamUrl: stream.streamUrl || ''
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setEditingStream(undefined);
    form.reset();
    setIsDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-xl md:text-2xl font-bold flex items-center space-x-2">
            <Video className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
            <span>Live Streams</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Gérer les sessions en direct et webinaires
          </p>
          <p className="text-sm text-primary mt-1">
            {liveStreams.length} live stream(s)
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Nouveau Live Stream</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                {editingStream ? (
                  <>
                    <Edit className="w-4 h-4" />
                    <span>Modifier le live stream</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Créer un live stream</span>
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {editingStream ? 'Modifiez les informations du live stream' : 'Créez un nouveau live stream ou webinaire'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre *</FormLabel>
                    <FormControl><Input placeholder="Titre du live stream" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="instructorName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructeur</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un instructeur" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.fullName}>
                              {user.fullName} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie</FormLabel>
                      <FormControl><Input placeholder="Catégorie" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="scheduledTime" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date et heure programmée</FormLabel>
                      <FormControl><Input type="datetime-local" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="durationMinutes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Durée (minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="60" {...field} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="thumbnailUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL de la miniature</FormLabel>
                    <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="streamUrl" render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL du live</FormLabel>
                      <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="viewerCount" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de viewers</FormLabel>
                      <FormControl><Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="isLive" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>En direct</FormLabel>
                      <div className="text-sm text-muted-foreground">Marquer comme live</div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )} />
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={closeDialog}>Annuler</Button>
                  <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editingStream ? 'Mettre à jour' : 'Créer'}</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Video className="w-4 h-4 md:w-5 md:h-5" />
            <span>Live Streams ({liveStreams.length})</span>
          </CardTitle>
          <CardDescription>Liste de tous les live streams et webinaires</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-[800px] sm:min-w-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs md:text-sm">Titre</TableHead>
                    <TableHead className="text-xs md:text-sm hidden md:table-cell">Instructeur</TableHead>
                    <TableHead className="text-xs md:text-sm">Statut</TableHead>
                    <TableHead className="text-xs md:text-sm hidden lg:table-cell">Viewers</TableHead>
                    <TableHead className="text-xs md:text-sm hidden lg:table-cell">Date</TableHead>
                    <TableHead className="text-right text-xs md:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {liveStreams.map((stream) => (
                    <TableRow key={stream.id}>
                      <TableCell className="py-2 md:py-4">
                        <div className="flex items-center space-x-2 md:space-x-3">
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Video className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm md:text-base truncate">{stream.title}</div>
                            <div className="text-xs text-muted-foreground truncate md:hidden">{stream.instructorName}</div>
                            <div className="text-xs text-muted-foreground hidden md:block">{stream.category}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span className="text-xs md:text-sm">{stream.instructorName || 'Non renseigné'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {stream.isLive ? (
                          <Badge className="bg-red-500 hover:bg-red-600 flex items-center space-x-1">
                            <Eye className="w-3 h-3" />
                            <span>En direct</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center space-x-1">
                            <EyeOff className="w-3 h-3" />
                            <span>Programmé</span>
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span className="text-xs md:text-sm">{stream.viewerCount}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {stream.scheduledTime ? (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span className="text-xs md:text-sm text-muted-foreground">
                              {new Date(stream.scheduledTime).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs">Non programmé</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1 md:space-x-2">
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(stream)} className="text-blue-600 hover:text-blue-700 h-8 w-8 md:h-9 md:w-auto p-0 md:px-3">
                            <Edit className="w-3 h-3 md:w-4 md:h-4" />
                            <span className="hidden md:inline ml-1">Modifier</span>
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => deleteLiveStream(stream.id)} className="text-destructive hover:text-destructive h-8 w-8 md:h-9 md:w-auto p-0 md:px-3">
                            <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                            <span className="hidden md:inline ml-1">Supprimer</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
