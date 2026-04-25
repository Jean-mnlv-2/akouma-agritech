import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/integrations/api/client';
import { useQuery } from '@tanstack/react-query';
import { 
  Loader2, 
  Download, 
  Search, 
  Users, 
  Calendar,
  Phone,
  BookOpen,
  X,
  Info
} from 'lucide-react';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

interface Enrollment {
  id: number;
  userId: string;
  courseId: number;
  enrolledAt: string;
  progress: number;
  professionalActivity?: string;
  organization?: string;
  sector?: string;
  experienceLevel?: string;
  expectations?: string;
  user: {
    fullName: string | null;
    email: string;
    phone: string | null;
  };
  course: {
    title: string;
  };
}

interface AdminElearningEnrollmentsProps {
  initialCourseId?: number | null;
  onClearFilter?: () => void;
}

export default function AdminElearningEnrollments({ initialCourseId, onClearFilter }: AdminElearningEnrollmentsProps) {
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const { toast } = useToast();

  const { data: enrollments = [], isLoading } = useQuery<Enrollment[]>({
    queryKey: ['admin', 'elearning-enrollments'],
    queryFn: async () => {
      const res = await api.request('GET', '/api/elearning_enrollments');
      const data = res.data || [];
      const list = (data as Enrollment[]) || [];
      return list.sort((a, b) => {
        const aVal = a.enrolledAt ? new Date(a.enrolledAt).getTime() : 0;
        const bVal = b.enrolledAt ? new Date(b.enrolledAt).getTime() : 0;
        return bVal - aVal;
      });
    },
    staleTime: 30000,
  });

  // Handle initial filter from props
  useEffect(() => {
    if (initialCourseId && enrollments.length > 0) {
      const course = enrollments.find(e => Number(e.courseId) === Number(initialCourseId));
      if (course?.course?.title) {
        setCourseFilter(course.course.title);
      }
    }
  }, [initialCourseId, enrollments]);

  useEffect(() => { setCurrentPage(1); }, [search, courseFilter]);

  const filteredEnrollments = useMemo(() => {
    return enrollments.filter(enrollment => {
      const userName = enrollment.user?.fullName || '';
      const userEmail = enrollment.user?.email || '';
      const courseTitle = enrollment.course?.title || '';
      
      const matchesSearch = search.trim() === '' || 
        userName.toLowerCase().includes(search.toLowerCase()) ||
        userEmail.toLowerCase().includes(search.toLowerCase()) ||
        courseTitle.toLowerCase().includes(search.toLowerCase());
        
      const matchesCourse = courseFilter === 'all' || 
        enrollment.course?.title === courseFilter;
        
      return matchesSearch && matchesCourse;
    });
  }, [enrollments, search, courseFilter]);

  const courseList = useMemo(() => {
    return Array.from(new Set(enrollments.map(e => e.course?.title).filter(Boolean).sort()));
  }, [enrollments]);

  const totalPages = Math.ceil(filteredEnrollments.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedEnrollments = filteredEnrollments.slice(startIndex, startIndex + pageSize);

  const exportToCSV = () => {
    if (filteredEnrollments.length === 0) return;
    
    const headers = ['Utilisateur', 'Email', 'Cours', 'Téléphone', 'Progrès', 'Date d\'inscription'];
    const csvContent = [
      headers.join(','),
      ...filteredEnrollments.map(e => [
        `"${String(e.user?.fullName || 'Utilisateur inconnu').replace(/"/g, '""')}"`,
        `"${String(e.user?.email || '').replace(/"/g, '""')}"`,
        `"${String(e.course?.title || 'Cours inconnu').replace(/"/g, '""')}"`,
        `"${String(e.user?.phone || '').replace(/"/g, '""')}"`,
        `"${e.progress}%"`,
        `"${new Date(e.enrolledAt).toLocaleDateString('fr-FR')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-xl md:text-2xl font-bold flex items-center space-x-2">
            <Users className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
            <span>Inscriptions E-Learning</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mt-1">Gérer les inscriptions à la plateforme E-Learning</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="font-mono">{filteredEnrollments.length} inscription(s)</Badge>
            {courseFilter !== 'all' && (
              <Badge variant="outline" className="flex items-center gap-1 bg-primary/5 border-primary/20">
                Filtré par: {courseFilter}
                <X 
                  className="w-3 h-3 cursor-pointer hover:text-destructive" 
                  onClick={() => {
                    setCourseFilter('all');
                    if (onClearFilter) onClearFilter();
                  }} 
                />
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <Button 
            variant="outline"
            onClick={exportToCSV} 
            disabled={filteredEnrollments.length === 0}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Exporter CSV</span>
          </Button>
        </div>
      </div>
      
      <Card className="border-primary/10 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            Recherche et Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher par nom, email ou titre de cours..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  className="pl-10 focus-visible:ring-primary" 
                />
              </div>
            </div>
            <div className="w-full sm:w-[250px]">
              <Select value={courseFilter} onValueChange={(val) => {
                setCourseFilter(val);
                if (val === 'all' && onClearFilter) onClearFilter();
              }}>
                <SelectTrigger className="focus:ring-primary">
                  <SelectValue placeholder="Filtrer par cours" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les cours</SelectItem>
                  {courseList.map(course => course && (<SelectItem key={course} value={course}>{course}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/5 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-semibold">Utilisateur</TableHead>
                  <TableHead className="font-semibold">Cours</TableHead>
                  <TableHead className="font-semibold">Progrès</TableHead>
                  <TableHead className="font-semibold hidden lg:table-cell">Contact</TableHead>
                  <TableHead className="font-semibold">Infos Pro</TableHead>
                  <TableHead className="font-semibold hidden lg:table-cell">Date d'inscription</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEnrollments.length > 0 ? (
                  paginatedEnrollments.map((enrollment) => (
                    <TableRow key={enrollment.id} className="hover:bg-muted/30 transition-colors group">
                      <TableCell className="py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/5">
                            <Users className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-sm truncate text-foreground">{enrollment.user?.fullName || 'Sans nom'}</div>
                            <div className="text-xs text-muted-foreground truncate">{enrollment.user?.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded bg-secondary/30">
                            <BookOpen className="w-3.5 h-3.5 text-primary/70" />
                          </div>
                          <span className="text-sm font-medium">{enrollment.course?.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5 min-w-[100px]">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Avancement</span>
                            <span className="text-xs font-mono font-bold text-primary">{enrollment.progress}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                enrollment.progress === 100 ? 'bg-green-500' : 
                                enrollment.progress > 50 ? 'bg-primary' : 'bg-orange-400'
                              }`}
                              style={{ width: `${enrollment.progress}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {enrollment.user?.phone ? (
                          <div className="flex items-center space-x-2 text-muted-foreground">
                            <Phone className="w-3.5 h-3.5" />
                            <span className="text-sm">{enrollment.user.phone}</span>
                          </div>
                        ) : (
                          <span className="text-xs italic text-muted-foreground/60">Non renseigné</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 min-w-[150px]">
                          <div className="flex items-center gap-2">
                            {enrollment.professionalActivity && (
                              <div className="flex items-center gap-1.5">
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 bg-primary/5 text-primary border-primary/20">Activité</Badge>
                                <span className="text-xs font-medium truncate max-w-[100px]">{enrollment.professionalActivity}</span>
                              </div>
                            )}
                            
                            {(enrollment.organization || enrollment.sector || enrollment.expectations) && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button className="p-0.5 rounded-full hover:bg-muted transition-colors">
                                      <Info className="w-3 h-3 text-muted-foreground" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="p-3 max-w-[250px] space-y-2">
                                    {enrollment.organization && (
                                      <div>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Organisation</p>
                                        <p className="text-xs">{enrollment.organization}</p>
                                      </div>
                                    )}
                                    {enrollment.sector && (
                                      <div>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Secteur</p>
                                        <p className="text-xs">{enrollment.sector}</p>
                                      </div>
                                    )}
                                    {enrollment.expectations && (
                                      <div>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Attentes</p>
                                        <p className="text-xs italic">{enrollment.expectations}</p>
                                      </div>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>

                          {enrollment.experienceLevel && (
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 bg-secondary/10 text-secondary-foreground border-secondary/20">Niveau</Badge>
                              <span className="text-xs font-medium">{
                                enrollment.experienceLevel === 'beginner' ? 'Débutant' :
                                enrollment.experienceLevel === 'intermediate' ? 'Intermédiaire' :
                                enrollment.experienceLevel === 'expert' ? 'Expert' : enrollment.experienceLevel
                              }</span>
                            </div>
                          )}
                          
                          {(!enrollment.professionalActivity && !enrollment.experienceLevel && !enrollment.organization && !enrollment.sector && !enrollment.expectations) && (
                            <span className="text-xs italic text-muted-foreground/60">Aucune info pro</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-sm">
                            {new Date(enrollment.enrolledAt).toLocaleDateString('fr-FR', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2">
                        <Search className="w-10 h-10 opacity-20" />
                        <p className="font-medium">Aucune inscription trouvée</p>
                        <p className="text-sm">Essayez de modifier vos filtres ou votre recherche</p>
                        <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setCourseFilter('all'); if (onClearFilter) onClearFilter(); }}>
                          Réinitialiser les filtres
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 px-1">
          <div className="text-sm text-muted-foreground order-2 sm:order-1">
            Affichage de <span className="font-medium text-foreground">{startIndex + 1}</span> à <span className="font-medium text-foreground">{Math.min(startIndex + pageSize, filteredEnrollments.length)}</span> sur <span className="font-medium text-foreground">{filteredEnrollments.length}</span> inscriptions
          </div>
          <div className="flex items-center space-x-2 order-1 sm:order-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} 
              disabled={currentPage === 1}
              className="h-8"
            >
              Précédent
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) pageNum = i + 1; 
                else if (currentPage <= 3) pageNum = i + 1; 
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i; 
                else pageNum = currentPage - 2 + i;
                
                return (
                  <Button 
                    key={pageNum} 
                    variant={currentPage === pageNum ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setCurrentPage(pageNum)} 
                    className={`w-8 h-8 p-0 ${currentPage === pageNum ? 'shadow-sm' : ''}`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} 
              disabled={currentPage === totalPages}
              className="h-8"
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
