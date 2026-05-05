import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Skeleton } from "@/components/ui/skeleton";
import TitleManager from "@/components/TitleManager";
import { api } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, Play, CheckCircle, Calendar, Award, Clock,
  AlertTriangle, ShieldCheck, ShieldAlert, ExternalLink, Loader2, Trophy
} from "lucide-react";

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

const MyCourses = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<{ id: string; fullName?: string; email?: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [requestingCourseId, setRequestingCourseId] = useState<number | null>(null);

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

  const { data: enrollments = [], isLoading: loadingEnrollments } = useQuery<Enrollment[]>({
    queryKey: ['my-courses', 'enrollments', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const res = await api.request('GET', '/api/elearning_enrollments');
      const all = res?.data || [];
      return all.filter((e: Enrollment) => e.userId === user!.id);
    },
  });

  const { data: schedules = [] } = useQuery<Schedule[]>({
    queryKey: ['my-courses', 'schedules', user?.id],
    enabled: !!user,
    queryFn: async () => {
      try {
        const res = await api.request('GET', '/api/course_schedules/my');
        return res?.data || [];
      } catch { return []; }
    },
  });

  const { data: certificates = [], refetch: refetchCerts } = useQuery<Certificate[]>({
    queryKey: ['my-courses', 'certificates', user?.id],
    enabled: !!user,
    queryFn: async () => {
      try {
        const res = await api.request('GET', '/api/certificates/my');
        return res?.data || [];
      } catch { return []; }
    },
    // Adaptive polling: 5s while a cert is in-flight, otherwise 30s.
    refetchInterval: (q) => {
      const list = (q.state.data as Certificate[] | undefined) || [];
      const inFlight = list.some(c => c.status === 'pending' || c.status === 'processing');
      return inFlight ? 5000 : 30000;
    },
    refetchOnWindowFocus: true,
  });

  const requestCertificate = async (enrollment: Enrollment) => {
    // Anti-doublon front-end: bail if already in queue or sent
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
      await api.request('POST', '/api/certificates/request', {
        body: { courseId: enrollment.courseId, score: 100 },
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

  const active = enrollments.filter(e => (e.progress ?? 0) < 100 && !e.completedAt);
  const completed = enrollments.filter(e => (e.progress ?? 0) >= 100 || !!e.completedAt);

  // Attendance stats
  const totalAttended = schedules.filter(s => s.status === 'attended').length;
  const totalAbsent = schedules.filter(s => s.status === 'absent').length;
  const totalScheduled = schedules.filter(s => s.status === 'scheduled').length;

  const certByCourse = (courseId: number) => certificates.find(c => c.courseId === courseId);

  return (
    <div className="min-h-screen bg-background">
      <TitleManager
        title="Mes cours - KILIMO"
        description="Vos cours, progressions, présences et certificats"
        canonical={window.location.origin + '/my-courses'}
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
            { icon: BookOpen, label: 'Cours actifs', value: active.length, color: 'from-blue-500 to-cyan-500' },
            { icon: CheckCircle, label: 'Cours complétés', value: completed.length, color: 'from-green-500 to-emerald-500' },
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

        <Tabs defaultValue="active">
          <div className="overflow-x-auto -mx-4 px-4 pb-1">
            <TabsList className="inline-flex w-auto md:w-full md:grid md:grid-cols-4 md:max-w-2xl">
              <TabsTrigger value="active" className="whitespace-nowrap">En cours</TabsTrigger>
              <TabsTrigger value="completed" className="whitespace-nowrap">Complétés</TabsTrigger>
              <TabsTrigger value="attendance" className="whitespace-nowrap">Présences</TabsTrigger>
              <TabsTrigger value="certificates" className="whitespace-nowrap">Certificats</TabsTrigger>
            </TabsList>
          </div>

          {/* ACTIVE */}
          <TabsContent value="active" className="mt-6">
            {loadingEnrollments ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
                {Array.from({ length: 3 }).map((_, i) => (
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
            ) : active.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="mb-4">Vous n'avez aucun cours en cours.</p>
                <Button asChild><Link to="/elearning">Découvrir les cours</Link></Button>
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {active.map(e => (
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
            )}
          </TabsContent>

          {/* COMPLETED */}
          <TabsContent value="completed" className="mt-6">
            {completed.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Terminez votre premier cours pour le voir apparaître ici.</p>
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completed.map(e => {
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
            )}
          </TabsContent>

          {/* ATTENDANCE */}
          <TabsContent value="attendance" className="mt-6 space-y-4">
            {totalAbsent >= 3 && (
              <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-amber-900 dark:text-amber-200">Attention : {totalAbsent} absences enregistrées</p>
                    <p className="text-amber-800 dark:text-amber-300 mt-1">Une pénalité de 10% par absence supplémentaire est appliquée à votre progression.</p>
                  </div>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Calendar className="w-5 h-5" /> Mes sessions</CardTitle></CardHeader>
              <CardContent>
                {schedules.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">Aucune session planifiée pour le moment.</p>
                ) : (
                  <div className="space-y-2">
                    {schedules.map(s => (
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* CERTIFICATES */}
          <TabsContent value="certificates" className="mt-6">
            {certificates.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">
                <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Aucun certificat encore. Complétez un cours pour en demander un !</p>
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certificates.map(c => (
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
                      {c.credentialUrl && (
                        <Button asChild size="sm" variant="outline" className="w-full">
                          <a href={c.credentialUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" /> Voir mon certificat Sertifier
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default MyCourses;
