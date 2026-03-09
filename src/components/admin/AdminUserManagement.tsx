import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  UserPlus, 
  Shield, 
  Users, 
  Trash2, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Crown,
  ShoppingCart,
  Eye,
  Calendar,
  Mail,
  Key,
  Settings
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/integrations/api/client';
import AdminDetailsDialog from './AdminDetailsDialog';

const userSchema = z.object({
  email: z.string().email('Email invalide'),
  firstName: z.string().min(2, 'Prénom minimum 2 caractères'),
  lastName: z.string().min(2, 'Nom minimum 2 caractères'),
  role: z.enum(['admin', 'supervisor', 'customer']),
  allowedModules: z.array(z.string()).optional(),
});

type UserFormData = z.infer<typeof userSchema>;

type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'supervisor' | 'customer';
  created_at: string;
  is_active: boolean;
  allowed_modules?: string[];
  temp_password?: string;
};

const MODULES = [
  { id: 'users', label: 'Utilisateurs' },
  { id: 'orders', label: 'Ventes & Promos' },
  { id: 'courses', label: 'Cours' },
  { id: 'news', label: 'Actualités' },
  { id: 'seeds', label: 'Semences' },
  { id: 'products', label: 'Produits' },
  { id: 'partners', label: 'Partenaires' },
  { id: 'careers', label: 'Emplois' },
  { id: 'events', label: 'Événements' },
  { id: 'livestreams', label: 'Live Streams' },
  { id: 'submissions', label: 'Soumissions' },
  { id: 'contact-settings', label: 'Contacts & Réseaux' },
];

const STATUS_FILTER = ['all', 'active', 'inactive'] as const;
type StatusFilter = typeof STATUS_FILTER[number];

