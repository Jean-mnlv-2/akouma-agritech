import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
// api client not used directly - fetch used instead
import { 
  Loader2, 
  Download, 
  Search, 
  Users, 
  Calendar,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

interface Enrollment {
  id: string;
  name: string;
  email: string;
  country: string | null;
  phone: string | null;
  created_at: string;
}

export default function AdminElearningEnrollments() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const { toast } = useToast();

  const fetchEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/elearning_enrollments', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch enrollments');
      const { data } = await res.json();
      const list = (data as any[]) || [];
      list.sort((a, b) => {
        const aVal = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bVal = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bVal - aVal;
      });
      setEnrollments(list as any);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les inscriptions', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchEnrollments(); }, [fetchEnrollments]);

  useEffect(() => { setCurrentPage(1); }, [search, countryFilter]);

  const filteredEnrollments = enrollments.filter(enrollment => {
    const matchesSearch = search.trim() === '' || 
      enrollment.name.toLowerCase().includes(search.toLowerCase()) ||
      enrollment.email.toLowerCase().includes(search.toLowerCase());
    const matchesCountry = countryFilter === 'all' || 
      (countryFilter === 'with_country' && enrollment.country) ||
      (countryFilter === 'without_country' && !enrollment.country) ||
      enrollment.country === countryFilter;
    return matchesSearch && matchesCountry;
  });

  const countries = Array.from(new Set(enrollments.map(e => e.country).filter(Boolean).sort()));

  const totalPages = Math.ceil(filteredEnrollments.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedEnrollments = filteredEnrollments.slice(startIndex, startIndex + pageSize);

  const exportToCSV = () => {
    const headers = ['Nom', 'Email', 'Pays', 'Téléphone', 'Date d\'inscription'];
    const csvContent = [
      headers.join(','),
      ...filteredEnrollments.map(e => [
        `"${e.name}"`,
        `"${e.email}"`,
        `"${e.country || ''}"`,
        `"${e.phone || ''}"`,
        `"${new Date(e.created_at).toLocaleDateString('fr-FR')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inscriptions-elearning-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Export réussi', description: `${filteredEnrollments.length} inscriptions exportées` });
  };

  if (loading) {
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
            <Users className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
            <span>Inscriptions E-Learning</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mt-1">Gérer les inscriptions à la plateforme E-Learning</p>
          <p className="text-sm text-primary mt-1">{filteredEnrollments.length} inscription(s) trouvée(s)</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <Button onClick={exportToCSV} className="flex items-center space-x-2"><Download className="w-4 h-4" /><span>Exporter CSV</span></Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2"><Users className="w-4 h-4 md:w-5 md:h-5" /><span>Inscriptions ({filteredEnrollments.length})</span></CardTitle>
          <CardDescription>Liste de toutes les inscriptions à la plateforme E-Learning</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Rechercher (nom, email)" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                </div>
              </div>
              <div className="w-full sm:w-[200px]">
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger><SelectValue placeholder="Filtrer par pays" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les pays</SelectItem>
                    <SelectItem value="with_country">Avec pays</SelectItem>
                    <SelectItem value="without_country">Sans pays</SelectItem>
                    {countries.map(country => country && (<SelectItem key={country} value={country}>{country}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-[800px] sm:min-w-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs md:text-sm">Utilisateur</TableHead>
                    <TableHead className="text-xs md:text-sm hidden md:table-cell">Email</TableHead>
                    <TableHead className="text-xs md:text-sm">Pays</TableHead>
                    <TableHead className="text-xs md:text-sm hidden lg:table-cell">Téléphone</TableHead>
                    <TableHead className="text-xs md:text-sm hidden lg:table-cell">Date d'inscription</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEnrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell className="py-2 md:py-4">
                        <div className="flex items-center space-x-2 md:space-x-3">
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Users className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm md:text-base truncate">{enrollment.name}</div>
                            <div className="text-xs text-muted-foreground truncate md:hidden">{enrollment.email}</div>
                            <div className="text-xs text-muted-foreground hidden md:block">ID: {enrollment.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs md:text-sm hidden md:table-cell"><div className="flex items-center space-x-1"><Mail className="w-3 h-3" /><span>{enrollment.email}</span></div></TableCell>
                      <TableCell>{enrollment.country ? (<div className="flex items-center space-x-1"><MapPin className="w-3 h-3" /><span className="text-xs md:text-sm">{enrollment.country}</span></div>) : (<Badge variant="outline" className="text-xs">Non renseigné</Badge>)}</TableCell>
                      <TableCell className="hidden lg:table-cell">{enrollment.phone ? (<div className="flex items-center space-x-1"><Phone className="w-3 h-3" /><span className="text-xs md:text-sm">{enrollment.phone}</span></div>) : (<Badge variant="outline" className="text-xs">Non renseigné</Badge>)}</TableCell>
                      <TableCell className="hidden lg:table-cell"><div className="flex items-center space-x-1"><Calendar className="w-3 h-3" /><span className="text-xs md:text-sm text-muted-foreground">{new Date(enrollment.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">Affichage {startIndex + 1}-{Math.min(startIndex + pageSize, filteredEnrollments.length)} sur {filteredEnrollments.length} inscriptions</div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>Précédent</Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1; else if (currentPage <= 3) pageNum = i + 1; else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i; else pageNum = currentPage - 2 + i;
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
