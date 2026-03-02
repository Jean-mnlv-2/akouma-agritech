// 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, FileText, Calendar } from 'lucide-react';
import { Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/integrations/api/client';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  project_type: string;
  message: string;
  status: string;
  created_at: string;
}

interface ContentSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  content_type: string;
  title: string;
  description: string;
  category: string;
  duration?: string;
  target_audience?: string;
  file_url?: string;
  status: string;
  created_at: string;
}

interface DemoRequest {
  id: string;
  name: string;
  email: string;
  company: string;
  phone?: string;
  message?: string;
  status: string;
  created_at: string;
}

export const AdminSubmissions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<{
    contact: ContactMessage[];
    content: ContentSubmission[];
    demo: DemoRequest[];
  }>({
    queryKey: ['admin', 'submissions'],
    queryFn: async () => {
      const [contactRes, contentRes, demoRes] = await Promise.all([
        api.request('GET', '/api/contact_messages'),
        api.request('GET', '/api/content_submissions'),
        api.request('GET', '/api/demo_requests'),
      ]);
      const contact = Array.isArray(contactRes) ? contactRes : contactRes.data;
      const content = Array.isArray(contentRes) ? contentRes : contentRes.data;
      const demo = Array.isArray(demoRes) ? demoRes : demoRes.data;
      return { contact: contact || [], content: content || [], demo: demo || [] };
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (args: { collection: 'contactMessages' | 'contentSubmissions' | 'demoRequests'; id: string; status: string }) => {
      const routeMap: Record<string, string> = {
        contactMessages: 'contact_messages',
        contentSubmissions: 'content_submissions',
        demoRequests: 'demo_requests',
      };
      const route = routeMap[args.collection] || args.collection;
      return api.request('PUT', `/api/${route}/${args.id}`, { body: { status: args.status, processedAt: new Date().toISOString() } });
    },
    onSuccess: async () => {
      toast({ title: 'Statut mis à jour', description: 'Le statut a été modifié avec succès' });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'submissions'] });
    },
    onError: async (error: unknown) => {
      console.error('Error updating status:', error);
      toast({ title: 'Erreur', description: "Impossible de mettre à jour le statut", variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (args: { collection: 'contactMessages' | 'contentSubmissions' | 'demoRequests'; id: string }) => {
      const routeMap: Record<string, string> = {
        contactMessages: 'contact_messages',
        contentSubmissions: 'content_submissions',
        demoRequests: 'demo_requests',
      };
      const route = routeMap[args.collection] || args.collection;
      return api.request('DELETE', `/api/${route}/${args.id}`);
    },
    onSuccess: async () => {
      toast({ title: 'Supprimé', description: 'L’élément a été supprimé avec succès.' });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'submissions'] });
    },
    onError: async (error: unknown) => {
      console.error('Error deleting submission:', error);
      toast({ title: 'Erreur', description: "Impossible de supprimer l’élément.", variant: 'destructive' });
    }
  });

  const updateStatus = (collection: 'contactMessages' | 'contentSubmissions' | 'demoRequests', id: string, status: string) => {
    updateStatusMutation.mutate({ collection, id, status });
  };

  const handleDelete = (collection: 'contactMessages' | 'contentSubmissions' | 'demoRequests', id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.')) return;
    deleteMutation.mutate({ collection, id });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      new: 'default',
      pending: 'secondary',
      processed: 'outline',
      completed: 'outline',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  if (isLoading) { return <div className="text-center py-8">Chargement des soumissions...</div>; }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des Soumissions</h2>
        <Button onClick={() => refetch()} variant="outline">Actualiser</Button>
      </div>

      <Tabs defaultValue="contact" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="contact" className="flex items-center gap-2"><MessageSquare className="w-4 h-4" />Messages Contact ({(data?.contact || []).length})</TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2"><FileText className="w-4 h-4" />Contenus ({(data?.content || []).length})</TabsTrigger>
          <TabsTrigger value="demo" className="flex items-center gap-2"><Calendar className="w-4 h-4" />Consultations ({(data?.demo || []).length})</TabsTrigger>
        </TabsList>

        <TabsContent value="contact" className="space-y-4">
          {(data?.contact || []).map((message) => (
            <Card key={message.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-lg">{message.name}</CardTitle>
                  <CardDescription>{message.email} • {message.project_type}{message.company && ` • ${message.company}`}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(message.status)}
                  <span className="text-sm text-muted-foreground">{new Date(message.created_at).toLocaleDateString()}</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{message.message}</p>
                {message.phone && (<p className="text-sm text-muted-foreground mb-4">Téléphone: {message.phone}</p>)}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => updateStatus('contactMessages', message.id, 'processed')}>Marquer comme traité</Button>
                  <Button size="sm" variant="outline" onClick={() => updateStatus('contactMessages', message.id, 'completed')}>Terminer</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete('contactMessages', message.id)}><Trash2 className="w-4 h-4 mr-1" /> Supprimer</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          {(data?.content || []).map((submission) => (
            <Card key={submission.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-lg">{submission.title}</CardTitle>
                  <CardDescription>{submission.name} • {submission.email} • {submission.content_type}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(submission.status)}
                  <span className="text-sm text-muted-foreground">{new Date(submission.created_at).toLocaleDateString()}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <p><strong>Catégorie:</strong> {submission.category}</p>
                  {submission.duration && <p><strong>Durée:</strong> {submission.duration}</p>}
                  {submission.target_audience && <p><strong>Public:</strong> {submission.target_audience}</p>}
                  {submission.organization && <p><strong>Organisation:</strong> {submission.organization}</p>}
                </div>
                <p className="text-gray-700 mb-4">{submission.description}</p>
                {submission.file_url && (
                  <p className="text-sm text-blue-600 mb-4"><a href={submission.file_url} target="_blank" rel="noopener noreferrer">Voir le fichier/lien</a></p>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => updateStatus('contentSubmissions', submission.id, 'processed')}>En cours de révision</Button>
                  <Button size="sm" variant="outline" onClick={() => updateStatus('contentSubmissions', submission.id, 'completed')}>Approuver</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete('contentSubmissions', submission.id)}><Trash2 className="w-4 h-4 mr-1" /> Supprimer</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="demo" className="space-y-4">
          {(data?.demo || []).map((request) => (
            <Card key={request.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-lg">{request.name}</CardTitle>
                  <CardDescription>{request.email} • {request.company}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(request.status)}
                  <span className="text-sm text-muted-foreground">{new Date(request.created_at).toLocaleDateString()}</span>
                </div>
              </CardHeader>
              <CardContent>
                {request.phone && (<p className="text-sm text-muted-foreground mb-2">Téléphone: {request.phone}</p>)}
                {request.message && (<p className="text-gray-700 mb-4">{request.message}</p>)}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => updateStatus('demoRequests', request.id, 'processed')}>Contacté</Button>
                  <Button size="sm" variant="outline" onClick={() => updateStatus('demoRequests', request.id, 'completed')}>Consultation terminée</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete('demoRequests', request.id)}><Trash2 className="w-4 h-4 mr-1" /> Supprimer</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};
