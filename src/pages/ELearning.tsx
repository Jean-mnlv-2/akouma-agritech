import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Filter, BookOpen, Video, Headphones, Radio, PlayCircle, Award, Users, Clock, UserPlus } from "lucide-react";
import CourseCard from "@/components/CourseCard";
import LiveStream from "@/components/LiveStream";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import AdSpace from "@/components/AdSpace";
import ContentSubmission from "@/components/ContentSubmission";
import OfflineButton from "@/components/OfflineButton";
import elearningHero from "@/assets/elearning-hero.jpg";
import courseThumbnail from "@/assets/course-thumbnail.jpg";
import { api } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";
import DOMPurify from 'dompurify';
import countryList from 'react-select-country-list';
import TitleManager from "@/components/TitleManager";

// Définir un type UI strict pour les cours
interface UICourse {
  id: string;
  title: string;
  description: string;
  price: string;
  category: string;
}

const ELearning = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const itemsPerPage = 6;
  const [courses, setCourses] = useState<UICourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const categories = ["Tous", "Agriculture", "Irrigation", "Maladies des plantes", "Techniques modernes", "Gestion"];

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await api
          .from('courses')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        setCourses((data || []).map((c: any) => ({
          id: String(c.id ?? ''),
          title: String(c.title ?? ''),
          description: String(c.description ?? ''),
          price: String(c.price ?? ''),
          category: String(c.category ?? '')
        })));
      } catch (err) {
        setError("Erreur lors du chargement des cours.");
        setCourses([]);
      }
      setLoading(false);
    };
    fetchCourses();
    fetchLiveStreams();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const { data, error } = await api
        .from('elearning_stats')
        .select('*')
        .order('createdAt', { ascending: true });

      if (error) throw error;
      setStats(data || []);
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Fallback to default stats if API fails
      setStats([
        { icon: BookOpen, value: "150+", label: "Cours disponibles" },
        { icon: Users, value: "5000+", label: "Étudiants actifs" },
        { icon: Award, value: "98%", label: "Taux de satisfaction" },
        { icon: Clock, value: "24/7", label: "Accès illimité" }
      ]);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchLiveStreams = async () => {
    try {
      setLoadingStreams(true);
      const { data, error } = await api
        .from('live_streams')
        .select('*')
        .order('scheduledTime', { ascending: true });

      if (error) throw error;
      setLiveStreams(data || []);
    } catch (error) {
      console.error('Error fetching live streams:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les live streams',
        variant: 'destructive',
      });
    } finally {
      setLoadingStreams(false);
    }
  };

  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const [loadingStreams, setLoadingStreams] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Simulate loading
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery]);

  const handleRegistration = async () => {
    setIsRegistering(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRegistering(false);
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Tous" || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Pagination for courses
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCourses = filteredCourses.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const allCountries = countryList().getData();
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    country: '',
    phone: ''
  });
  const getCountryDialCode = (countryName: string) => {
    const countryCodeMap: { [key: string]: string } = {
      'Cameroun': '+237',
      'Côte d\'Ivoire': '+225',
      'Burkina Faso': '+226',
      'Mali': '+223',
      'Sénégal': '+221',
      'Bénin': '+229',
      'Togo': '+228',
      'Guinée': '+224',
      'France': '+33',
      'États-Unis': '+1',
      'Canada': '+1',
      'Royaume-Uni': '+44',
      'Allemagne': '+49',
      'Belgique': '+32',
      'Suisse': '+41',
      'Nigeria': '+234',
      'Ghana': '+233',
      'Maroc': '+212',
      'Tunisie': '+216',
      'Algérie': '+213',
      'Égypte': '+20',
      'Afrique du Sud': '+27',
      'Kenya': '+254',
      'Ouganda': '+256',
      'Tanzanie': '+255',
      'Rwanda': '+250',
      'Burundi': '+257',
      'Madagascar': '+261',
      'Maurice': '+230',
      'Seychelles': '+248'
    };
    
    return countryCodeMap[countryName] || '+XXX';
  };

  return (
    <div className="min-h-screen">
      <TitleManager
        title="E-Learning"
        description="Formations agricoles, webinaires et ressources pour révolutionner vos pratiques."
        canonical={window.location.origin + '/elearning'}
        image="/lovable-uploads/4fa2637d-1bbd-47d7-aceb-da19ce83532d.png"
      />
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden mobile-page-content">
        <div className="absolute inset-0">
          <img 
            src={elearningHero} 
            alt="E-learning AKOUMA"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40"></div>
        </div>
        
        <div className="relative container mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Plateforme d'<span className="text-green-400">E-Learning</span> Agricole
            </h1>
            <p className="text-xl text-gray-200 mb-8 leading-relaxed">
              Accédez à des formations de qualité, des webinaires en direct et des ressources 
              complètes pour révolutionner vos pratiques agricoles.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="lg" variant="nature" className="text-lg px-8 focus-visible:ring-4 focus-visible:ring-primary/40 transition-transform duration-200 hover:scale-105" aria-label="S'inscrire maintenant">
                    <UserPlus className="w-5 h-5 mr-2" />
                    S'inscrire maintenant
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Inscription à AKOUMA E-Learning</DialogTitle>
                    <DialogDescription>
                      Rejoignez notre plateforme et accédez à plus de 150 cours agricoles
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nom complet</label>
                      <Input placeholder="Votre nom complet" value={registerForm.name} onChange={e => setRegisterForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <Input type="email" placeholder="votre@email.com" value={registerForm.email} onChange={e => setRegisterForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Pays</label>
                      <select
                        className="w-full border rounded px-3 py-2 bg-background"
                        value={registerForm.country}
                        onChange={e => setRegisterForm(f => ({ ...f, country: e.target.value }))}
                      >
                        <option value="">Sélectionnez votre pays</option>
                        {allCountries.map(c => (
                          <option key={c.value} value={c.label}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Téléphone</label>
                      <div className="flex space-x-2">
                        <div className="w-24 text-sm text-muted-foreground flex items-center justify-center border rounded-md bg-muted">
                          {registerForm.country ? getCountryDialCode(registerForm.country) : '+XXX'}
                        </div>
                        <Input
                          placeholder="Numéro de téléphone"
                          value={registerForm.phone}
                          onChange={e => setRegisterForm(f => ({ ...f, phone: e.target.value }))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleRegistration}
                      disabled={isRegistering}
                    >
                      {isRegistering ? "Inscription en cours..." : "S'inscrire gratuitement"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button size="lg" variant="outline" className="text-lg px-8 bg-white/10 border-white/30 text-white hover:bg-white/20 focus-visible:ring-4 focus-visible:ring-accent/40 transition-transform duration-200 hover:scale-105" aria-label="Parcourir les cours">
                <PlayCircle className="w-5 h-5 mr-2" />
                Parcourir les cours
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-6">
          {loadingStats ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="large" text="Chargement des statistiques..." />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => {
                // Map icon names to actual components
                const getIcon = (iconName: string) => {
                  switch (iconName?.toLowerCase()) {
                    case 'bookopen': return BookOpen;
                    case 'users': return Users;
                    case 'award': return Award;
                    case 'clock': return Clock;
                    default: return BookOpen;
                  }
                };
                const IconComponent = getIcon(stat.icon);
                
                return (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                    <div className="text-muted-foreground">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Ad Banner */}
          <div className="mt-12">
            <AdSpace 
              size="banner" 
              title="Partenaire officiel - TechnoAgri Solutions"
              description="Découvrez nos formations avancées en agriculture de précision"
              buttonText="Découvrir"
            />
          </div>
        </div>
      </section>

      {/* Content Submission Section */}
      <section className="py-16 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="container mx-auto px-6">
          <ContentSubmission />
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <Tabs defaultValue="courses" className="w-full">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0">
              <TabsList className="grid w-full lg:w-auto grid-cols-4 lg:grid-cols-4">
                <TabsTrigger value="courses" className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4" />
                  <span>Cours</span>
                </TabsTrigger>
                <TabsTrigger value="videos" className="flex items-center space-x-2">
                  <Video className="w-4 h-4" />
                  <span>Vidéos</span>
                </TabsTrigger>
                <TabsTrigger value="podcasts" className="flex items-center space-x-2">
                  <Headphones className="w-4 h-4" />
                  <span>Podcasts</span>
                </TabsTrigger>
                <TabsTrigger value="live" className="flex items-center space-x-2">
                  <Radio className="w-4 h-4" />
                  <span>Live</span>
                </TabsTrigger>
              </TabsList>

              {/* Search and Filter */}
              <div className="flex space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Rechercher un cours..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtres
                </Button>
              </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2 mb-8">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>

            <TabsContent value="courses" className="space-y-8">
              {loading ? (
                <LoadingSpinner size="large" text="Chargement des cours..." />
              ) : error ? (
                <div className="text-center py-12 text-destructive">{error}</div>
              ) : paginatedCourses.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun cours trouvé</h3>
                  <p className="text-muted-foreground">
                    Essayez de modifier vos critères de recherche ou de filtrage.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedCourses.map((course) => (
                      <div key={course.id} className="relative">
                        <Card className="hover:shadow-elegant transition-shadow">
                          <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                              <BookOpen className="w-5 h-5 text-primary" />
                              <span>{course.title}</span>
                            </CardTitle>
                            <CardDescription className="text-sm">
                              <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(course.description) }} />
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground mb-4">
                              Prix: {course.price}
                            </p>
                            <Button variant="outline" className="w-full">
                              Découvrir le cours
                            </Button>
                          </CardContent>
                        </Card>
                        {course.price === "Gratuit" && (
                          <div className="absolute top-2 right-2 z-10">
                            <OfflineButton
                              id={course.id}
                              title={course.title}
                              content={course.description}
                              type="course"
                              size="sm"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                   
                  {totalPages > 1 && (
                    <>
                      <div className="mb-8">
                        <AdSpace 
                          size="inline" 
                          title="Nouveau ! Cours d'agriculture biologique"
                          description="Apprenez les techniques durables avec nos experts certifiés"
                          buttonText="S'inscrire maintenant"
                        />
                      </div>
                      <div className="flex justify-center">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious 
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (currentPage > 1) setCurrentPage(currentPage - 1);
                                }}
                                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                              />
                            </PaginationItem>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentPage(page);
                                  }}
                                  isActive={currentPage === page}
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            ))}
                            <PaginationItem>
                              <PaginationNext 
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                                }}
                                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    </>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="videos" className="space-y-8">
              {isLoading ? (
                <LoadingSpinner size="large" text="Chargement des vidéos..." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedCourses.map((course) => (
                    <Card key={course.id} className="hover:shadow-elegant transition-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Video className="w-5 h-5 text-primary" />
                          <span>{course.title}</span>
                        </CardTitle>
                        <CardDescription className="text-sm">
                          <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(course.description) }} />
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button variant="outline" className="w-full">
                          Voir la vidéo
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="podcasts" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-elegant transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Headphones className="w-5 h-5 text-primary" />
                      <span>Podcasts agricoles</span>
                    </CardTitle>
                    <CardDescription>
                      Écoutez nos experts parler des dernières innovations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Contenu podcast à venir...
                    </p>
                    <Button variant="outline" className="w-full">
                      Bientôt disponible
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="live" className="space-y-8">
              {loadingStreams ? (
                <LoadingSpinner size="large" text="Chargement des live streams..." />
              ) : liveStreams.length === 0 ? (
                <div className="text-center py-12">
                  <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun live stream disponible</h3>
                  <p className="text-muted-foreground">
                    Aucun live stream n'est programmé pour le moment.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {liveStreams.map((stream) => (
                    <LiveStream 
                      key={stream.id} 
                      id={stream.id.toString()}
                      title={stream.title}
                      instructor={stream.instructorName || 'Instructeur non renseigné'}
                      scheduledTime={stream.scheduledTime ? new Date(stream.scheduledTime).toLocaleString('fr-FR') : 'Non programmé'}
                      duration={stream.durationMinutes ? `${stream.durationMinutes}min` : 'Non renseigné'}
                      viewers={stream.viewerCount || 0}
                      isLive={stream.isLive}
                      description={stream.description || ''}
                      thumbnail={stream.thumbnailUrl || courseThumbnail}
                      category={stream.category || 'Général'}
                      platform="youtube"
                      url={stream.streamUrl}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ELearning;