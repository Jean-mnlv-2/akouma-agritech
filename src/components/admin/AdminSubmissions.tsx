import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Eye, MessageSquare, FileText, Calendar } from 'lucide-react';
import { Trash2 } from 'lucide-react';

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
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [contentSubmissions, setContentSubmissions] = useState<ContentSubmission[]>([]);
  const [demoRequests, setDemoRequests] = useState<DemoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => { fetchAllSubmissions(); }, []);

  const fetchAllSubmissions = async () => {
    try {
      const [contactRes, contentRes, demoRes] = await Promise.all([
        fetch('/api/contact_messages', { credentials: 'include' }),
        fetch('/api/content_submissions', { credentials: 'include' }),
        fetch('/api/demo_requests', { credentials: 'include' }),
      ]);
      if (!contactRes.ok || !contentRes.ok || !demoRes.ok) throw new Error('Failed to load');
      const [contactBody, contentBody, demoBody] = await Promise.all([contactRes.json(), contentRes.json(), demoRes.json()]);
      setContactMessages((Array.isArray(contactBody) ? contactBody : contactBody.data) || []);
      setContentSubmissions((Array.isArray(contentBody) ? contentBody : contentBody.data) || []);
      setDemoRequests((Array.isArray(demoBody) ? demoBody : demoBody.data) || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les soumissions', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (
    collection: 'contactMessages' | 'contentSubmissions' | 'demoRequests',
    id: string,
    status: string
  ) => {
    try {
      const res = await fetch(`/api/${collection}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, processedAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Statut mis à jour', description: 'Le statut a été modifié avec succès' });
      fetchAllSubmissions();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ title: 'Erreur', description: "Impossible de mettre à jour le statut", variant: 'destructive' });
    }
  };

  const handleDelete = async (
    collection: 'contactMessages' | 'contentSubmissions' | 'demoRequests',
    id: string
  ) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.')) return;
    try {
      const res = await fetch(`/api/${collection}/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Supprimé', description: 'L’élément a été supprimé avec succès.' });
      fetchAllSubmissions();
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast({ title: 'Erreur', description: "Impossible de supprimer l’élément.", variant: 'destructive' });
    }
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

  if (loading) { return <div className="text-center py-8">Chargement des soumissions...</div>; }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des Soumissions</h2>
        <Button onClick={fetchAllSubmissions} variant="outline">Actualiser</Button>
      </div>

      <Tabs defaultValue="contact" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="contact" className="flex items-center gap-2"><MessageSquare className="w-4 h-4" />Messages Contact ({contactMessages.length})</TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2"><FileText className="w-4 h-4" />Contenus ({contentSubmissions.length})</TabsTrigger>
          <TabsTrigger value="demo" className="flex items-center gap-2"><Calendar className="w-4 h-4" />Consultations ({demoRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="contact" className="space-y-4">
          {contactMessages.map((message) => (
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
          {contentSubmissions.map((submission) => (
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
          {demoRequests.map((request) => (
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