import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import TitleManager from "@/components/TitleManager";
import { api } from "@/integrations/api/client";
import { useI18n } from "@/i18n";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen, Clock, Play, CheckCircle, 
  Trophy, Calendar, Target, Settings, Bell, Zap, CalendarDays
} from "lucide-react";
import kilimoLogo from "@/assets/kilimo-logo.png";
import courseThumbnail from "@/assets/course-thumbnail.jpg";
import CourseScheduleManager from "@/components/elearning/CourseScheduleManager";
import StudentBadges from "@/components/elearning/StudentBadges";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface EnrolledCourse {
  id: string;
  title: string;
  progress: number;
  thumbnail: string;
  level: string;
  totalModules: number;
  completedModules: number;
  lastAccessed: string;
  studyPace?: string;
  targetEndDate?: string;
  remindersEnabled?: boolean;
}


const LearningDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  useI18n();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const queryClient = useQueryClient();

  // Demo data - will be replaced with real API when backend is ready
  const enrolledCourses: EnrolledCourse[] = [
    {
      id: "1",
      title: "Agriculture Moderne & IoT",
      progress: 65,
      thumbnail: courseThumbnail,
      level: "Intermédiaire",
      totalModules: 8,
      completedModules: 5,
      lastAccessed: "2026-02-24",
      studyPace: "standard",
      targetEndDate: "2026-03-15",
      remindersEnabled: true
    },
    {
      id: "2",
      title: "Irrigation Intelligente",
      progress: 30,
      thumbnail: courseThumbnail,
      level: "Débutant",
      totalModules: 6,
      completedModules: 2,
      lastAccessed: "2026-02-23",
      studyPace: "intensive",
      targetEndDate: "2026-03-05",
      remindersEnabled: false
    },
    {
      id: "3",
      title: "Gestion des Maladies des Plantes",
      progress: 100,
      thumbnail: courseThumbnail,
      level: "Avancé",
      totalModules: 10,
      completedModules: 10,
      lastAccessed: "2026-02-20",
    },
  ];


  const stats = {
    totalHours: 47,
    completedModules: 17,
    averageScore: 82,
    activeCourses: 2,
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await api.auth.getUser();
        if (!data?.user) {
          navigate("/auth");
          return;
        }
        setUser(data.user);
      } catch {
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const { data: enrollments = [] } = useQuery<any[]>({
    queryKey: ["learning", "enrollments"],
    enabled: !!user,
    queryFn: async () => {
      try {
        const res = await api.request("GET", "/api/elearning_enrollments");
        const items = Array.isArray(res) ? res : res.data;
        return items || [];
      } catch {
        return [];
      }
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const updateEnrollmentMutation = useMutation({
    mutationFn: async (payload: { id?: number; userId?: string; courseId: number; data: any }) => {
      if (payload.id) {
        return api.request("PUT", `/api/elearning_enrollments/${payload.id}`, { body: payload.data });
      }
      if (payload.userId) {
        return api.request("POST", `/api/elearning_enrollments`, { body: { userId: payload.userId, courseId: payload.courseId } });
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning", "enrollments"] });
    },
  });

  const findEnrollment = (courseId: number) => {
    const uId = user?.id;
    if (!uId) return undefined;
    return (enrollments || []).find((e: any) => String(e.userId) === String(uId) && String(e.courseId) === String(courseId));
  };

  const persistPlan = (courseIdStr: string, changes: Partial<{ studyPace: string; targetEndDate: string; remindersEnabled: boolean }>) => {
    const courseId = Number(courseIdStr);
    const existing = findEnrollment(courseId);
    const uId = user?.id;
    if (existing) {
      updateEnrollmentMutation.mutate({ id: existing.id, courseId, data: changes });
    } else if (uId && !Number.isNaN(courseId)) {
      updateEnrollmentMutation.mutate({ userId: uId, courseId, data: {} });
    }
    try {
      const key = `learning_plan_${courseId}`;
      const current = JSON.parse(localStorage.getItem(key) || "{}");
      localStorage.setItem(key, JSON.stringify({ ...current, ...changes }));
    } catch {}
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "débutant": case "beginner": return "bg-green-100 text-green-800 border-green-300";
      case "intermédiaire": case "intermediate": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "avancé": case "advanced": return "bg-red-100 text-red-800 border-red-300";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const nextSuggestion = (() => {
    const active = enrolledCourses.find(c => c.progress < 100);
    if (!active) return { title: "Aucun module en attente", when: "—" };
    const pace = active.studyPace || "standard";
    const when = pace === "intensive" ? "Aujourd'hui à 18:00" : "Demain à 18:00";
    return { title: "Systèmes d'irrigation intelligente", when };
  })();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Chargement..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TitleManager title="Mon Espace E-Learning - KILIMO" description="Tableau de bord de votre apprentissage" canonical={window.location.origin + "/dashboard/learning"} image={kilimoLogo} />
      <Header />

      <main className="container mx-auto px-4 sm:px-6 py-8">
        {/* Welcome */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Bienvenue, {user?.fullName || user?.email || "Apprenant"} 👋
            </h1>
            <p className="text-muted-foreground text-lg">Continuez votre parcours d'apprentissage</p>
          </div>
          <div className="flex gap-2">
            <Button variant="default" size="sm" className="flex items-center gap-2" onClick={() => navigate('/my-courses')}>
              <BookOpen className="w-4 h-4" /> Mes cours
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> Calendrier
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Settings className="w-4 h-4" /> Paramètres
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="planning">Planification</TabsTrigger>
            <TabsTrigger value="achievements">Succès</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Clock, label: "Heures d'apprentissage", value: `${stats.totalHours}h`, color: "from-blue-500 to-cyan-500" },
                { icon: CheckCircle, label: "Modules complétés", value: String(stats.completedModules), color: "from-green-500 to-emerald-500" },
                { icon: Target, label: "Score moyen", value: `${stats.averageScore}%`, color: "from-yellow-500 to-orange-500" },
                { icon: BookOpen, label: "Cours actifs", value: String(stats.activeCourses), color: "from-purple-500 to-pink-500" },
              ].map((s, i) => (
                <Card key={i} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-6 flex flex-col items-center text-center gap-2">
                    <div className={`w-12 h-12 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center`}>
                      <s.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl sm:text-3xl font-bold text-foreground">{s.value}</span>
                    <span className="text-sm text-muted-foreground">{s.label}</span>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Active Courses */}
            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Play className="w-6 h-6 text-primary" />
                Mes cours en cours
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledCourses.filter(c => c.progress < 100).map((course) => (
                  <Card key={course.id} className="group hover:shadow-lg transition-all overflow-hidden">
                    <div className="relative h-40 overflow-hidden">
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <Badge className={`absolute top-3 left-3 ${getLevelColor(course.level)} text-xs border`}>{course.level}</Badge>
                      <div className="absolute bottom-3 left-3 right-3">
                        <span className="text-white font-semibold text-sm">{course.progress}% complété</span>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-2 line-clamp-2">{course.title}</h3>
                      <Progress value={course.progress} className="h-2 mb-3" />
                      <div className="flex justify-between items-center text-sm text-muted-foreground mb-3">
                        <span>{course.completedModules}/{course.totalModules} modules</span>
                        <span>Dernier accès : {new Date(course.lastAccessed).toLocaleDateString("fr-FR")}</span>
                      </div>
                      <Button className="w-full" size="sm" onClick={() => navigate(`/elearning/${course.id}/learn`)}>
                        <Play className="w-4 h-4 mr-2" />
                        Continuer
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="planning" className="space-y-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-500" />
              Planification personnalisée
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardContent className="p-6 space-y-6">
                  {enrolledCourses.filter(c => c.progress < 100).map((course) => (
                    <div key={course.id} className="p-4 border rounded-xl space-y-4 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg">{course.title}</h3>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {course.studyPace === 'intensive' ? 'Intensif' : 'Standard'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Rythme d'apprentissage</Label>
                          <Select 
                            defaultValue={course.studyPace || "standard"} 
                            onValueChange={(val) => persistPlan(course.id.toString(), { studyPace: val })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir un rythme" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="intensive">Intensif (1 module / jour)</SelectItem>
                              <SelectItem value="standard">Standard (2 modules / semaine)</SelectItem>
                              <SelectItem value="personalized">Personnalisé</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Date de fin souhaitée</Label>
                          <Input 
                            type="date" 
                            defaultValue={course.targetEndDate || ""} 
                            onChange={(e) => persistPlan(course.id.toString(), { targetEndDate: e.target.value })} 
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center space-x-2">
                          <Switch 
                            id={`reminders-${course.id}`} 
                            checked={course.remindersEnabled ?? false}
                            onCheckedChange={(checked) => persistPlan(course.id.toString(), { remindersEnabled: checked })}
                          />
                          <Label htmlFor={`reminders-${course.id}`} className="flex items-center gap-2 cursor-pointer">
                            <Bell className="w-4 h-4 text-primary" /> Rappels par email
                          </Label>
                        </div>
                        <Button 
                          variant="nature" 
                          size="sm" 
                          onClick={() => {
                            toast({ title: "Plan mis à jour", description: "Vos préférences ont été enregistrées avec succès." });
                          }}
                        >
                          Mettre à jour le plan
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" /> Rappel quotidien
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm font-medium text-primary mb-1">Prochain module recommandé</p>
                    <p className="text-base font-bold">{nextSuggestion.title}</p>
                    <p className="text-xs text-muted-foreground mt-2">Prévu pour : {nextSuggestion.when}</p>
                  </div>
                  <Button className="w-full" variant="outline">
                    Voir mon calendrier complet
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Course Schedule Managers */}
            {enrollments.filter((e: any) => !e.completedAt).map((enrollment: any) => (
              <CourseScheduleManager
                key={enrollment.id}
                enrollmentId={enrollment.id}
                courseId={enrollment.courseId}
                userId={user?.id}
              />
            ))}
          </TabsContent>

          <TabsContent value="achievements" className="space-y-8">
            {/* Badges */}
            <StudentBadges
              completedCourses={enrolledCourses.filter(c => c.progress >= 100).length}
              totalModulesCompleted={stats.completedModules}
              averageScore={stats.averageScore}
              totalHours={stats.totalHours}
              streak={3}
            />

            {/* Certificates */}
            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                Mes certificats
              </h2>
              {enrolledCourses.filter(c => c.progress >= 100).length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Terminez un cours pour obtenir votre premier certificat !</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {enrolledCourses.filter(c => c.progress >= 100).map(course => (
                    <Card key={course.id} className="border-yellow-200 dark:border-yellow-800 bg-gradient-to-br from-yellow-50/50 to-orange-50/30 dark:from-yellow-950/10 dark:to-orange-950/5">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                          <Trophy className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-sm">{course.title}</h3>
                          <p className="text-xs text-muted-foreground">Complété le {new Date(course.lastAccessed).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => navigate(`/elearning/${course.id}/learn`)}>
                          Voir
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default LearningDashboard;
