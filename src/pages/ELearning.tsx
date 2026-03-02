import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, BookOpen, Video, Award, Users, Clock, UserPlus, PlayCircle, Download, Eye, GraduationCap, Star, CheckCircle, Radio, Languages } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LiveStream from "@/components/LiveStream";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import ContentSubmission from "@/components/ContentSubmission";
import elearningHero from "@/assets/elearning-hero.jpg";
import courseThumbnail from "@/assets/course-thumbnail.jpg";
import logoAk from "@/assets/logo-ak.png";
import { api } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/i18n/i18n";
import DOMPurify from 'dompurify';
import countryList from 'react-select-country-list';
import TitleManager from "@/components/TitleManager";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";

interface UICourse {
  id: string;
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

const ELearning = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [courses, setCourses] = useState<UICourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showEnrollPopup, setShowEnrollPopup] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();

  const [languageFilter, setLanguageFilter] = useState<string>('Toutes langues');
  const [showOnlyPreview, setShowOnlyPreview] = useState<boolean>(false);
  const [previewItems, setPreviewItems] = useState<any[]>([]);

  const availableLanguages = Array.from(new Set(courses.flatMap((c: any) => Array.isArray(c.languages) ? c.languages : [])));

  const categories = [
    t("elearning.categories.all"),
    t("elearning.categories.agriculture"),
    t("elearning.categories.irrigation"),
    t("elearning.categories.diseases"),
    t("elearning.categories.techniques"),
    t("elearning.categories.management"),
  ];

  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const [_loadingStreams, setLoadingStreams] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await api.from('courses').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setCourses((data || []).map((c: any) => ({
          id: String(c.id ?? ''),
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
          instructor: String(c.instructor ?? c.instructorName ?? 'AKOUMA Team'),
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
        setLoadingStreams(true);
        const { data, error } = await api.from('live_streams').select('*').order('scheduledTime', { ascending: true });
        if (error) throw error;
        setLiveStreams(data || []);
      } catch {
        // silent
      } finally {
        setLoadingStreams(false);
      }
    };

    fetchCourses();
    fetchLiveStreams();
  }, []);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === t("elearning.categories.all") || selectedCategory === "Tous" || course.category === selectedCategory;
    const matchesLanguage = languageFilter === 'Toutes langues' || (Array.isArray((course as any).languages) && (course as any).languages.includes(languageFilter));
    const matchesPreview = !showOnlyPreview || ((course as any).isPreviewAvailable === true);
    return matchesSearch && matchesCategory && matchesLanguage && matchesPreview;
  });

  const allCountries = countryList().getData();
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', country: '', phone: '', activity: '' });
  
  const getCountryDialCode = (countryName: string) => {
    const map: Record<string, string> = {
      'Cameroun': '+237', "Côte d'Ivoire": '+225', 'Burkina Faso': '+226', 'Mali': '+223',
      'Sénégal': '+221', 'Bénin': '+229', 'France': '+33', 'Nigeria': '+234', 'Ghana': '+233',
    };
    return map[countryName] || '+XXX';
  };

  const handleRegistration = async () => {
    if (!registerForm.name || !registerForm.email) {
      toast({ title: t("common.error"), description: t("elearning.register.required"), variant: "destructive" });
      return;
    }
    setIsRegistering(true);
    try {
      const res = await fetch('/api/contact_messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: registerForm.name,
          email: registerForm.email,
          phone: registerForm.phone || null,
          project_type: 'Inscription E-Learning',
          message: `Pays: ${registerForm.country || 'N/A'}. Activité: ${registerForm.activity || 'N/A'}`,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: t("elearning.register.success"), description: t("elearning.register.success_desc") });
      setRegisterForm({ name: '', email: '', country: '', phone: '', activity: '' });
    } catch {
      toast({ title: t("common.error"), description: t("elearning.register.error"), variant: "destructive" });
    } finally {
      setIsRegistering(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'débutant': case 'beginner': return 'bg-green-100 text-green-800 border-green-300';
      case 'intermédiaire': case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'avancé': case 'advanced': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

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
    if (fetchedPreviewItems && fetchedPreviewItems.length > 0) {
      setPreviewItems(fetchedPreviewItems);
    }
  }, [fetchedPreviewItems]);

  const freePreviewContent = previewItems.length > 0 ? previewItems.slice(0, 3).map((it: any) => ({
    icon: it.type === 'pdf' ? Download : Video,
    title: it.title,
    desc: it.description || '',
    type: it.type,
    duration: it.type === 'video' ? undefined : undefined,
    url: it.url,
  })) : [
    { icon: Video, title: t("elearning.preview.video1"), desc: t("elearning.preview.video1_desc"), type: "video", duration: "12 min", url: "https://www.youtube.com/embed/ysz5S6PUM-U" },
    { icon: Video, title: t("elearning.preview.video2"), desc: t("elearning.preview.video2_desc"), type: "video", duration: "8 min", url: "https://www.youtube.com/embed/X2tZcCO5bQk" },
    { icon: Download, title: t("elearning.preview.pdf"), desc: t("elearning.preview.pdf_desc"), type: "pdf", url: "/lovable-uploads/agritech-guide.pdf" },
  ];

  const getPreviewIcon = (iconName: string) => {
    switch (iconName) {
      case 'FileText': return Download;
      case 'Headphones': return Radio;
      case 'Download': return Download;
      default: return Video;
    }
  };

  const stats = [
    { icon: BookOpen, value: "150+", label: t("elearning.stat.courses") },
    { icon: Users, value: "5000+", label: t("elearning.stat.students") },
    { icon: Award, value: "98%", label: t("elearning.stat.satisfaction") },
    { icon: Clock, value: "24/7", label: t("elearning.stat.access") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <TitleManager
        title={t("elearning.meta.title")}
        description={t("elearning.meta.desc")}
        canonical={window.location.origin + '/elearning'}
        image={logoAk}
      />
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-8 pb-20 overflow-hidden">
        <div className="absolute inset-0">
          <img src={elearningHero} alt={t("elearning.hero.alt")} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/50"></div>
          <div className="absolute top-20 right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        </div>
        
        <div className="relative container mx-auto px-4 sm:px-6 z-10">
          <div className="max-w-4xl">
            <Badge className="mb-6 bg-primary/20 backdrop-blur-sm text-white border border-primary/30">
              <GraduationCap className="w-4 h-4 mr-2" />
              {t("elearning.hero.badge")}
            </Badge>
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              {t("elearning.hero.title").split("E-Learning")[0]}
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">E-Learning</span>
              {t("elearning.hero.title").split("E-Learning")[1] || ""}
            </h1>
            <p className="text-base sm:text-xl md:text-2xl text-gray-200 mb-10 leading-relaxed">
              {t("elearning.hero.desc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="lg" variant="nature" className="text-lg px-8 hover:scale-105 transition-all">
                    <UserPlus className="w-5 h-5 mr-2" />
                    {t("elearning.register")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t("elearning.register.title")}</DialogTitle>
                    <DialogDescription>{t("elearning.register.desc")}</DialogDescription>
                  </DialogHeader>
                  <RegistrationForm
                    form={registerForm}
                    setForm={setRegisterForm}
                    countries={allCountries}
                    getDialCode={getCountryDialCode}
                    onSubmit={handleRegistration}
                    isLoading={isRegistering}
                    t={t}
                  />
                </DialogContent>
              </Dialog>
              <Button size="lg" variant="outline" className="text-lg px-8 bg-white/10 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white/20 hover:scale-105 transition-all" onClick={() => document.getElementById('courses-section')?.scrollIntoView({ behavior: 'smooth' })}>
                <PlayCircle className="w-5 h-5 mr-2" />
                {t("elearning.browse")}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => {
              const colors = ["from-blue-500 to-cyan-500", "from-green-500 to-emerald-500", "from-yellow-500 to-orange-500", "from-purple-500 to-pink-500"];
              return (
                <div key={i} className="text-center group hover:scale-105 transition-all duration-300">
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br ${colors[i]} rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:rotate-3 transition-all shadow-lg`}>
                    <stat.icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  <div className={`text-2xl sm:text-4xl font-bold bg-gradient-to-r ${colors[i]} bg-clip-text text-transparent mb-1`}>{stat.value}</div>
                  <div className="text-sm sm:text-base text-muted-foreground font-medium">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Free Preview Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-green-50/50 via-background to-primary/5 dark:from-green-950/20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400">
              <Eye className="w-4 h-4 mr-2" />
              {t("elearning.preview.badge")}
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t("elearning.preview.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("elearning.preview.subtitle")}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {(previewItems.length > 0 ? previewItems : freePreviewContent).map((item: any, i: number) => {
              const Icon = item.icon || getPreviewIcon(item.previewType?.icon || 'Play');
              const isVideo = item.type === 'video' || item.previewType?.name === 'video';
              return (
                <Card key={i} className="group hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border-2 border-border overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardHeader className="relative z-10">
                    <div className={`w-14 h-14 ${!isVideo ? 'bg-gradient-to-br from-red-500 to-orange-500' : 'bg-gradient-to-br from-primary to-accent'} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">{item.title}</CardTitle>
                    <CardDescription>{item.description || item.desc}</CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    {item.duration && (
                      <div className="flex items-center text-sm text-muted-foreground mb-3">
                        <Clock className="w-4 h-4 mr-1" /> {item.duration}
                      </div>
                    )}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          {!isVideo ? (
                            <><Download className="w-4 h-4 mr-2" />{t("elearning.preview.download")}</>
                          ) : (
                            <><PlayCircle className="w-4 h-4 mr-2" />{t("elearning.preview.watch")}</>
                          )}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-none">
                        <DialogHeader className="sr-only">
                          <DialogTitle>{item.title}</DialogTitle>
                          <DialogDescription>{item.description || item.desc}</DialogDescription>
                        </DialogHeader>
                        <div className="aspect-video w-full">
                          {isVideo ? (
                            <iframe 
                              src={item.url} 
                              className="w-full h-full" 
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                              allowFullScreen
                            ></iframe>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-white p-8">
                              <Download className="w-16 h-16 mb-4 text-primary" />
                              <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                              <Button asChild><a href={item.url} target="_blank" rel="noreferrer">Télécharger le document</a></Button>
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
      <section id="courses-section" className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t("elearning.catalog.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("elearning.catalog.subtitle")}
            </p>
          </div>

          {/* Search & Filters */}
          <div className="mb-8 space-y-4">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder={t("elearning.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base border-2 focus:border-primary transition-colors"
              />
            </div>
            <div className="flex flex-wrap justify-center items-center gap-4">
              <div className="flex flex-wrap justify-center gap-2">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                    className="transition-all hover:scale-105"
                  >
                    {cat}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Select value={languageFilter} onValueChange={(val) => setLanguageFilter(val)}>
                  <SelectTrigger className="w-[180px]">
                    <Languages className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Choisir une langue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Toutes langues">Toutes langues</SelectItem>
                    {availableLanguages.map((lang: any) => (
                      <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Switch id="preview-only" checked={showOnlyPreview} onCheckedChange={setShowOnlyPreview} />
                  <label htmlFor="preview-only" className="text-sm">{t("elearning.preview.only") || "Aperçu disponible"}</label>
                </div>
              </div>
            </div>
          </div>

          {/* Course Grid */}
          {loading ? (
            <LoadingSpinner size="large" text={t("elearning.loading")} />
          ) : error ? (
            <div className="text-center py-12 text-destructive">{error}</div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("elearning.none")}</h3>
              <p className="text-muted-foreground">{t("elearning.none_desc")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filteredCourses.map((course, index) => (
                <Card key={course.id} className="group hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border-2 border-border overflow-hidden" style={{ transitionDelay: `${index * 50}ms` }}>
                  {/* Thumbnail */}
                  <div className="relative overflow-hidden h-48">
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      <Badge className={`${getLevelColor(course.level)} text-xs font-semibold border`}>{course.level}</Badge>
                      {course.isCertifying && (
                        <Badge className="bg-yellow-500 text-white text-xs border-yellow-600">
                          <Award className="w-3 h-3 mr-1" />
                          {t("elearning.certifying")}
                        </Badge>
                      )}
                    {(course.isPreviewAvailable ?? false) && (
                      <Badge className="bg-blue-600 text-white text-xs border-blue-700">
                        <Eye className="w-3 h-3 mr-1" />
                        {t("elearning.preview.badge")}
                      </Badge>
                    )}
                    </div>
                    {course.price === "Gratuit" && (
                      <Badge className="absolute top-3 right-3 bg-green-500 text-white">{t("elearning.free")}</Badge>
                    )}
                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <PlayCircle className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>

                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">{course.category || t("elearning.category")}</Badge>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="font-semibold">{course.rating}</span>
                      </div>
                    </div>
                    <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-2">
                      {course.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-sm">
                      <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(course.description) }} />
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Meta info */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3 flex-wrap">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{course.duration}</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{course.students} {t("elearning.students_label")}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mb-3 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" /> {course.instructor}
                    </div>

                    {/* Price & Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="text-xl font-bold text-primary">{course.price === "Gratuit" || course.price === "0" ? t("elearning.free") : `${course.price} FCFA`}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <Button variant="outline" size="sm" asChild className="hover:scale-105 transition-transform">
                        <Link to={`/elearning/${course.id}`}>
                          <Eye className="w-4 h-4 mr-1" />
                          {t("elearning.view_program")}
                        </Link>
                      </Button>
                      <Button size="sm" onClick={() => setShowEnrollPopup(true)} className="hover:scale-105 transition-transform">
                        <UserPlus className="w-4 h-4 mr-1" />
                        {t("elearning.enroll")}
                      </Button>
                    </div>
                    {(course.isPreviewAvailable ?? false) && (
                      <div className="mt-3">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="w-full">
                              <Eye className="w-4 h-4 mr-2" />
                              {t("elearning.preview.open")}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{t("elearning.preview.title")}</DialogTitle>
                              <DialogDescription>{t("elearning.preview.subtitle") || "Consultez un extrait du cours avant de vous inscrire."}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              {previewItems.filter((it: any) => it.courseId === Number(course.id)).length === 0 ? (
                                <p className="text-muted-foreground">{t("elearning.preview.none")}</p>
                              ) : (
                                previewItems.filter((it: any) => it.courseId === Number(course.id)).map((item: any) => {
                                  const isVideo = item.type === 'video' || item.previewType?.name === 'video';
                                  return (
                                    <div key={item.id} className="border rounded p-3 space-y-3">
                                      <div className="flex items-center gap-3">
                                        {isVideo ? <PlayCircle className="w-5 h-5 text-primary" /> : <Download className="w-5 h-5 text-primary" />}
                                        <div>
                                          <div className="font-medium">{item.title}</div>
                                          {item.description && <div className="text-sm text-muted-foreground">{item.description}</div>}
                                        </div>
                                      </div>
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button variant="outline" size="sm">
                                            {isVideo ? t("elearning.preview.watch") : t("elearning.preview.download")}
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-none">
                                          <DialogHeader className="sr-only">
                                            <DialogTitle>{item.title}</DialogTitle>
                                            <DialogDescription>{item.description || item.title}</DialogDescription>
                                          </DialogHeader>
                                          <div className="aspect-video w-full">
                                            {isVideo ? (
                                              <iframe 
                                                src={item.url} 
                                                className="w-full h-full" 
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                                allowFullScreen
                                              ></iframe>
                                            ) : (
                                              <div className="w-full h-full flex flex-col items-center justify-center text-white p-8">
                                                <Download className="w-16 h-16 mb-4 text-primary" />
                                                <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                                                <Button asChild><a href={item.url} target="_blank" rel="noreferrer">Télécharger le document</a></Button>
                                              </div>
                                            )}
                                          </div>
                                        </DialogContent>
                                      </Dialog>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Content Submission */}
      <section className="py-16 bg-gradient-to-br from-green-50/50 via-blue-50/30 to-background dark:from-green-950/20 dark:via-blue-950/10">
        <div className="container mx-auto px-4 sm:px-6">
          <ContentSubmission />
        </div>
      </section>

      {/* Live Streams */}
      {liveStreams.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
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
                  isLive={stream.isLive}
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

// Registration Form Component
const RegistrationForm = ({ form, setForm, countries, getDialCode, onSubmit, isLoading, t }: any) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <label className="text-sm font-medium">{t("elearning.register.name")}</label>
      <Input placeholder={t("elearning.register.name_placeholder")} value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} />
    </div>
    <div className="space-y-2">
      <label className="text-sm font-medium">{t("elearning.register.email")}</label>
      <Input type="email" placeholder={t("elearning.register.email_placeholder")} value={form.email} onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))} />
    </div>
    <div className="space-y-2">
      <label className="text-sm font-medium">{t("elearning.register.country")}</label>
      <select className="w-full border rounded px-3 py-2 bg-background text-sm" value={form.country} onChange={e => setForm((f: any) => ({ ...f, country: e.target.value }))}>
        <option value="">{t("elearning.register.country_placeholder")}</option>
        {countries.map((c: any) => <option key={c.value} value={c.label}>{c.label}</option>)}
      </select>
    </div>
    <div className="space-y-2">
      <label className="text-sm font-medium">{t("elearning.register.activity")}</label>
      <select className="w-full border rounded px-3 py-2 bg-background text-sm" value={form.activity} onChange={e => setForm((f: any) => ({ ...f, activity: e.target.value }))}>
        <option value="">{t("elearning.register.activity_placeholder")}</option>
        <option value="farmer">{t("elearning.register.activity_farmer")}</option>
        <option value="student">{t("elearning.register.activity_student")}</option>
        <option value="technician">{t("elearning.register.activity_technician")}</option>
        <option value="researcher">{t("elearning.register.activity_researcher")}</option>
        <option value="other">{t("elearning.register.activity_other")}</option>
      </select>
    </div>
    <div className="space-y-2">
      <label className="text-sm font-medium">{t("elearning.register.phone")}</label>
      <div className="flex space-x-2">
        <div className="w-20 text-sm text-muted-foreground flex items-center justify-center border rounded-md bg-muted">
          {form.country ? getDialCode(form.country) : '+XXX'}
        </div>
        <Input placeholder={t("elearning.register.phone_placeholder")} value={form.phone} onChange={e => setForm((f: any) => ({ ...f, phone: e.target.value }))} className="flex-1" />
      </div>
    </div>
    <Button className="w-full" onClick={onSubmit} disabled={isLoading}>
      {isLoading ? t("elearning.register.loading") : t("elearning.register.submit")}
    </Button>
  </div>
);

export default ELearning;
