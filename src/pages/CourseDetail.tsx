import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Star, Play, Clock, Users, BookOpen, CheckCircle, User } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";

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

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const { toast } = useToast();

  const fetchCourse = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/courses/${id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch course');
      const { data } = await res.json();
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
        thumbnail: data.thumbnailUrl || data.imageUrl || '/lovable-uploads/4fa2637d-1bbd-47d7-aceb-da19ce83532d.png',
        isLive: !!data.isLive,
        modules: Array.isArray(data.modules) ? data.modules.map((m: any, idx: number) => ({
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
  };

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const handleEnrollment = async (formData: any) => {
    try {
      const res = await fetch('/api/contact_messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          project_type: `Inscription cours: ${course?.title}`,
          message: `Motivation: ${formData.motivation || '—'}. Expérience: ${formData.experience || '—'}`,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setEnrolled(true);
      toast({ title: "Inscription réussie !", description: "Vous recevrez un email de confirmation." });
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: "Impossible de s'inscrire. Réessayez.", variant: "destructive" });
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
            <Card className="bg-card/90 backdrop-blur-sm border-2 border-border hover:shadow-xl transition-all duration-500 sticky top-24">
              <CardContent className="p-0">
                <div className="aspect-video bg-muted rounded-t-lg relative overflow-hidden group">
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex items-center justify-center">
                    <Button variant="ghost" size="icon" className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 hover:scale-110 transition-all duration-300">
                      <Play className="w-10 h-10 text-white" />
                    </Button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="text-3xl font-bold text-primary mb-4">{formatPrice(course.price)}</div>
                  {enrolled ? (
                    <Button className="w-full" disabled>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Inscrit
                    </Button>
                  ) : (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full">S'inscrire maintenant</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Inscription au cours</DialogTitle>
                        </DialogHeader>
                        <EnrollmentForm onSubmit={handleEnrollment} course={course} />
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            {course.requirements.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold mb-4">Prérequis</h4>
                  <ul className="space-y-2">
                    {course.requirements.map((req, index) => (
                      <li key={`req-${index}-${req.slice(0, 20)}`} className="text-sm text-muted-foreground flex items-center">
                        <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                        {req}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

// Enrollment form component
const EnrollmentForm = ({ onSubmit, course }: { onSubmit: (data: any) => void; course: Course }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    experience: "",
    motivation: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, courseId: course.id });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input placeholder="Nom complet *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
      <Input type="email" placeholder="Email *" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
      <Input placeholder="Téléphone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
      <Input placeholder="Votre expérience en agriculture" value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })} />
      <textarea placeholder="Pourquoi souhaitez-vous suivre ce cours ?" value={formData.motivation} onChange={(e) => setFormData({ ...formData, motivation: e.target.value })} className="w-full p-3 border rounded-lg resize-none h-20" />
      <Button type="submit" className="w-full">Confirmer l'inscription</Button>
    </form>
  );
};

export default CourseDetail;