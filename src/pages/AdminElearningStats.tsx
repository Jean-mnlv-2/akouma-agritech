import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/integrations/api/client';
import {
  Loader2, 
  Plus, 
  Edit, 
  Trash2, 
  BarChart3, 
  TrendingUp
} from 'lucide-react';

const statSchema = z.object({
  label: z.string().min(1, 'Label requis'),
  value: z.string().min(1, 'Valeur requise'),
  icon: z.string().optional()
});

type StatFormData = z.infer<typeof statSchema>;

interface Stat {
  id: string;
  label: string;
  value: string;
  icon: string | null;
  created_at: string;
}

export default function AdminElearningStats() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingStat, setEditingStat] = useState<Stat | undefined>(undefined);
  const { toast } = useToast();

  const form = useForm<StatFormData>({
    resolver: zodResolver(statSchema),
    defaultValues: { label: '', value: '', icon: '' }
  });

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.request('GET', '/api/elearning_stats');
      const list = (data as any[]) || [];
      list.sort((a, b) => {
        const aVal = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bVal = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bVal - aVal;
      });
      setStats(list as any);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les statistiques', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const onSubmit = async (data: StatFormData) => {
    setIsSubmitting(true);
    try {
      const payload = { label: data.label.trim(), value: data.value.trim(), icon: data.icon?.trim() || null };
      if (editingStat) {
        await api.request('PUT', `/api/elearning_stats/${editingStat.id}`, { body: payload });
        toast({ title: 'Statistique mise à jour' });
      } else {
        await api.request('POST', '/api/elearning_stats', { body: payload });
        toast({ title: 'Statistique créée' });
      }
      form.reset();
      setEditingStat(undefined);
      setIsDialogOpen(false);
      fetchStats();
    } catch (error) {
      console.error('Error saving stat:', error);
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder la statistique', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteStat = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette statistique ?')) return;
    try {
      await api.request('DELETE', `/api/elearning_stats/${id}`);
      toast({ title: 'Statistique supprimée' });
      fetchStats();
    } catch (error) {
      console.error('Error deleting stat:', error);
      toast({ title: 'Erreur', description: 'Impossible de supprimer la statistique', variant: 'destructive' });
    }
  };

  const openEditDialog = (stat: Stat) => {
    setEditingStat(stat);
    form.reset({ label: stat.label, value: stat.value, icon: stat.icon || '' });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setEditingStat(undefined);
    form.reset();
    setIsDialogOpen(false);
  };

  if (loading) {
    return (<div className="flex items-center justify-center py-8"><Loader2 className="w-8 h-8 animate-spin" /></div>);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-xl md:text-2xl font-bold flex items-center space-x-2"><BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" /><span>Statistiques E-Learning</span></h2>
          <p className="text-sm md:text-base text-muted-foreground mt-1">Gérer les statistiques affichées sur la page E-Learning</p>
          <p className="text-sm text-primary mt-1">{stats.length} statistique(s)</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2"><Plus className="w-4 h-4" /><span>Nouvelle Statistique</span></Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">{editingStat ? (<><Edit className="w-4 h-4" /><span>Modifier la statistique</span></>) : (<><Plus className="w-4 h-4" /><span>Créer une statistique</span></>)}</DialogTitle>
              <DialogDescription>{editingStat ? "Modifiez les informations de la statistique" : "Créez une nouvelle statistique pour la page E-Learning"}</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="label" render={({ field }) => (<FormItem><FormLabel>Label *</FormLabel><FormControl><Input placeholder="Ex: Cours disponibles" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="value" render={({ field }) => (<FormItem><FormLabel>Valeur *</FormLabel><FormControl><Input placeholder="Ex: 150+" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="icon" render={({ field }) => (<FormItem><FormLabel>Icône (optionnel)</FormLabel><FormControl><Input placeholder="Ex: BookOpen" {...field} /></FormControl><div className="text-xs text-muted-foreground">Nom de l'icône Lucide (ex: BookOpen, Users, Award, Clock)</div><FormMessage /></FormItem>)} />
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={closeDialog}>Annuler</Button>
                  <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editingStat ? 'Mettre à jour' : 'Créer'}</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2"><TrendingUp className="w-4 h-4 md:w-5 md:h-5" /><span>Statistiques ({stats.length})</span></CardTitle>
          <CardDescription>Liste de toutes les statistiques E-Learning</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-[600px] sm:min-w-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs md:text-sm">Label</TableHead>
                    <TableHead className="text-xs md:text-sm">Valeur</TableHead>
                    <TableHead className="text-xs md:text-sm hidden md:table-cell">Icône</TableHead>
                    <TableHead className="text-right text-xs md:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.map((stat: any) => (
                    <TableRow key={stat.id}>
                      <TableCell className="py-2 md:py-4">
                        <div className="flex items-center space-x-2 md:space-x-3">
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><BarChart3 className="w-3 h-3 md:w-4 md:h-4 text-primary" /></div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm md:text-base truncate">{stat.label}</div>
                            <div className="text-xs text-muted-foreground hidden md:block">ID: {String(stat.id).slice(0, 8)}...</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><div className="text-sm md:text-base font-semibold text-primary">{stat.value}</div></TableCell>
                      <TableCell className="hidden md:table-cell">{stat.icon ? (<div className="text-xs text-muted-foreground">{stat.icon}</div>) : (<div className="text-xs text-muted-foreground">Aucune icône</div>)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1 md:space-x-2">
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(stat)} className="text-blue-600 hover:text-blue-700 h-8 w-8 md:h-9 md:w-auto p-0 md:px-3"><Edit className="w-3 h-3 md:w-4 md:h-4" /><span className="hidden md:inline ml-1">Modifier</span></Button>
                          <Button variant="outline" size="sm" onClick={() => deleteStat(stat.id)} className="text-destructive hover:text-destructive h-8 w-8 md:h-9 md:w-auto p-0 md:px-3"><Trash2 className="w-3 h-3 md:w-4 md:h-4" /><span className="hidden md:inline ml-1">Supprimer</span></Button>
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
