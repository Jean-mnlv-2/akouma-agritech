import { useEffect, useState, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/SEO";
import { api } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, Play, CheckCircle, Calendar, Award, Clock,
  AlertTriangle, ShieldCheck, ShieldAlert, ExternalLink, Loader2, Trophy, Search, Filter
} from "lucide-react";
import { isWithinInterval, startOfMonth, startOfYear, subMonths } from "date-fns";
import { deriveCourseStatus, ABSENCE_PENALTY } from "@/lib/elearningFormat";
import { ErrorState } from "@/components/elearning/ErrorState";


interface Enrollment {
  id: number;
  userId: string;
  courseId: number;
  progress: number;
  enrolledAt: string;
  completedAt?: string | null;
  course?: { id: number; title: string; slug?: string; thumbnailUrl?: string; level?: string; duration?: number };
}

interface Schedule {
  id: number;
  courseId: number;
  scheduledDate: string;
  timeSlot: string;
  status: 'scheduled' | 'attended' | 'absent';
  course?: { id: number; title: string; slug?: string };
}

interface Certificate {
  id: number;
  courseId: number;
  certificateNumber: string;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  attempts: number;
  lastError?: string | null;
  credentialUrl?: string | null;
  issuedAt?: string | null;
  course?: { id: number; title: string; slug?: string };
}

const ITEMS_PER_PAGE = 6;

