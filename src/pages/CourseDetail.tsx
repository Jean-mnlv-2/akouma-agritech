import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Star, 
  Play, 
  Clock, 
  Users, 
  BookOpen, 
  CheckCircle, 
  User, 
  ArrowRight, 
  Award, 
  Download, 
  GraduationCap 
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import CourseComments from "@/components/elearning/CourseComments";
import { useToast } from "@/hooks/use-toast";
import { useCopyProtection } from "@/hooks/use-copy-protection";
import CopyProtectionDialog from "@/components/CopyProtectionDialog";
import { api } from "@/integrations/api/client";
import { useI18n } from "@/i18n";

import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Course {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  instructor: string;
  instructorBio: string;
  duration: string;
  students: number;
  rating: number;
  price: number;
  level: string;
  category: string;
  thumbnail: string;
  isLive?: boolean;
  isCopyProtected: boolean;
  modules: CourseModule[];
  benefits: string[];
  requirements: string[];
}

interface CourseModule {
  id: string;
  title: string;
  duration: string;
  lessons: string[];
}

interface User {
  id: string | number;
  email: string;
  name?: string;
}

interface Enrollment {
  id: number;
  userId: string | number;
  courseId: number;
  enrolledAt: string;
}

interface EnrollmentFormData {
  name?: string;
  email?: string;
  phone?: string;
  experience?: string;
  motivation?: string;
  courseId?: string;
  professionalActivity?: string;
  organization?: string;
  sector?: string;
  experienceLevel?: string;
  expectations?: string;
}

const CourseDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    api.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      const user = data?.user || null;
      setCurrentUser(user);
      
      if (user && course) {
        api.request('GET', '/api/elearning_enrollments').then((res: { data: Enrollment[] }) => {
          const enrollments = res.data || [];
          const isEnrolled = enrollments.some((e: Enrollment) => e.courseId === Number(course.id) && String(e.userId) === String(user.id));
          setEnrolled(isEnrolled);
        }).catch((err: Error) => console.error("Erreur lors de la vérification de l'inscription:", err));
      }
    });
  }, [course]);

  const { isDialogOpen, closeDialog } = useCopyProtection(
    !!course?.isCopyProtected,
    {
      title: course?.title || "",
      imageUrl: course?.thumbnail,
      excerpt: course?.description,
      url: window.location.href,
    }
  );

  const fetchCourse = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      const { data } = await api.request('GET', `/api/courses/slug/${slug}`);
      const normalized: Course = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        longDescription: data.longDescription || data.description || '',
        instructor: data.instructor || data.instructorName || 'Instructeur',
        instructorBio: data.instructorBio || '',
        duration: data.duration || '—',
        students: data.students || data.enrollmentsCount || 0,
        rating: data.rating || 0,
        price: data.price || 0,
        level: data.level || 'Tous niveaux',
        category: data.category || 'Général',
        thumbnail: data.thumbnailUrl || data.imageUrl || '/kilimo-logo.png',
        isLive: !!data.isLive,
        isCopyProtected: !!(data.isCopyProtected || data.is_copy_protected),
        modules: Array.isArray(data.modules) ? data.modules.map((m: { id?: number | string; title?: string; duration?: string; lessons?: string[] }, idx: number) => ({
          id: String(m.id ?? idx + 1),
          title: m.title ?? `Module ${idx + 1}`,
          duration: m.duration ?? '—',
          lessons: Array.isArray(m.lessons) ? m.lessons : [],
        })) : [],
        benefits: Array.isArray(data.benefits) ? data.benefits : [],
        requirements: Array.isArray(data.requirements) ? data.requirements : [],
      };
      setCourse(normalized);
    } catch (err) {
      console.error('Error fetching course:', err);
      setCourse(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const handleEnrollment = async (formData: EnrollmentFormData) => {
    if (!currentUser) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour vous inscrire à ce cours.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    try {
      await api.request('POST', '/api/elearning_enrollments', {
        body: {
          courseId: Number(course?.id),
          ...formData
        }
      });
      setEnrolled(true);
      toast({ 
        title: "Inscription réussie !", 
        description: "Vous êtes maintenant inscrit à ce cours. Vous pouvez commencer à apprendre." 
      });
    } catch (err: unknown) {
      console.error(err);
      let errorMessage = "Impossible de s'inscrire. Réessayez.";
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response: { data?: { error?: string } } };
        errorMessage = axiosErr.response.data?.error || errorMessage;
      }
      toast({ 
        title: "Erreur", 
        description: errorMessage, 
        variant: "destructive" 
      });
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(price);

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'débutant': return 'bg-green-100 text-green-800';
      case 'intermédiaire': return 'bg-yellow-100 text-yellow-800';
      case 'avancé': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-6 py-12 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Cours introuvable</h1>
          <Link to="/elearning" className="text-primary hover:underline">Retour aux cours</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {course && (
        <CopyProtectionDialog
          isOpen={isDialogOpen}
          onClose={closeDialog}
          item={{
            title: course.title,
            imageUrl: course.thumbnail,
            excerpt: course.description,
            url: window.location.href,
          }}
        />
      )}

      <div className="container mx-auto px-6 py-12">
        {/* Breadcrumb - Enhanced */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary transition-colors">Accueil</Link>
          <span>/</span>
          <Link to="/elearning" className="hover:text-primary transition-colors">E-Learning</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{course.title}</span>
        </div>

        {/* Back button - Enhanced */}
        <Link to="/elearning" className="inline-flex items-center text-primary hover:text-primary/80 mb-8 group transition-all duration-300 hover:scale-105">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Retour aux cours
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Course content - Enhanced */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header - Enhanced */}
            <div className="bg-gradient-to-br from-primary/5 via-background to-accent/5 rounded-2xl p-8 border-2 border-border">
              <div className="flex items-center gap-2 mb-6 flex-wrap">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{course.category}</Badge>
                <Badge className={`${getLevelColor(course.level)} border-2`}>{course.level}</Badge>
                {course.isLive && <Badge variant="destructive" className="animate-pulse">Live</Badge>}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {course.title}
              </h1>
              <div className="flex items-center gap-6 mb-6 text-sm text-muted-foreground flex-wrap">
                <div className="flex items-center gap-2 bg-card/50 px-3 py-1.5 rounded-lg">
                  <User className="w-4 h-4 text-primary" />
                  <span className="font-medium">{course.instructor}</span>
                </div>
                <div className="flex items-center gap-2 bg-card/50 px-3 py-1.5 rounded-lg">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="font-medium">{course.duration}</span>
                </div>
                <div className="flex items-center gap-2 bg-card/50 px-3 py-1.5 rounded-lg">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="font-medium">{course.students} étudiants</span>
                </div>
                <div className="flex items-center gap-1 bg-card/50 px-3 py-1.5 rounded-lg">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="font-medium">{course.rating}</span>
                </div>
              </div>
              <div className="text-muted-foreground leading-relaxed text-lg" dangerouslySetInnerHTML={{ __html: course.longDescription }} />
            </div>

            {/* Course modules - Enhanced */}
            {course.modules.length > 0 && (
              <Card className="bg-card/90 backdrop-blur-sm border-2 border-border hover:shadow-xl transition-all duration-500">
                <CardContent className="p-8">
                  <h3 className="text-2xl md:text-3xl font-bold mb-8 flex items-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    <BookOpen className="w-6 h-6 mr-3 text-primary" />
                    Contenu du cours
                  </h3>
                  <div className="space-y-4">
                    {course.modules.map((module, index) => {
                      const delay = index * 100;
                      return (
                        <div 
                          key={module.id} 
                          className="border-2 border-border rounded-xl p-6 bg-gradient-to-br from-primary/5 via-background to-accent/5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
                          style={{ transitionDelay: `${delay}ms` }}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-lg group-hover:text-primary transition-colors">
                              Module {index + 1}: {module.title}
                            </h4>
                            <span className="text-sm text-muted-foreground font-medium bg-card/50 px-3 py-1 rounded-lg">
                              {module.duration}
                            </span>
                          </div>
                          <ul className="space-y-2">
                            {module.lessons.map((lesson, lessonIndex) => (
                              <li 
                                key={`${module.id}-lesson-${lessonIndex}-${lesson.slice(0, 20)}`} 
                                className="text-sm text-muted-foreground flex items-center group-hover:text-foreground transition-colors"
                              >
                                <Play className="w-4 h-4 mr-3 text-primary flex-shrink-0" />
                                {lesson}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* What you'll learn - Enhanced */}
            {course.benefits.length > 0 && (
              <Card className="bg-card/90 backdrop-blur-sm border-2 border-border hover:shadow-xl transition-all duration-500">
                <CardContent className="p-8">
                  <h3 className="text-2xl md:text-3xl font-bold mb-8 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Ce que vous apprendrez
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {course.benefits.map((benefit, index) => {
                      const delay = index * 50;
                      return (
                        <div 
                          key={`benefit-${index}-${benefit.slice(0, 20)}`} 
                          className="flex items-center group hover:bg-primary/5 p-3 rounded-lg transition-all duration-300"
                          style={{ transitionDelay: `${delay}ms` }}
                        >
                          <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 group-hover:scale-110 transition-transform" />
                          <span className="text-sm font-medium">{benefit}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instructor - Enhanced */}
            <Card className="bg-card/90 backdrop-blur-sm border-2 border-border hover:shadow-xl transition-all duration-500">
              <CardContent className="p-8">
                <h3 className="text-2xl md:text-3xl font-bold mb-8 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Votre instructeur
                </h3>
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xl mb-2">{course.instructor}</h4>
                    <p className="text-muted-foreground leading-relaxed">{course.instructorBio}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Enhanced */}
          <div className="space-y-6">
            {/* Video/thumbnail preview - Enhanced */}
            <Card className="bg-card/90 backdrop-blur-md border-2 border-primary/10 hover:shadow-2xl transition-all duration-500 sticky top-24 overflow-hidden group">
              <CardContent className="p-0">
                <div className="aspect-video bg-muted relative overflow-hidden">
                  <img 
                    src={course.thumbnail} 
                    alt={course.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 hover:scale-110 transition-all duration-300 shadow-2xl"
                    >
                      <Play className="w-10 h-10 text-white fill-white/20" />
                    </Button>
                  </div>
                  <Badge className="absolute top-4 left-4 bg-primary text-white border-none px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-lg">
                    {course.category}
                  </Badge>
                </div>
                <div className="p-8 space-y-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{t("elearning.price_label") || "Prix du cours"}</span>
                    <div className="text-4xl font-black text-primary flex items-baseline gap-2">
                      {formatPrice(course.price)}
                      {course.price !== 0 && <span className="text-sm font-medium text-muted-foreground line-through opacity-50">{(Number(course.price) * 1.5).toLocaleString()} FCFA</span>}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {enrolled ? (
                      <Button className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/20 bg-primary/10 text-primary hover:bg-primary/20 border-none transition-all" disabled>
                        <CheckCircle className="w-5 h-5 mr-3" />
                        {t("elearning.enrolled") || "Inscrit"}
                      </Button>
                    ) : (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all bg-primary hover:bg-primary/90 text-white border-none group/btn">
                            {t("elearning.enroll") || "S'inscrire maintenant"}
                            <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md rounded-2xl border-2 border-primary/10 overflow-hidden p-0">
                          <div className="bg-primary/5 p-6 border-b-2 border-primary/10">
                            <DialogTitle className="text-2xl font-bold">{t("elearning.register.title") || "Inscription au cours"}</DialogTitle>
                            <DialogDescription className="text-muted-foreground mt-2 font-medium">
                              {t("elearning.register.description") || "Veuillez remplir le formulaire pour commencer votre apprentissage."}
                            </DialogDescription>
                          </div>
                          <div className="p-6">
                            <EnrollmentForm onSubmit={handleEnrollment} course={course} t={t} currentUser={currentUser} />
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    <p className="text-center text-xs text-muted-foreground font-medium flex items-center justify-center gap-2">
                      <Award className="w-3 h-3" />
                      Garantie de satisfaction 30 jours
                    </p>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-primary/10">
                    <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Ce qui est inclus :</h4>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-sm font-medium">
                        <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10">
                          <Play className="w-4 h-4 text-primary" />
                        </div>
                        Accès illimité à vie
                      </li>
                      <li className="flex items-center gap-3 text-sm font-medium">
                        <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10">
                          <Download className="w-4 h-4 text-primary" />
                        </div>
                        Ressources téléchargeables
                      </li>
                      <li className="flex items-center gap-3 text-sm font-medium">
                        <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10">
                          <Award className="w-4 h-4 text-primary" />
                        </div>
                        Certificat de réussite
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Requirements - Enhanced */}
            {course.requirements.length > 0 && (
              <Card className="bg-card/90 backdrop-blur-sm border-2 border-primary/10 hover:shadow-xl transition-all duration-500 overflow-hidden">
                <CardContent className="p-8">
                  <h4 className="font-bold text-lg mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20">
                      <GraduationCap className="w-5 h-5 text-accent" />
                    </div>
                    {t("elearning.requirements") || "Prérequis"}
                  </h4>
                  <ul className="space-y-4">
                    {course.requirements.map((req, index) => (
                      <li key={`req-${index}-${req.slice(0, 20)}`} className="text-sm font-medium text-muted-foreground flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5 border border-accent/20">
                          <div className="w-2 h-2 bg-accent rounded-full"></div>
                        </div>
                        {req}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Comments Section */}
        {course && (
          <div className="mt-12">
            <CourseComments
              courseId={Number(course.id)}
              currentUserId={currentUser?.id ? String(currentUser.id) : undefined}
            />
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

// Enrollment form component
const EnrollmentForm = ({ onSubmit, course, t, currentUser }: { onSubmit: (data: EnrollmentFormData) => void; course: Course; t: (key: string) => string; currentUser: User | null }) => {
  const [formData, setFormData] = useState<EnrollmentFormData>({
    name: "",
    email: "",
    phone: "",
    professionalActivity: "",
    organization: "",
    sector: "",
    experienceLevel: "",
    expectations: ""
  });

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.name || "",
        email: currentUser.email || "",
      }));
    }
  }, [currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For logged in users, we don't send name/email if they are already in the account
    const submissionData = { ...formData };
    if (currentUser) {
      delete submissionData.name;
      delete submissionData.email;
    }
    onSubmit({ ...submissionData, courseId: course.id });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
      {!currentUser && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground/80 ml-1">{t("elearning.register.name") || "Nom complet"}</label>
            <Input 
              placeholder={t("elearning.register.name_placeholder") || "Votre nom complet"} 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              className="h-11 rounded-xl border-2 focus:border-primary transition-all bg-background"
              required 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground/80 ml-1">{t("elearning.register.email") || "Email"}</label>
            <Input 
              type="email" 
              placeholder={t("elearning.register.email_placeholder") || "votre@email.com"} 
              value={formData.email} 
              onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
              className="h-11 rounded-xl border-2 focus:border-primary transition-all bg-background"
              required 
            />
          </div>
        </>
      )}

      {currentUser && (
        <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 mb-2">
          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Compte connecté</p>
          <p className="text-sm font-medium text-foreground">{currentUser.name || currentUser.email}</p>
          <p className="text-xs text-muted-foreground mt-1">Vos informations personnelles (nom, email, pays, téléphone) sont déjà associées à votre compte.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!currentUser && (
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground/80 ml-1">{t("elearning.register.phone") || "Téléphone"}</label>
            <Input 
              placeholder={t("elearning.register.phone_placeholder") || "Votre numéro"} 
              value={formData.phone} 
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
              className="h-11 rounded-xl border-2 focus:border-primary transition-all bg-background"
            />
          </div>
        )}
        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground/80 ml-1">{t("elearning.register.experience_level") || "Niveau d'expérience"}</label>
          <Select 
            value={formData.experienceLevel} 
            onValueChange={(val) => setFormData({ ...formData, experienceLevel: val })}
          >
            <SelectTrigger className="h-11 rounded-xl border-2 focus:border-primary bg-background">
              <SelectValue placeholder="Choisir..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">{t("elearning.register.experience_level_beginner") || "Débutant"}</SelectItem>
              <SelectItem value="intermediate">{t("elearning.register.experience_level_intermediate") || "Intermédiaire"}</SelectItem>
              <SelectItem value="expert">{t("elearning.register.experience_level_expert") || "Expert"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-foreground/80 ml-1">{t("elearning.register.professional_activity") || "Activité professionnelle"}</label>
        <Input 
          placeholder={t("elearning.register.professional_activity_placeholder") || "Votre métier"} 
          value={formData.professionalActivity} 
          onChange={(e) => setFormData({ ...formData, professionalActivity: e.target.value })} 
          className="h-11 rounded-xl border-2 focus:border-primary transition-all bg-background"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground/80 ml-1">{t("elearning.register.organization") || "Organisation"}</label>
          <Input 
            placeholder={t("elearning.register.organization_placeholder") || "Entreprise / Coopérative"} 
            value={formData.organization} 
            onChange={(e) => setFormData({ ...formData, organization: e.target.value })} 
            className="h-11 rounded-xl border-2 focus:border-primary transition-all bg-background"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground/80 ml-1">{t("elearning.register.sector") || "Secteur d'activité"}</label>
          <Input 
            placeholder={t("elearning.register.sector_placeholder") || "Ex: Maraîchage"} 
            value={formData.sector} 
            onChange={(e) => setFormData({ ...formData, sector: e.target.value })} 
            className="h-11 rounded-xl border-2 focus:border-primary transition-all bg-background"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-foreground/80 ml-1">{t("elearning.register.expectations") || "Attentes particulières"}</label>
        <Textarea 
          placeholder={t("elearning.register.expectations_placeholder") || "Que souhaitez-vous apprendre ?"} 
          value={formData.expectations} 
          onChange={(e) => setFormData({ ...formData, expectations: e.target.value })} 
          className="rounded-xl border-2 focus:border-primary transition-all bg-background resize-none h-20" 
        />
      </div>

      <Button type="submit" className="w-full h-12 rounded-xl text-md font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white mt-2">
        {t("elearning.register.submit") || "Confirmer l'inscription"}
      </Button>
    </form>
  );
};

export default CourseDetail;
