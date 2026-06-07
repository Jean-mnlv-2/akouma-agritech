import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, BookOpen, Video, Award, Users, Clock, UserPlus, PlayCircle, Download, Eye, GraduationCap, CheckCircle, Radio, Languages, RotateCcw, Share2 } from "lucide-react";
import { ArrowUpDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LiveStream from "@/components/LiveStream";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import { Skeleton } from "@/components/ui/skeleton";
import ContentSubmission from "@/components/ContentSubmission";
import ElearningCourseCard from "@/components/elearning/ElearningCourseCard";
import elearningHero from "@/assets/elearning-hero.jpg";
import courseThumbnail from "@/assets/course-thumbnail.jpg";
import kilimoLogo from "@/assets/kilimo-logo.png";
import PageHeaderCarousel from "@/components/PageHeaderCarousel";
import { api } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/i18n";
import TitleManager from "@/components/TitleManager";

import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Switch } from "@/components/ui/switch";

interface UICourse {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: string;
  category: string;
  level: string;
  duration: string;
  students: number;
  rating: number;
  isCertifying: boolean;
  thumbnail: string;
  instructor: string;
  isPreviewAvailable?: boolean;
  languages?: string[];
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

interface PreviewItem {
  id: string | number;
  courseId: number;
  typeId?: number;
  title: string;
  description?: string | null;
  contentUrl: string;
  url?: string;
  duration?: string | null;
  order?: number;
  previewType?: {
    name: string;
  };
  type?: string;
}

interface LiveStreamItem {
  id: string | number;
  title: string;
  description?: string;
  scheduledTime: string;
  url?: string;
  status: string;
  instructorName?: string;
  durationMinutes?: number;
  viewerCount?: number;
  isLive?: boolean;
  thumbnailUrl?: string;
  category?: string;
  streamUrl?: string;
}

interface PreviewDisplayItem {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  type: string;
  url: string;
  duration?: string;
}

const ELearning = () => {
  
  const { toast } = useToast();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || "");
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('cat') || "Tous");
  const [courses, setCourses] = useState<UICourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEnrollPopup, setShowEnrollPopup] = useState(false);
  const [languageFilter, setLanguageFilter] = useState<string>(() => searchParams.get('lang') || 'Toutes langues');
  const [showOnlyPreview, setShowOnlyPreview] = useState<boolean>(() => searchParams.get('preview') === '1');
  const [sortBy, setSortBy] = useState<string>(() => searchParams.get('sort') || 'recent');
  const [currentPage, setCurrentPage] = useState<number>(() => Math.max(1, Number(searchParams.get('page')) || 1));
  const PAGE_SIZE = 9;
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);
  const [liveStreams, setLiveStreams] = useState<LiveStreamItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userEnrollments, setUserEnrollments] = useState<Enrollment[]>([]);

  const availableLanguages = Array.from(new Set(courses.flatMap((c) => Array.isArray(c.languages) ? c.languages : []))).sort();
  const availableCategories = Array.from(new Set(courses.map(c => c.category).filter(Boolean))).sort();

  const categories = [
    t("elearning.categories.all"),
    ...availableCategories
  ];

  useEffect(() => {
    api.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      const user = data?.user || null;
      setCurrentUser(user);
      if (user) {
        api.request('GET', '/api/elearning_enrollments').then((res: { data: Enrollment[] }) => {
          setUserEnrollments(res.data || []);
        }).catch((err: Error) => console.error("Error fetching enrollments:", err));
      }
    });
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await api.from('courses').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setCourses((data || []).map((c: { 
          id?: number | string; 
          slug?: string; 
          title?: string; 
          description?: string; 
          price?: number | string; 
          category?: string; 
          level?: string; 
          duration?: string; 
          students?: number; 
          enrollmentsCount?: number; 
          rating?: number; 
          isCertifying?: boolean; 
          is_certifying?: boolean; 
          thumbnailUrl?: string; 
          image_url?: string; 
          instructor?: string; 
          instructorName?: string; 
          isPreviewAvailable?: boolean; 
          is_preview_available?: boolean; 
          languages?: string[]; 
        }) => ({
          id: String(c.id ?? ''),
          slug: String(c.slug || c.id || ''),
          title: String(c.title ?? ''),
          description: String(c.description ?? ''),
          price: String(c.price ?? 'Gratuit'),
          category: String(c.category ?? ''),
          level: String(c.level ?? 'Débutant'),
          duration: String(c.duration ?? '—'),
          students: Number(c.students ?? c.enrollmentsCount ?? 0),
          rating: Number(c.rating ?? 4.5),
          isCertifying: Boolean(c.isCertifying ?? c.is_certifying ?? true),
          thumbnail: String(c.thumbnailUrl ?? c.image_url ?? courseThumbnail),
          instructor: String(c.instructor ?? c.instructorName ?? 'KILIMO Team'),
          isPreviewAvailable: Boolean(c.isPreviewAvailable ?? c.is_preview_available ?? false),
          languages: Array.isArray(c.languages) ? c.languages : [],
        })));
      } catch {
        setError(t("elearning.error"));
        setCourses([]);
      }
      setLoading(false);
    };

    const fetchLiveStreams = async () => {
      try {
        const { data, error } = await api.from('live_streams').select('*').order('scheduledTime', { ascending: true });
        if (error) throw error;
        setLiveStreams(data || []);
      } catch { /* silent */ }
    };

    fetchCourses();
    fetchLiveStreams();
  }, [t]);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === t("elearning.categories.all") || selectedCategory === "Tous" || course.category === selectedCategory;
    const matchesLanguage = languageFilter === 'Toutes langues' || (Array.isArray(course.languages) && course.languages.includes(languageFilter));
    const matchesPreview = !showOnlyPreview || course.isPreviewAvailable === true;
    return matchesSearch && matchesCategory && matchesLanguage && matchesPreview;
  });

  // Tri
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    switch (sortBy) {
      case 'popular': return (b.students || 0) - (a.students || 0);
      case 'rating': return (b.rating || 0) - (a.rating || 0);
      case 'price_asc': return (Number(a.price) || 0) - (Number(b.price) || 0);
      case 'price_desc': return (Number(b.price) || 0) - (Number(a.price) || 0);
      case 'title': return a.title.localeCompare(b.title);
      case 'recent':
      default: return 0; // déjà trié par created_at desc côté API
    }
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, languageFilter, showOnlyPreview, sortBy]);

  // Sync filters to URL (shareable state)
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    const setOrDelete = (k: string, v: string, def: string) => {
      if (v && v !== def) next.set(k, v); else next.delete(k);
    };
    setOrDelete('q', searchQuery, '');
    setOrDelete('cat', selectedCategory, 'Tous');
    setOrDelete('lang', languageFilter, 'Toutes langues');
    setOrDelete('sort', sortBy, 'recent');
    if (showOnlyPreview) next.set('preview', '1'); else next.delete('preview');
    if (currentPage > 1) next.set('page', String(currentPage)); else next.delete('page');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, languageFilter, showOnlyPreview, currentPage]);

  const previewCount = courses.filter(c => c.isPreviewAvailable).length;
  const totalPages = Math.max(1, Math.ceil(sortedCourses.length / PAGE_SIZE));
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const paginatedCourses = sortedCourses.slice(pageStart, pageStart + PAGE_SIZE);

  const { data: fetchedPreviewItems = [] } = useQuery({
    queryKey: ['course-preview-items'],
    queryFn: async () => {
      const res = await api.request('GET', '/api/course_preview_items');
      const items = Array.isArray(res) ? res : res.data;
      return items || [];
    },
    staleTime: 60000,
  });

  useEffect(() => {
    if (fetchedPreviewItems.length > 0) setPreviewItems(fetchedPreviewItems);
  }, [fetchedPreviewItems]);

  const freePreviewContent: PreviewDisplayItem[] = previewItems.length > 0 ? 
    [...previewItems]
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .slice(0, 3)
      .map((it: PreviewItem) => ({
        icon: it.type === 'pdf' ? Download : Video,
        title: it.title,
        desc: it.description || '',
        type: it.type || 'video',
        url: it.contentUrl || it.url || '',
        duration: it.duration || undefined,
      })) : [
    { icon: Video, title: t("elearning.preview.video1"), desc: t("elearning.preview.video1_desc"), type: "video", duration: "12 min", url: "https://www.youtube.com/embed/ysz5S6PUM-U" },
    { icon: Video, title: t("elearning.preview.video2"), desc: t("elearning.preview.video2_desc"), type: "video", duration: "8 min", url: "https://www.youtube.com/embed/X2tZcCO5bQk" },
    { icon: Download, title: t("elearning.preview.pdf"), desc: t("elearning.preview.pdf_desc"), type: "pdf", url: "/lovable-uploads/agritech-guide.pdf" },
  ];



  const handleCourseEnroll = async (courseId: string, courseTitle: string) => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }

    try {
      setLoading(true);
      await api.request('POST', '/api/elearning_enrollments', {
        body: {
          courseId: Number(courseId)
        }
      });
      toast({ 
        title: t("elearning.enroll.success") || "Inscription réussie !", 
        description: (t("elearning.enroll.success_desc") || "Vous êtes maintenant inscrit au cours : ") + courseTitle 
      });
    } catch (err: unknown) {
      console.error(err);
      let errorMessage = t("elearning.enroll.error") || "Impossible de s'inscrire. Réessayez.";
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response: { data?: { error?: string } } };
        errorMessage = axiosErr.response.data?.error || errorMessage;
      }
      toast({ 
        title: t("common.error") || "Erreur", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { icon: BookOpen, value: "25+", label: t("elearning.stat.courses"), color: "from-blue-500 to-cyan-500" },
    { icon: Users, value: "500+", label: t("elearning.stat.students"), color: "from-green-500 to-emerald-500" },
    { icon: Award, value: "95%", label: t("elearning.stat.satisfaction"), color: "from-yellow-500 to-orange-500" },
    { icon: Clock, value: "24/7", label: t("elearning.stat.access"), color: "from-purple-500 to-pink-500" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <TitleManager
        title={t("elearning.meta.title")}
        description={t("elearning.meta.desc")}
        canonical={window.location.origin + '/elearning'}
        image={kilimoLogo}
      />
      <Header />

      {/* Hero Section */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <PageHeaderCarousel
          pageKey="elearning"
          fallbackImage={elearningHero}
          fallbackAlt={t("elearning.hero.alt")}
        />
        
        {/* Animated Background Shapes */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative container mx-auto px-4 sm:px-6 z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-8 bg-primary/20 backdrop-blur-md text-white border border-white/20 px-6 py-2 text-sm font-medium animate-in fade-in slide-in-from-bottom-4 duration-700">
              <GraduationCap className="w-5 h-5 mr-2 text-primary-foreground" />
              {t("elearning.hero.badge")}
            </Badge>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
              {t("elearning.hero.title").split("E-Learning")[0]}
              <span className="relative">
                <span className="bg-gradient-to-r from-primary via-green-400 to-accent bg-clip-text text-transparent">E-Learning</span>
                <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent rounded-full opacity-50" />
              </span>
              {t("elearning.hero.title").split("E-Learning")[1] || ""}
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-12 leading-relaxed max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 font-medium">
              {t("elearning.hero.desc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-700">
              {currentUser ? (
                <Button size="xl" variant="nature" className="text-lg px-10 h-16 shadow-2xl shadow-primary/20 group" onClick={() => document.getElementById('courses-section')?.scrollIntoView({ behavior: 'smooth' })}>
                  <BookOpen className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                  {t("elearning.browse")}
                </Button>
              ) : (
                <>
                  <Button size="xl" variant="nature" className="text-lg px-10 h-16 shadow-2xl shadow-primary/20 group" asChild>
                    <Link to="/auth">
                      <UserPlus className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                      {t("elearning.register")}
                    </Link>
                  </Button>
                  <Button size="xl" variant="outline" className="text-lg px-10 h-16 bg-white/5 backdrop-blur-xl border-2 border-white/20 text-white hover:bg-white/10 transition-all duration-300" onClick={() => document.getElementById('courses-section')?.scrollIntoView({ behavior: 'smooth' })}>
                    <PlayCircle className="w-6 h-6 mr-3 text-primary" />
                    {t("elearning.browse")}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section with Glassmorphism */}
      <section className="relative -mt-12 mb-20 z-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="bg-background/60 backdrop-blur-2xl border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] rounded-[2.5rem] p-8 md:p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              {stats.map((stat, i) => (
                <div key={i} className="text-center group relative">
                  <div className={`w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br ${stat.color} rounded-3xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-all duration-500 shadow-xl group-hover:rotate-3`}>
                    <stat.icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                  </div>
                  <div className={`text-3xl md:text-4xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>{stat.value}</div>
                  <div className="text-sm md:text-base text-muted-foreground font-semibold tracking-wide uppercase">{stat.label}</div>
                  {i < stats.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-6 w-px h-12 bg-border -translate-y-1/2" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Free Preview Section */}
      <section className="py-20 bg-gradient-to-b from-background via-green-50/30 to-background dark:via-green-950/10">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-6 px-4 py-1.5 border-primary/30 text-primary bg-primary/5 font-semibold tracking-wider uppercase text-xs">
              <Eye className="w-4 h-4 mr-2" />
              {t("elearning.preview.badge")}
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-bold mb-6 tracking-tight">
              {t("elearning.preview.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t("elearning.preview.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {freePreviewContent.map((item, i) => {
              const Icon = item.icon;
              const isVideo = item.type === 'video';
              const description = item.desc;
              const duration = item.duration;
              return (
                <Card key={i} className="group relative bg-card/50 backdrop-blur-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 hover:-translate-y-2 border-2 border-border overflow-hidden rounded-3xl">
                  <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40 ${!isVideo ? 'bg-red-500' : 'bg-primary'}`} />
                  
                  <CardHeader className="pt-8 px-8 pb-4">
                    <div className={`w-14 h-14 ${!isVideo ? 'bg-gradient-to-br from-red-500 to-orange-500' : 'bg-gradient-to-br from-primary to-accent'} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-black/5`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold mb-3 group-hover:text-primary transition-colors leading-tight">{item.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed line-clamp-2">{description}</CardDescription>
                  </CardHeader>
                  <CardContent className="px-8 pb-8">
                    {duration && (
                      <div className="flex items-center text-sm font-semibold text-muted-foreground mb-6 bg-secondary/50 w-fit px-3 py-1 rounded-full">
                        <Clock className="w-4 h-4 mr-2 text-primary" /> {duration}
                      </div>
                    )}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant={isVideo ? "nature" : "outline"} className={`w-full h-12 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-300 ${!isVideo ? 'hover:bg-red-50 hover:text-red-600 hover:border-red-200' : ''}`}>
                          {!isVideo ? (
                            <><Download className="w-4 h-4 mr-2" />{t("elearning.preview.download")}</>
                          ) : (
                            <><PlayCircle className="w-4 h-4 mr-2" />{t("elearning.preview.watch")}</>
                          )}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-none rounded-3xl">
                        <DialogHeader className="sr-only">
                          <DialogTitle>{item.title}</DialogTitle>
                          <DialogDescription>{description}</DialogDescription>
                        </DialogHeader>
                        <div className="aspect-video w-full">
                          {isVideo ? (
                            <iframe src={item.url} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-white p-12 bg-gradient-to-br from-slate-900 to-slate-800">
                              <div className="w-24 h-24 bg-primary/20 rounded-3xl flex items-center justify-center mb-8">
                                <Download className="w-12 h-12 text-primary" />
                              </div>
                              <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                              <p className="text-slate-400 mb-8 text-center max-w-md">{description}</p>
                              <Button size="lg" variant="nature" className="px-8" asChild>
                                <a href={item.url} target="_blank" rel="noreferrer">
                                  <Download className="w-5 h-5 mr-2" />
                                  Télécharger le guide complet
                                </a>
                              </Button>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Course Catalog */}
      <section id="courses-section" className="py-14 md:py-20 scroll-mt-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t("elearning.catalog.title")}
            </h2>
            <p className="text-base text-muted-foreground max-w-xl mx-auto">
              {t("elearning.catalog.subtitle")}
            </p>
          </div>

          {/* Search & Filters - Professional Layout */}
          {(() => {
            const hasActiveFilters =
              !!searchQuery ||
              (selectedCategory && selectedCategory !== t("elearning.categories.all") && selectedCategory !== "Tous") ||
              languageFilter !== 'Toutes langues' ||
              showOnlyPreview;
            const resetFilters = () => {
              setSearchQuery('');
              setSelectedCategory(t("elearning.categories.all") || 'Tous');
              setLanguageFilter('Toutes langues');
              setShowOnlyPreview(false);
            };
            return (
            <div
              role="region"
              aria-label="Filtres du catalogue de cours"
              className="mb-12 space-y-5 bg-card/70 backdrop-blur-md p-4 sm:p-6 md:p-8 rounded-3xl border-2 border-border shadow-xl sticky top-16 z-30"
            >
              <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:items-center lg:justify-between">
                <div className="relative w-full lg:max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5" aria-hidden="true" />
                  <Input
                    placeholder={t("elearning.search")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Rechercher un cours"
                    className="pl-12 h-12 sm:h-14 text-base sm:text-lg border-2 border-border focus:border-primary rounded-2xl transition-all shadow-inner bg-background/50"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  <Select value={languageFilter} onValueChange={setLanguageFilter}>
                    <SelectTrigger
                      aria-label="Filtrer par langue"
                      className="w-full sm:w-[180px] h-12 sm:h-14 border-2 rounded-2xl bg-background/50 font-semibold"
                    >
                      <div className="flex items-center">
                        <Languages className="w-5 h-5 mr-2 text-primary" aria-hidden="true" />
                        <SelectValue placeholder="Langue" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                      <SelectItem value="Toutes langues" className="font-medium">Toutes langues</SelectItem>
                      {availableLanguages.map((lang) => (
                        <SelectItem key={lang} value={lang} className="font-medium">{lang}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <label
                    htmlFor="preview-only"
                    className="flex items-center gap-3 bg-background/50 px-4 h-12 sm:h-14 rounded-2xl border-2 border-border flex-1 sm:flex-none cursor-pointer min-w-0"
                  >
                    <Switch
                      id="preview-only"
                      checked={showOnlyPreview}
                      onCheckedChange={setShowOnlyPreview}
                      aria-label="N'afficher que les cours avec aperçu gratuit"
                      aria-checked={showOnlyPreview}
                      className="data-[state=checked]:bg-primary shrink-0"
                    />
                    <span className="text-sm font-semibold whitespace-nowrap text-foreground truncate">
                      Aperçu gratuit
                    </span>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold shrink-0">
                      {previewCount}
                    </Badge>
                  </label>

                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={async () => {
                      await navigator.clipboard.writeText(window.location.href);
                      toast({
                        title: 'Lien copié !',
                        description: 'Le lien partageable a été copié dans le presse-papiers.',
                      });
                    }}
                    className="h-12 sm:h-14 rounded-2xl font-semibold"
                  >
                    <Share2 className="w-4 h-4 mr-2" aria-hidden="true" />
                    Copier le lien
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={resetFilters}
                    disabled={!hasActiveFilters}
                    aria-label="Réinitialiser tous les filtres"
                    aria-disabled={!hasActiveFilters}
                    className="h-12 sm:h-14 rounded-2xl font-semibold"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" aria-hidden="true" />
                    Réinitialiser
                  </Button>
                </div>
              </div>

              <div
                role="group"
                aria-label="Filtrer par catégorie"
                className="flex flex-wrap gap-2 sm:gap-3 justify-center lg:justify-start border-t border-border pt-5"
              >
                {categories.map((cat) => {
                  const active = selectedCategory === cat;
                  return (
                    <Button
                      key={cat}
                      variant={active ? "nature" : "outline"}
                      size="default"
                      onClick={() => setSelectedCategory(cat)}
                      aria-pressed={active}
                      className={`rounded-xl px-4 sm:px-6 h-10 sm:h-12 font-semibold transition-all duration-300 ${active ? 'shadow-lg shadow-primary/20' : 'hover:border-primary/50'}`}
                    >
                      {cat}
                    </Button>
                  );
                })}
              </div>

              <p className="sr-only" aria-live="polite">
                {filteredCourses.length} cours correspondent aux filtres sélectionnés.
              </p>
            </div>
            );
          })()}

          {/* Course Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true" aria-live="polite">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border overflow-hidden bg-card">
                  <Skeleton className="h-44 w-full" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <div className="flex justify-between pt-2">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">{error}</div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-40" />
              <h3 className="text-lg font-semibold mb-2">{t("elearning.none")}</h3>
              <p className="text-muted-foreground">{t("elearning.none_desc")}</p>
            </div>
          ) : (
            <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedCourses.map((course, index) => (
                <ElearningCourseCard
                    key={course.id}
                    course={course}
                    currentUser={currentUser}
                    isEnrolled={userEnrollments.some((e: Enrollment) => e.courseId === Number(course.id))}
                    previewItems={previewItems}
                    onEnroll={() => handleCourseEnroll(course.id, course.title)}
                    t={t}
                    index={index}
                  />
              ))}
            </div>
            {totalPages > 1 && (
              <nav className="mt-10 flex items-center justify-center gap-2 flex-wrap" aria-label="Pagination des cours">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Page précédente"
                >
                  Précédent
                </Button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? "nature" : "outline"}
                      size="sm"
                      className="min-w-[40px]"
                      onClick={() => setCurrentPage(page)}
                      aria-label={`Page ${page}`}
                      aria-current={page === currentPage ? "page" : undefined}
                    >
                      {page}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Page suivante"
                >
                  Suivant
                </Button>
              </nav>
            )}
            <p className="text-center text-sm text-muted-foreground mt-4">
              {filteredCourses.length} cours • Page {currentPage} / {totalPages}
            </p>
            </>
          )}
        </div>
      </section>

      {/* Content Submission */}
      <section className="py-14 bg-gradient-to-br from-green-50/50 via-blue-50/30 to-background dark:from-green-950/20 dark:via-blue-950/10">
        <div className="container mx-auto px-4 sm:px-6">
          <ContentSubmission />
        </div>
      </section>

      {/* Live Streams */}
      {liveStreams.length > 0 && (
        <section className="py-14">
          <div className="container mx-auto px-4 sm:px-6">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              <Radio className="w-6 h-6 inline mr-2 text-red-500" />
              {t("elearning.tabs.live")}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {liveStreams.map((stream) => (
                <LiveStream
                  key={stream.id}
                  id={stream.id.toString()}
                  title={stream.title}
                  instructor={stream.instructorName || t("elearning.instructor")}
                  scheduledTime={stream.scheduledTime ? new Date(stream.scheduledTime).toLocaleString('fr-FR') : t("elearning.scheduled")}
                  duration={stream.durationMinutes ? `${stream.durationMinutes}min` : t("elearning.duration")}
                  viewers={stream.viewerCount || 0}
                  isLive={stream.isLive || false}
                  description={stream.description || ''}
                  thumbnail={stream.thumbnailUrl || courseThumbnail}
                  category={stream.category || t("elearning.category")}
                  platform="youtube"
                  url={stream.streamUrl}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Enrollment Popup */}
      <Dialog open={showEnrollPopup} onOpenChange={setShowEnrollPopup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              {t("elearning.enroll_popup.title")}
            </DialogTitle>
            <DialogDescription>{t("elearning.enroll_popup.desc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-primary/5 rounded-lg p-4 text-center">
              <CheckCircle className="w-10 h-10 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t("elearning.enroll_popup.benefit")}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" asChild>
                <Link to="/auth">{t("elearning.enroll_popup.login")}</Link>
              </Button>
              <Button asChild>
                <Link to="/auth">{t("elearning.enroll_popup.signup")}</Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default ELearning;