const MyCourses = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<{ id: string; fullName?: string; email?: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [requestingCourseId, setRequestingCourseId] = useState<number | null>(null);
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");

  // Pagination state
  const [activePage, setActivePage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const [attendancePage, setAttendancePage] = useState(1);
  const [certificatesPage, setCertificatesPage] = useState(1);

  // For certificate status tracking
  const prevCertsStatusRef = useRef<Record<number, string>>({});

  const { data: enrollments = [], isLoading: loadingEnrollments, isError: enrollmentsError, refetch: refetchEnrollments } = useQuery<Enrollment[]>({
    queryKey: ['my-courses', 'enrollments', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const res = await api.request('GET', '/api/elearning_enrollments');
      const all = res?.data || [];
      return all.filter((e: Enrollment) => e.userId === user!.id);
    },
  });

  const { data: schedules = [], isLoading: loadingSchedules, isError: schedulesError, refetch: refetchSchedules } = useQuery<Schedule[]>({
    queryKey: ['my-courses', 'schedules', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const res = await api.request('GET', '/api/course_schedules/my');
      return res?.data || [];
    },
  });

  const { data: certificates = [], isLoading: loadingCertificates, isError: certificatesError, refetch: refetchCerts } = useQuery<Certificate[]>({
    queryKey: ['my-courses', 'certificates', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const res = await api.request('GET', '/api/certificates/my');
      return res?.data || [];
    },
    refetchInterval: (q) => {
      const list = (q.state.data as Certificate[] | undefined) || [];
      const inFlight = list.some(c => c.status === 'pending' || c.status === 'processing');
      return inFlight ? 5000 : 30000;
    },
    refetchOnWindowFocus: true,
  });

  // Helper functions and Hooks before early returns
  const certByCourse = (courseId: number) => certificates.find(c => c.courseId === courseId);

  const allCourseTitles = useMemo(() => {
    const titles = new Set<string>();
    enrollments.forEach(e => { if (e.course?.title) titles.add(e.course.title); });
    return Array.from(titles);
  }, [enrollments]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.auth.getUser();
        if (!data?.user) { navigate('/auth'); return; }
        setUser(data.user);
      } catch { navigate('/auth'); }
      finally { setAuthLoading(false); }
    })();
  }, [navigate]);

  // Track certificate status changes for notifications
  useEffect(() => {
    if (certificates.length > 0) {
      certificates.forEach(cert => {
        const prevStatus = prevCertsStatusRef.current[cert.id];
        if (prevStatus && prevStatus !== cert.status) {
          if (cert.status === 'sent') {
            toast({
              title: "Certificat émis ! 🎓",
              description: `Votre certificat pour "${cert.course?.title}" est maintenant disponible.`,
              className: "bg-green-50 border-green-200",
            });
          } else if (cert.status === 'failed') {
            toast({
              title: "Échec de l'émission ⚠️",
              description: `L'émission du certificat pour "${cert.course?.title}" a échoué. Veuillez réessayer.`,
              variant: "destructive",
            });
          }
        }
      });

      // Update ref with current statuses
      const newStatusMap: Record<number, string> = {};
      certificates.forEach(c => {
        newStatusMap[c.id] = c.status;
      });
      prevCertsStatusRef.current = newStatusMap;
    }
  }, [certificates, toast]);

  const requestCertificate = async (enrollment: Enrollment) => {
    const existing = certByCourse(enrollment.courseId);
    if (existing && (existing.status === 'pending' || existing.status === 'processing' || existing.status === 'sent')) {
      toast({
        title: 'Déjà en cours',
        description: existing.status === 'sent'
          ? 'Ce certificat a déjà été émis.'
          : 'Une émission est déjà en cours pour ce cours.',
      });
      return;
    }
    if (requestingCourseId !== null) return;
    setRequestingCourseId(enrollment.courseId);
    try {
      // Score réel moyen des quiz du cours (jamais une valeur fabriquée) —
      // omis si le cours n'a aucun module quiz noté.
      let score: number | undefined;
      try {
        const progRes = await api.request('GET', `/api/course_modules/progress/${enrollment.id}`);
        const quizScores: number[] = (progRes?.data || [])
          .map((p: { quizScore?: number | null }) => p.quizScore)
          .filter((s: number | null | undefined): s is number => typeof s === 'number');
        if (quizScores.length > 0) {
          score = Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length);
        }
      } catch { /* pas de score disponible, on soumet sans */ }

      await api.request('POST', '/api/certificates/request', {
        body: { courseId: enrollment.courseId, ...(score !== undefined ? { score } : {}) },
      });
      toast({ title: 'Émission lancée', description: 'Votre certificat a été ajouté à la file. Vous serez notifié par email.' });
      refetchCerts();
    } catch (e) {
      toast({
        title: 'Erreur',
        description: e instanceof Error ? e.message : 'Impossible de demander le certificat.',
        variant: 'destructive',
      });
    } finally {
      setRequestingCourseId(null);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="large" text="Chargement..." /></div>;
  }

  // Filtering Logic
  const applyFilters = <T extends { course?: { title: string }; enrolledAt?: string; scheduledDate?: string; status?: string }>(items: T[]) => {
    return items.filter(item => {
      const matchesSearch = !searchQuery || 
        item.course?.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      const dateStr = item.enrolledAt || item.scheduledDate;
      const date = dateStr ? new Date(dateStr) : null;
      let matchesPeriod = true;
      if (date && periodFilter !== "all") {
        const now = new Date();
        if (periodFilter === "month") {
          matchesPeriod = isWithinInterval(date, { start: startOfMonth(now), end: now });
        } else if (periodFilter === "year") {
          matchesPeriod = isWithinInterval(date, { start: startOfYear(now), end: now });
        } else if (periodFilter === "last3") {
          matchesPeriod = isWithinInterval(date, { start: subMonths(now, 3), end: now });
        }
      }

      let matchesStatus = true;
      if (statusFilter !== "all") {
        matchesStatus = item.status === statusFilter;
      }

      let matchesCourse = true;
      if (courseFilter !== "all") {
        matchesCourse = item.course?.title === courseFilter;
      }

      return matchesSearch && matchesPeriod && matchesStatus && matchesCourse;
    });
  };

  const active = applyFilters(enrollments.filter(e => deriveCourseStatus(e) === 'active'));
  const completed = applyFilters(enrollments.filter(e => deriveCourseStatus(e) === 'completed'));
  const filteredSchedules = applyFilters(schedules);
  const filteredCertificates = applyFilters(certificates);

  // Pagination Slicing
  const paginate = <T,>(items: T[], page: number) => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  };

  const paginatedActive = paginate(active, activePage);
  const paginatedCompleted = paginate(completed, completedPage);
  const paginatedSchedules = paginate(filteredSchedules, attendancePage);
  const paginatedCertificates = paginate(filteredCertificates, certificatesPage);

  // Attendance stats
  const totalAttended = schedules.filter(s => s.status === 'attended').length;
  const totalAbsent = schedules.filter(s => s.status === 'absent').length;
  const totalScheduled = schedules.filter(s => s.status === 'scheduled').length;

  const renderSkeletonGrid = (count = 3) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border overflow-hidden bg-card">
          <Skeleton className="h-40 w-full" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderPagination = (totalItems: number, currentPage: number, setPage: (p: number) => void) => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center items-center gap-2 mt-8">
        <Button 
          variant="outline" 
          size="sm" 
          disabled={currentPage === 1}
          onClick={() => setPage(currentPage - 1)}
        >
          Précédent
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {currentPage} sur {totalPages}
        </span>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={currentPage === totalPages}
          onClick={() => setPage(currentPage + 1)}
        >
          Suivant
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Mes cours - KILIMO"
        description="Vos cours, progressions, présences et certificats"
        path={window.location.origin + '/my-courses'}
      />
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Mes cours</h1>
          <p className="text-muted-foreground text-lg">Suivez vos progressions, présences et certificats</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {[
            { icon: BookOpen, label: 'Cours actifs', value: enrollments.filter(e => deriveCourseStatus(e) === 'active').length, color: 'from-blue-500 to-cyan-500' },
            { icon: CheckCircle, label: 'Cours complétés', value: enrollments.filter(e => deriveCourseStatus(e) === 'completed').length, color: 'from-green-500 to-emerald-500' },
            { icon: Calendar, label: 'Présences', value: `${totalAttended}/${totalAttended + totalAbsent + totalScheduled}`, color: 'from-purple-500 to-pink-500' },
            { icon: Award, label: 'Certificats émis', value: certificates.filter(c => c.status === 'sent').length, color: 'from-yellow-500 to-orange-500' },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className={`w-10 h-10 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold">{s.value}</span>
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher un cours..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setActivePage(1);
                setCompletedPage(1);
                setAttendancePage(1);
                setCertificatesPage(1);
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={courseFilter} onValueChange={(v) => { setCourseFilter(v); setActivePage(1); }}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-3 h-3 mr-2" />
                <SelectValue placeholder="Par cours" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les cours</SelectItem>
                {allCourseTitles.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={periodFilter} onValueChange={(v) => { setPeriodFilter(v); setActivePage(1); }}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="w-3 h-3 mr-2" />
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les dates</SelectItem>
                <SelectItem value="month">Ce mois-ci</SelectItem>
                <SelectItem value="last3">3 derniers mois</SelectItem>
                <SelectItem value="year">Cette année</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="active">
          <div className="overflow-x-auto -mx-4 px-4 pb-1">
            <TabsList className="inline-flex w-auto md:w-full md:grid md:grid-cols-4 md:max-w-2xl">
              <TabsTrigger value="active" className="whitespace-nowrap">En cours ({active.length})</TabsTrigger>
              <TabsTrigger value="completed" className="whitespace-nowrap">Complétés ({completed.length})</TabsTrigger>
              <TabsTrigger value="attendance" className="whitespace-nowrap">Présences ({filteredSchedules.length})</TabsTrigger>
              <TabsTrigger value="certificates" className="whitespace-nowrap">Certificats ({filteredCertificates.length})</TabsTrigger>
            </TabsList>
          </div>

          {/* ACTIVE */}
          <TabsContent value="active" className="mt-6">
            {loadingEnrollments ? (
              renderSkeletonGrid(3)
            ) : enrollmentsError ? (
              <ErrorState description="Impossible de charger vos cours en cours." onRetry={() => refetchEnrollments()} />
            ) : active.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="mb-4">Aucun cours trouvé avec ces filtres.</p>
                {searchQuery || courseFilter !== "all" || periodFilter !== "all" ? (
                  <Button variant="outline" onClick={() => {
                    setSearchQuery("");
                    setCourseFilter("all");
                    setPeriodFilter("all");
                  }}>Réinitialiser les filtres</Button>
                ) : (
                  <Button asChild><Link to="/elearning">Découvrir les cours</Link></Button>
                )}
              </CardContent></Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedActive.map(e => (
                    <Card key={e.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      {e.course?.thumbnailUrl && (
                        <div className="h-40 overflow-hidden">
                          <img src={e.course.thumbnailUrl} alt={e.course.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{e.course?.level || '—'}</Badge>
                          <span className="text-xs text-muted-foreground">{e.progress}%</span>
                        </div>
                        <h3 className="font-semibold mb-2 line-clamp-2 min-h-[3rem]">{e.course?.title}</h3>
                        <Progress value={e.progress} className="h-2 mb-3" />
                        <Button className="w-full" size="sm" onClick={() => navigate(`/elearning/${e.courseId}/learn`)}>
                          <Play className="w-4 h-4 mr-2" /> Continuer
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {renderPagination(active.length, activePage, setActivePage)}
              </>
            )}
          </TabsContent>

          {/* COMPLETED */}
          <TabsContent value="completed" className="mt-6">
            {loadingEnrollments ? (
              renderSkeletonGrid(2)
            ) : enrollmentsError ? (
              <ErrorState description="Impossible de charger vos cours complétés." onRetry={() => refetchEnrollments()} />
            ) : completed.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Aucun cours terminé correspondant aux critères.</p>
              </CardContent></Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paginatedCompleted.map(e => {
                    const cert = certByCourse(e.courseId);
                    return (
                      <Card key={e.id} className="border-yellow-200 bg-gradient-to-br from-yellow-50/50 to-orange-50/30 dark:from-yellow-950/10 dark:to-orange-950/5">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <Trophy className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold">{e.course?.title}</h3>
                              <p className="text-xs text-muted-foreground">
                                Complété le {e.completedAt ? new Date(e.completedAt).toLocaleDateString('fr-FR') : '—'}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {cert?.status === 'sent' ? (
                              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
                                <ShieldCheck className="w-3 h-3 mr-1" /> Certificat émis
                              </Badge>
                            ) : cert?.status === 'failed' ? (
                              <Badge variant="destructive">
                                <ShieldAlert className="w-3 h-3 mr-1" /> Émission échouée
                              </Badge>
                            ) : cert ? (
                              <Badge variant="secondary">
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" /> En cours d'émission
                              </Badge>
                            ) : null}
                          </div>
                          <div className="mt-3 flex gap-2">
                            {!cert || cert.status === 'failed' ? (
                              <Button size="sm" onClick={() => requestCertificate(e)} disabled={requestingCourseId === e.courseId}>
                                {requestingCourseId === e.courseId ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Award className="w-4 h-4 mr-2" />}
                                Demander le certificat
                              </Button>
                            ) : null}
                            {cert?.credentialUrl && (
                              <Button asChild size="sm" variant="outline">
                                <a href={cert.credentialUrl} target="_blank" rel="noreferrer">
                                  <ExternalLink className="w-4 h-4 mr-2" /> Voir
                                </a>
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => navigate(`/elearning/${e.courseId}/learn`)}>
                              Revoir
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                {renderPagination(completed.length, completedPage, setCompletedPage)}
              </>
            )}
          </TabsContent>

          {/* ATTENDANCE */}
          <TabsContent value="attendance" className="mt-6 space-y-4">
            {loadingSchedules ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : schedulesError ? (
              <ErrorState description="Impossible de charger vos présences." onRetry={() => refetchSchedules()} />
            ) : (
              <>
                {totalAbsent >= ABSENCE_PENALTY.THRESHOLD && (
                  <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
                    <CardContent className="p-4 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-amber-900 dark:text-amber-200">Attention : {totalAbsent} absences enregistrées</p>
                        <p className="text-amber-800 dark:text-amber-300 mt-1">Une pénalité de {ABSENCE_PENALTY.PERCENT_PER_ABSENCE}% par absence supplémentaire est appliquée à votre progression.</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2"><Calendar className="w-5 h-5" /> Mes sessions</CardTitle>
                      <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setAttendancePage(1); }}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous</SelectItem>
                          <SelectItem value="scheduled">Programmé</SelectItem>
                          <SelectItem value="attended">Présent</SelectItem>
                          <SelectItem value="absent">Absent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {filteredSchedules.length === 0 ? (
                      <p className="text-center text-muted-foreground py-6">Aucune session trouvée.</p>
                    ) : (
                      <div className="space-y-2">
                        {paginatedSchedules.map(s => (
                          <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{s.course?.title || 'Cours'}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                                <Clock className="w-3 h-3" />
                                {new Date(s.scheduledDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} — {s.timeSlot}
                              </p>
                            </div>
                            <Badge variant={s.status === 'attended' ? 'default' : s.status === 'absent' ? 'destructive' : 'secondary'}>
                              {s.status === 'attended' ? 'Présent' : s.status === 'absent' ? 'Absent' : 'Programmé'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                    {renderPagination(filteredSchedules.length, attendancePage, setAttendancePage)}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* CERTIFICATES */}
          <TabsContent value="certificates" className="mt-6">
            {loadingCertificates ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))}
              </div>
            ) : certificatesError ? (
              <ErrorState description="Impossible de charger vos certificats." onRetry={() => refetchCerts()} />
            ) : filteredCertificates.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">
                <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Aucun certificat trouvé.</p>
              </CardContent></Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paginatedCertificates.map(c => {
                    const apiBase = (import.meta as any).env?.VITE_API_BASE_URL
                      || (window.location.hostname === 'kilimo.onrender.com' ? 'https://kilimo-backend.onrender.com' : window.location.origin);
                    const pdfUrl = `${apiBase}/api/certificates/${c.id}/pdf`;
                    const verifyUrl = `${window.location.origin}/certificates/verify/${encodeURIComponent(c.certificateNumber)}`;
                    return (
                    <Card key={c.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{c.course?.title}</h3>
                          {c.status === 'sent' ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300"><ShieldCheck className="w-3 h-3 mr-1" />Émis</Badge>
                          ) : c.status === 'failed' ? (
                            <Badge variant="destructive"><ShieldAlert className="w-3 h-3 mr-1" />Échec</Badge>
                          ) : (
                            <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" />En cours</Badge>
                          )}
                        </div>
                        <p className="text-xs font-mono text-muted-foreground mb-3">N° {c.certificateNumber}</p>
                        {c.lastError && c.status === 'failed' && (
                          <p className="text-xs text-destructive mb-2">{c.lastError}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {c.status === 'sent' && (
                            <Button asChild size="sm" className="flex-1">
                              <a href={pdfUrl} target="_blank" rel="noreferrer">📄 Télécharger le PDF</a>
                            </Button>
                          )}
                          {c.credentialUrl && (
                            <Button asChild size="sm" variant="outline" className="flex-1">
                              <a href={c.credentialUrl} target="_blank" rel="noreferrer">
                                <ExternalLink className="w-4 h-4 mr-2" /> Sertifier
                              </a>
                            </Button>
                          )}
                          {c.status === 'sent' && (
                            <Button asChild size="sm" variant="outline" className="flex-1">
                              <a href={verifyUrl} target="_blank" rel="noreferrer">🔗 Vérifier</a>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    );
                  })}
                </div>
                {renderPagination(filteredCertificates.length, certificatesPage, setCertificatesPage)}
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default MyCourses;