export function AdminUserManagement() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [viewingUser, setViewingUser] = useState<User | undefined>(undefined);
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { email: '', firstName: '', lastName: '', role: 'customer', allowedModules: [] },
  });

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await api.auth.getUser();
      if (data?.user) setCurrentUser({ id: data.user.id, role: data.user.role });
    };
    fetchSession();
  }, []);

  const isAdmin = currentUser?.role === 'admin';

  const { data, isLoading } = useQuery<User[]>({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const res = await api.request('GET', '/api/profiles');
      const items = Array.isArray(res) ? res : res.data;
      return items || [];
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
  const users: User[] = Array.isArray(data) ? data : [];

  useEffect(() => { setCurrentPage(1); }, [statusFilter, search]);

  const createUserMutation = useMutation({
    mutationFn: async (payload: UserFormData) => {
      return api.request('POST', '/api/profiles', { 
        body: { 
          email: payload.email, 
          firstName: payload.firstName, 
          lastName: payload.lastName, 
          role: payload.role,
          allowedModules: payload.allowedModules 
        } 
      });
    },
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Utilisateur créé avec succès. Les identifiants ont été envoyés par email.' });
      form.reset();
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (error: unknown) => {
      console.error('Error creating user:', error);
      toast({ title: 'Erreur', description: "Impossible de créer l'utilisateur", variant: 'destructive' });
    },
    onSettled: () => setIsCreating(false),
  });
  const createUser = (data: UserFormData) => { setIsCreating(true); createUserMutation.mutate(data); };

  const _toggleUserStatus = (userId: string, makeActive: boolean) => { toggleStatusMutation.mutate({ userId, isActive: makeActive }); };

  const updateUserMutation = useMutation({
    mutationFn: async (payload: { id: string; data: UserFormData }) => {
      return api.request('PUT', `/api/profiles/${payload.id}`, { 
        body: { 
          firstName: payload.data.firstName, 
          lastName: payload.data.lastName, 
          email: payload.data.email, 
          role: payload.data.role,
          allowedModules: payload.data.allowedModules
        } 
      });
    },
    onSuccess: () => {
      toast({ title: 'Succès', description: "Utilisateur mis à jour avec succès" });
      form.reset();
      setEditingUser(undefined);
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (error: unknown) => {
      console.error('Error updating user:', error);
      toast({ title: 'Erreur', description: "Impossible de mettre à jour l'utilisateur", variant: 'destructive' });
    },
    onSettled: () => setIsCreating(false),
  });
  const updateUser = (data: UserFormData) => { if (!editingUser) return; setIsCreating(true); updateUserMutation.mutate({ id: editingUser.id, data }); };

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => api.request('DELETE', `/api/profiles/${userId}`),
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Utilisateur supprimé avec succès' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (error: unknown) => {
      console.error('Erreur lors de la suppression:', error);
      toast({ title: 'Erreur', description: "Impossible de supprimer l'utilisateur", variant: 'destructive' });
    }
  });
  const deleteUser = (userId: string) => { if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) return; deleteUserMutation.mutate(userId); };

  const toggleStatusMutation = useMutation({
    mutationFn: async (payload: { userId: string; isActive: boolean }) => {
      return api.request('PUT', `/api/profiles/${payload.userId}`, { body: { isActive: payload.isActive } });
    },
    onSuccess: (_res, variables) => {
      toast({ title: 'Succès', description: `Utilisateur ${variables.isActive ? 'activé' : 'désactivé'} avec succès` });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (error: unknown) => {
      console.error('Erreur lors du changement de statut:', error);
      toast({ title: 'Erreur', description: "Impossible de changer le statut de l'utilisateur", variant: 'destructive' });
    }
  });

  const filteredUsers: User[] = users.filter((u: User) => {
    if (statusFilter === 'active' && u.is_active === false) return false;
    if (statusFilter === 'inactive' && u.is_active !== false) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const hay = `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const allVisibleSelected = filteredUsers.length > 0 && filteredUsers.every((u: User) => selectedIds.has(u.id));
  const someVisibleSelected = filteredUsers.some((u: User) => selectedIds.has(u.id));
  const selectedCount = selectedIds.size;

  const toggleSelectAllVisible = (checked: boolean | string) => {
    const next = new Set(selectedIds);
    if (checked) { filteredUsers.forEach((u: User) => next.add(u.id)); } else { filteredUsers.forEach((u: User) => next.delete(u.id)); }
    setSelectedIds(next);
  };

  const toggleSelectOne = (id: string, checked: boolean | string) => {
    const next = new Set(selectedIds);
    if (checked) { next.add(id); } else { next.delete(id); }
    setSelectedIds(next);
  };

  const bulkToggle = async (makeActive: boolean) => {
    const action = makeActive ? 'activer' : 'désactiver';
    const confirmed = confirm(`Êtes-vous sûr de vouloir ${action} ${selectedIds.size} utilisateur(s) ?`);
    if (!confirmed) return;
    try {
      for (const userId of selectedIds) {
        const u = users.find((x: User) => x.id === userId);
        if (!u) continue;
        if (makeActive && u.is_active === false) {
          await api.request('PUT', `/api/profiles/${userId}`, { body: { isActive: true } });
        } else if (!makeActive && u.is_active !== false) {
          await api.request('PUT', `/api/profiles/${userId}`, { body: { isActive: false } });
        }
      }
      toast({ title: 'Succès', description: makeActive ? 'Utilisateurs activés' : 'Utilisateurs désactivés' });
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    } catch (e) {
      console.error('Bulk toggle error:', e);
      toast({ title: 'Erreur', description: 'Action groupée échouée', variant: 'destructive' });
    }
  };

  const isStatusFilter = (val: string): val is StatusFilter => (STATUS_FILTER as readonly string[]).includes(val);
  const handleStatusFilterChange = (v: string) => { if (isStatusFilter(v)) setStatusFilter(v); };

  const getRoleBadge = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return (
          <Badge className="bg-red-500 hover:bg-red-600 flex items-center space-x-1">
            <Crown className="w-3 h-3" />
            <span>Admin</span>
          </Badge>
        );
      case 'supervisor':
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 flex items-center space-x-1">
            <Shield className="w-3 h-3" />
            <span>Superviseur</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center space-x-1">
            <ShoppingCart className="w-3 h-3" />
            <span>Client</span>
          </Badge>
        );
    }
  };

  const getStatusIcon = (isActive: boolean = true) => isActive ? (<CheckCircle className="w-4 h-4 text-green-500" />) : (<XCircle className="w-4 h-4 text-red-500" />);

  const openEditDialog = (user: User) => {
    if (!isAdmin) {
      toast({ title: 'Accès refusé', description: 'Seul un administrateur peut modifier un utilisateur.', variant: 'destructive' });
      return;
    }
    setEditingUser(user);
    const formRole: UserFormData['role'] = user.role === 'admin' ? 'admin' : user.role === 'supervisor' ? 'supervisor' : 'customer';
    form.reset({ 
      email: user.email, 
      firstName: user.first_name, 
      lastName: user.last_name, 
      role: formRole,
      allowedModules: user.allowed_modules || []
    });
    setIsDialogOpen(true);
  };

  const openDetailsDialog = (user: User) => {
    setViewingUser(user);
    setIsDetailsOpen(true);
  };

  const closeDialog = () => { setEditingUser(undefined); form.reset(); setIsDialogOpen(false); };
  const closeDetailsDialog = () => { setViewingUser(undefined); setIsDetailsOpen(false); };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const allVisibleSelectedBool = allVisibleSelected;
  const someVisibleSelectedBool = someVisibleSelected;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-xl md:text-2xl font-bold flex items-center space-x-2">
            <Shield className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
            <span>Gestion des Utilisateurs</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mt-1">Créez et gérez les administrateurs, superviseurs et clients de la plateforme</p>
          {selectedCount > 0 && (<p className="text-sm text-primary mt-1">{selectedCount} utilisateur(s) sélectionné(s)</p>)}
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Statut</span>
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Tous" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Input placeholder="Rechercher (nom, email)" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled={!someVisibleSelectedBool || !isAdmin} onClick={() => bulkToggle(true)}>Activer sélection</Button>
            <Button variant="outline" disabled={!someVisibleSelectedBool || !isAdmin} onClick={() => bulkToggle(false)}>Désactiver sélection</Button>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!isAdmin} className="flex items-center space-x-2 w-full lg:w-auto">
                <UserPlus className="w-4 h-4" />
                <span>Nouvel Utilisateur</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2 text-lg md:text-xl">
                  {editingUser ? (<><Edit className="w-4 h-4 md:w-5 md:h-5" /><span>Modifier l'utilisateur</span></>) : (<><UserPlus className="w-4 h-4 md:w-5 md:h-5" /><span>Créer un nouvel utilisateur</span></>)}
                </DialogTitle>
                <DialogDescription className="text-sm md:text-base">{editingUser ? "Modifiez les informations de l'utilisateur" : "Créez un compte administrateur, superviseur ou client"}</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(editingUser ? updateUser : createUser)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel className="text-sm md:text-base">Prénom</FormLabel><FormControl><Input {...field} className="text-sm md:text-base" /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormLabel className="text-sm md:text-base">Nom</FormLabel><FormControl><Input {...field} className="text-sm md:text-base" /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel className="text-sm md:text-base">Email</FormLabel><FormControl><Input type="email" {...field} className="text-sm md:text-base" /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm md:text-base">Rôle</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="text-sm md:text-base"><SelectValue placeholder="Sélectionner un rôle" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin"><div className="flex items-center space-x-2"><Crown className="w-4 h-4 text-red-500" /><span>Administrateur</span></div></SelectItem>
                          <SelectItem value="supervisor"><div className="flex items-center space-x-2"><Shield className="w-4 h-4 text-blue-500" /><span>Superviseur</span></div></SelectItem>
                          <SelectItem value="customer"><div className="flex items-center space-x-2"><ShoppingCart className="w-4 h-4 text-green-500" /><span>Client</span></div></SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {form.watch('role') === 'supervisor' && (
                    <div className="space-y-3 pt-2">
                      <FormLabel className="text-sm md:text-base font-semibold">Modules autorisés</FormLabel>
                      <div className="grid grid-cols-2 gap-3 border rounded-lg p-3 bg-muted/30">
                        {MODULES.map((module) => (
                          <FormField
                            key={module.id}
                            control={form.control}
                            name="allowedModules"
                            render={({ field }) => {
                              const currentModules = Array.isArray(field.value) ? field.value : [];
                              return (
                                <FormItem key={module.id} className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={currentModules.includes(module.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...currentModules, module.id])
                                          : field.onChange(currentModules.filter((value) => value !== module.id));
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal cursor-pointer">
                                    {module.label}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={closeDialog} className="w-full sm:w-auto">Annuler</Button>
                    <Button type="submit" disabled={isCreating} className="w-full sm:w-auto">{isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editingUser ? 'Mettre à jour' : 'Créer'}</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2 text-lg md:text-xl">
                  <Eye className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  <span>Détails de l'utilisateur</span>
                </DialogTitle>
                <DialogDescription>Consultez les informations complètes de cet utilisateur</DialogDescription>
              </DialogHeader>
              
              {viewingUser && (
                <div className="space-y-6 py-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                      {viewingUser.first_name?.[0]}{viewingUser.last_name?.[0]}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{viewingUser.first_name} {viewingUser.last_name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        {getRoleBadge(viewingUser.role)}
                        <Badge variant="outline" className={`text-[10px] h-5 ${viewingUser.is_active !== false ? "text-green-600 border-green-200 bg-green-50" : "text-red-600 border-red-200 bg-red-50"}`}>
                          {viewingUser.is_active !== false ? "Actif" : "Inactif"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center space-x-3 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs uppercase font-semibold">Email</span>
                        <span>{viewingUser.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs uppercase font-semibold">Membre depuis</span>
                        <span>{new Date(viewingUser.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                    </div>

                    {isAdmin && viewingUser.temp_password && (
                      <div className="flex items-center space-x-3 text-sm p-3 bg-primary/5 rounded-lg border border-primary/10">
                        <Key className="w-4 h-4 text-primary" />
                        <div className="flex flex-col flex-1">
                          <span className="text-primary text-xs uppercase font-semibold">Identifiants de connexion</span>
                          <div className="flex justify-between items-center mt-1">
                            <span className="font-mono text-xs">Login: <strong>{viewingUser.email}</strong></span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="font-mono text-xs">Pass: <strong>{viewingUser.temp_password}</strong></span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2 text-[10px]"
                              onClick={() => {
                                navigator.clipboard.writeText(viewingUser.temp_password!);
                                toast({ title: "Copié", description: "Mot de passe copié dans le presse-papier" });
                              }}
                            >
                              Copier
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {isAdmin && !viewingUser.temp_password && viewingUser.role !== 'customer' && (
                      <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-amber-700 text-xs italic">
                        Le mot de passe temporaire n'est plus disponible pour cet utilisateur.
                      </div>
                    )}

                    {viewingUser.role === 'supervisor' && (
                      <div className="flex flex-col space-y-2 text-sm mt-2">
                        <div className="flex items-center space-x-2">
                          <Settings className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground text-xs uppercase font-semibold">Modules autorisés</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {viewingUser.allowed_modules && viewingUser.allowed_modules.length > 0 ? (
                            viewingUser.allowed_modules.map(modId => {
                              const mod = MODULES.find(m => m.id === modId);
                              return (
                                <Badge key={modId} variant="outline" className="text-[10px]">
                                  {mod?.label || modId}
                                </Badge>
                              );
                            })
                          ) : (
                            <span className="text-xs italic text-muted-foreground">Aucun module assigné</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button onClick={closeDetailsDialog}>Fermer</Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2"><Users className="w-4 h-4 md:w-5 md:h-5" /><span>Utilisateurs ({filteredUsers.length})</span></CardTitle>
          <CardDescription>Liste de tous les utilisateurs avec leurs rôles et statuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-[800px] sm:min-w-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={allVisibleSelectedBool} onCheckedChange={toggleSelectAllVisible} aria-label="Sélectionner tout" />
                    </TableHead>
                    <TableHead className="text-xs md:text-sm">Utilisateur</TableHead>
                    <TableHead className="text-xs md:text-sm hidden md:table-cell">Email</TableHead>
                    <TableHead className="text-xs md:text-sm">Rôle</TableHead>
                    <TableHead className="text-xs md:text-sm hidden lg:table-cell">Statut</TableHead>
                    <TableHead className="text-xs md:text-sm hidden lg:table-cell">Date de création</TableHead>
                    <TableHead className="text-right text-xs md:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user: User) => (
                    <TableRow 
                      key={user.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => openDetailsDialog(user)}
                    >
                      <TableCell>
                        <Checkbox 
                          checked={selectedIds.has(user.id)} 
                          onCheckedChange={(c) => toggleSelectOne(user.id, c)} 
                          aria-label={`Sélectionner ${user.email}`} 
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell className="py-2 md:py-4">
                        <div className="flex items-center space-x-2 md:space-x-3">
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 font-bold text-primary text-[10px] md:text-xs">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm md:text-base truncate">{user.first_name} {user.last_name}</div>
                            <div className="text-xs text-muted-foreground truncate md:hidden">{user.email}</div>
                            <div className="text-xs text-muted-foreground hidden md:block">ID: {user.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs md:text-sm hidden md:table-cell">{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center space-x-2">{getStatusIcon(user.is_active !== false)}<span className="text-xs md:text-sm">{user.is_active === false ? 'Inactif' : 'Actif'}</span></div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="text-xs md:text-sm text-muted-foreground">{new Date(user.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1 md:space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetailsDialog(user);
                            }} 
                            className="text-primary hover:text-primary/80 h-8 w-8 md:h-9 md:w-auto p-0 md:px-3"
                          >
                            <Eye className="w-3 h-3 md:w-4 md:h-4" />
                            <span className="hidden md:inline ml-1">Détails</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(user);
                            }} 
                            disabled={!isAdmin}
                            className="text-blue-600 hover:text-blue-700 h-8 w-8 md:h-9 md:w-auto p-0 md:px-3"
                          >
                            <Edit className="w-3 h-3 md:w-4 md:h-4" />
                            <span className="hidden md:inline ml-1">Modifier</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteUser(user.id);
                            }} 
                            disabled={!isAdmin}
                            className="text-destructive hover:text-destructive h-8 w-8 md:h-9 md:w-auto p-0 md:px-3"
                          >
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
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">Affichage {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} sur {filteredUsers.length} utilisateurs</div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>Précédent</Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) { pageNum = i + 1; }
                    else if (currentPage <= 3) { pageNum = i + 1; }
                    else if (currentPage >= totalPages - 2) { pageNum = totalPages - 4 + i; }
                    else { pageNum = currentPage - 2 + i; }
                    return (<Button key={pageNum} variant={currentPage === pageNum ? 'default' : 'outline'} size="sm" onClick={() => setCurrentPage(pageNum)} className="w-8 h-8 p-0">{pageNum}</Button>);
                  })}
                </div>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>Suivant</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AdminDetailsDialog
        isOpen={isDetailsOpen}
        onClose={closeDetailsDialog}
        title={`${viewingUser?.first_name || ''} ${viewingUser?.last_name || ''}`}
        data={viewingUser}
        type="user"
      />
    </div>
  );
}
