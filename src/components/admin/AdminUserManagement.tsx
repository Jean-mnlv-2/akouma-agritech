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
  UserCheck,
  UserX,
  ShoppingCart
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/integrations/api/client';

const userSchema = z.object({
  email: z.string().email('Email invalide'),
  firstName: z.string().min(2, 'Prénom minimum 2 caractères'),
  lastName: z.string().min(2, 'Nom minimum 2 caractères'),
  role: z.enum(['admin', 'supervisor', 'customer']),
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
};

const STATUS_FILTER = ['all', 'active', 'inactive'] as const;
type StatusFilter = typeof STATUS_FILTER[number];

export function AdminUserManagement() {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { email: '', firstName: '', lastName: '', role: 'customer' },
  });

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
      return api.request('POST', '/api/profiles', { body: { email: payload.email, firstName: payload.firstName, lastName: payload.lastName, role: payload.role } });
    },
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Utilisateur créé avec succès.' });
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

  const handleToggleClick = (user: User) => {
    const willActivate = user.is_active === false;
    if (!willActivate) {
      const confirmed = confirm("Êtes-vous sûr de vouloir désactiver cet utilisateur ?\nIl ne pourra plus se connecter tant qu'il est inactif.");
      if (!confirmed) return;
    }
    toggleUserStatus(user.id, willActivate);
  };

  const updateUserMutation = useMutation({
    mutationFn: async (payload: { id: string; data: UserFormData }) => {
      return api.request('PUT', `/api/profiles/${payload.id}`, { body: { firstName: payload.data.firstName, lastName: payload.data.lastName, email: payload.data.email, role: payload.data.role } });
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
  const toggleUserStatus = (userId: string, makeActive: boolean) => { toggleStatusMutation.mutate({ userId, isActive: makeActive }); };

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
    setEditingUser(user);
    const formRole: UserFormData['role'] = user.role === 'admin' ? 'admin' : user.role === 'supervisor' ? 'supervisor' : 'customer';
    form.reset({ email: user.email, firstName: user.first_name, lastName: user.last_name, role: formRole });
    setIsDialogOpen(true);
  };

  const closeDialog = () => { setEditingUser(undefined); form.reset(); setIsDialogOpen(false); };

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
            <Button variant="outline" disabled={!someVisibleSelectedBool} onClick={() => bulkToggle(true)}>Activer sélection</Button>
            <Button variant="outline" disabled={!someVisibleSelectedBool} onClick={() => bulkToggle(false)}>Désactiver sélection</Button>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2 w-full lg:w-auto">
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
                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={closeDialog} className="w-full sm:w-auto">Annuler</Button>
                    <Button type="submit" disabled={isCreating} className="w-full sm:w-auto">{isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editingUser ? 'Mettre à jour' : 'Créer'}</Button>
                  </div>
                </form>
              </Form>
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
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox checked={selectedIds.has(user.id)} onCheckedChange={(c) => toggleSelectOne(user.id, c)} aria-label={`Sélectionner ${user.email}`} />
                      </TableCell>
                      <TableCell className="py-2 md:py-4">
                        <div className="flex items-center space-x-2 md:space-x-3">
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {user.role === 'admin' ? (
                              <Crown className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                            ) : user.role === 'supervisor' ? (
                              <Shield className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                            ) : (
                              <ShoppingCart className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                            )}
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
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(user)} className="text-blue-600 hover:text-blue-700 h-8 w-8 md:h-9 md:w-auto p-0 md:px-3"><Edit className="w-3 h-3 md:w-4 md:h-4" /><span className="hidden md:inline ml-1">Modifier</span></Button>
                          <Button variant="outline" size="sm" onClick={() => handleToggleClick(user)} className={`${user.is_active === false ? 'text-green-600 hover:text-green-700' : 'text-amber-600 hover:text-amber-700'} h-8 w-8 md:h-9 md:w-auto p-0 md:px-3`}>
                            {user.is_active === false ? (<><UserCheck className="w-3 h-3 md:w-4 md:h-4" /><span className="hidden md:inline ml-1">Activer</span></>) : (<><UserX className="w-3 h-3 md:w-4 md:h-4" /><span className="hidden md:inline ml-1">Désactiver</span></>)}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => deleteUser(user.id)} className="text-destructive hover:text-destructive h-8 w-8 md:h-9 md:w-auto p-0 md:px-3"><Trash2 className="w-3 h-3 md:w-4 md:h-4" /><span className="hidden md:inline ml-1">Supprimer</span></Button>
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
    </div>
  );
}
