import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import TitleManager from "@/components/TitleManager";
import { api } from "@/integrations/api/client";
import { useI18n } from "@/i18n/i18n";
import { BookOpen, Award, Clock, BarChart3, Play, CheckCircle, Trophy, Calendar, Target } from "lucide-react";
import logoAk from "@/assets/logo-ak.png";
import courseThumbnail from "@/assets/course-thumbnail.jpg";

interface EnrolledCourse {
  id: string;
  title: string;
  progress: number;
  thumbnail: string;
  level: string;
  totalModules: number;
  completedModules: number;
  lastAccessed: string;
}

interface Certificate {
  id: string;
  courseName: string;
  issuedAt: string;
  certificateNumber: string;
}

const LearningDashboard = () => {
  const navigate = useNavigate();
  useI18n(); // keep hook call order
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  const certificates: Certificate[] = [
    {
      id: "1",
      courseName: "Gestion des Maladies des Plantes",
      issuedAt: "2026-02-20",
      certificateNumber: "AK-CERT-2026-00142",
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

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "débutant": case "beginner": return "bg-green-100 text-green-800 border-green-300";
      case "intermédiaire": case "intermediate": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "avancé": case "advanced": return "bg-red-100 text-red-800 border-red-300";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Chargement..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TitleManager title="Mon Espace E-Learning - AKOUMA" description="Tableau de bord de votre apprentissage" canonical={window.location.origin + "/dashboard/learning"} image={logoAk} />
      <Header />

      <main className="container mx-auto px-4 sm:px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Bienvenue, {user?.fullName || user?.email || "Apprenant"} 👋
          </h1>
          <p className="text-muted-foreground text-lg">Continuez votre parcours d'apprentissage</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
        <section className="mb-10">
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
                  <Button className="w-full" size="sm" onClick={() => navigate(`/elearning/${course.id}`)}>
                    <Play className="w-4 h-4 mr-2" />
                    Continuer
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Certificates */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Mes certificats
          </h2>
          {certificates.length === 0 ? (
            <Card className="p-8 text-center">
              <Award className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun certificat obtenu pour le moment. Complétez un cours pour en recevoir un !</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {certificates.map((cert) => (
                <Card key={cert.id} className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 hover:shadow-lg transition-all">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Award className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground mb-1">{cert.courseName}</h3>
                      <p className="text-sm text-muted-foreground mb-1">N° {cert.certificateNumber}</p>
                      <p className="text-sm text-muted-foreground">Délivré le {new Date(cert.issuedAt).toLocaleDateString("fr-FR")}</p>
                      <Button variant="outline" size="sm" className="mt-3">
                        Télécharger le certificat PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Completed Courses */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-500" />
            Cours terminés
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.filter(c => c.progress === 100).map((course) => (
              <Card key={course.id} className="relative overflow-hidden opacity-90 hover:opacity-100 transition-opacity">
                <div className="absolute top-3 right-3 z-10">
                  <Badge className="bg-green-500 text-white">✓ Terminé</Badge>
                </div>
                <div className="h-32 overflow-hidden">
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground mb-2">{course.title}</h3>
                  <p className="text-sm text-muted-foreground">{course.totalModules} modules complétés</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Recommendations */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Recommandations
          </h2>
          <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="p-6 text-center">
              <Calendar className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Planifiez votre apprentissage</h3>
              <p className="text-muted-foreground mb-4 max-w-lg mx-auto">
                Définissez un rythme d'apprentissage personnalisé et recevez des rappels pour rester motivé.
              </p>
              <Button variant="default">
                <Calendar className="w-4 h-4 mr-2" />
                Configurer mon planning
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LearningDashboard;
