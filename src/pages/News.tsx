import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar, User, ArrowRight, Star, MapPin, CalendarDays } from 'lucide-react';
import TitleManager from '@/components/TitleManager';
import DOMPurify from 'dompurify';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useI18n } from '@/i18n';
import PageHeaderCarousel from '@/components/PageHeaderCarousel';

interface NewsItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  image: string;
  featured: boolean;
  date: string;
  category: string;
  read_time: number;
}

interface EventItem {
  id: number;
  title: string;
  slug: string;
  description?: string;
  date: string;
  location: string;
  imageUrl?: string;
}

export default function News() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();
  const { t } = useI18n();

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string) || window.location.origin;

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedCategory !== 'all' && selectedCategory !== 'evenements') {
          params.set('category', selectedCategory);
        }
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));
        params.set('is_published', 'true');
        
        const url = new URL(`/api/news?${params.toString()}`, apiBaseUrl);
        const res = await fetch(url.toString(), { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load news');
        const body = await res.json();
        
        const items = body.data || [];
        if (body.meta) {
          setTotalPages(body.meta.totalPages || 1);
        }

        const normalized = items.map((item: {
          id: number | string;
          slug?: string;
          title?: string;
          excerpt?: string;
          description?: string;
          content?: string;
          author?: string;
          author_name?: string;
          imageUrl?: string;
          image_url?: string;
          isFeatured?: boolean;
          is_featured?: boolean;
          createdAt?: string;
          created_at?: string;
          category?: string;
          read_time?: number | string;
        }) => ({
          id: String(item.id),
          slug: item.slug || String(item.id),
          title: item.title ?? '',
          excerpt: item.excerpt ?? item.description ?? '',
          content: item.content ?? '',
          author: item.author || item.author_name || 'KILIMO Team',
          image: item.imageUrl || item.image_url || '/kilimo-logo.png',
          featured: Boolean(item.isFeatured ?? item.is_featured ?? false),
          date: item.createdAt || item.created_at || new Date().toISOString(),
          category: item.category ?? 'Général',
          read_time: Number(item.read_time ?? 5),
        }));
        setNews(normalized);
      } catch (e) {
        console.error('Error fetching news:', e);
        toast({ title: t('common.error'), description: t('news.load_error'), variant: 'destructive' });
        setNews([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [selectedCategory, page, pageSize, toast, t, apiBaseUrl]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/events`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load events');
        const body = await res.json();
        setEvents(Array.isArray(body) ? body : (body.data || []));
      } catch (e) {
        console.error('Error fetching events:', e);
      }
    };
    fetchEvents();
  }, [apiBaseUrl]);

  const categories = [
    { id: 'all', name: t('news.cat.all') },
    { id: 'agriculture', name: 'Agriculture' },
    { id: 'technologie', name: 'Technologie' },
    { id: 'innovation', name: 'Innovation' },
    { id: 'environnement', name: 'Environnement' },
    { id: 'economie', name: 'Économie' },
    { id: 'formation', name: 'Formation' }
  ];

  useEffect(() => {
    setPage(1);
  }, [selectedCategory]);

  const filteredNews = news;

  const featuredNews = news.filter(item => item.featured);
  const regularNews = filteredNews.filter(item => !item.featured);

  const handlePageChange = (direction: 'prev' | 'next') => {
    setPage((p) => Math.max(1, p + (direction === 'next' ? 1 : -1)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TitleManager
          title={t('nav.news')}
          description={t('news.meta.desc')}
          image="/kilimo-logo.png"
        />
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TitleManager
        title={t('nav.news')}
        description={t('news.meta.desc')}
        image="/kilimo-logo.png"
      />
      <Header />
      {/* Hero Section - Modern Design */}
      <section className="relative pt-8 pb-20 overflow-hidden">
        <PageHeaderCarousel
          pageKey="news"
          fallbackImage="/lovable-uploads/4fa2637d-1bbd-47d7-aceb-da19ce83532d.png"
          fallbackAlt={t('news.hero.alt')}
          overlayClassName="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/50"
        />
        <div className="relative container mx-auto px-6 z-10">
          <div className="max-w-4xl">
            <Badge className="mb-6 bg-primary/20 backdrop-blur-sm text-white border-2 border-primary/30 hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4 mr-2" />
              Actualités Agricoles
            </Badge>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">{t('news.hero.title1')}</span> {t('news.hero.title2')}
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-10 leading-relaxed">{t('news.hero.desc')}</p>
            <div className="flex flex-wrap gap-4">
              <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 hover:scale-105 transition-transform">
                <Calendar className="w-4 h-4 mr-2" />
                {t('news.badge.daily')}
              </Badge>
              <Badge variant="secondary" className="bg-green-500/20 backdrop-blur-sm text-green-300 border-2 border-green-500/30 hover:scale-105 transition-transform">
                <Star className="w-4 h-4 mr-2" />
                {t('news.badge.premium')}
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-6">
          {/* Onglets : Actualités / Événements — même niveau hiérarchique */}
          <Tabs defaultValue="news" className="w-full">
            <TabsList className="mx-auto mb-8 grid w-full max-w-md grid-cols-2 h-12">
              <TabsTrigger value="news" className="text-base gap-2">
                <Newspaper className="w-4 h-4" />
                Actualités
              </TabsTrigger>
              <TabsTrigger value="events" className="text-base gap-2">
                <CalendarDays className="w-4 h-4" />
                Événements
                {events.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{events.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="news" className="mt-0">
          {/* Filtres par catégorie */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((category) => (
              <Button key={category.id} variant={selectedCategory === category.id ? 'default' : 'outline'} onClick={() => { setPage(1); setSelectedCategory(category.id); }} className="transition-all duration-200 hover:scale-105">{category.name}</Button>
            ))}
          </div>

          {/* Actualités en vedette - Enhanced */}
          {featuredNews.length > 0 && (
            <div className="mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8 flex items-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                <Star className="w-8 h-8 mr-3 text-yellow-500 fill-yellow-500" />
                {t('news.featured')}
              </h2>
              <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                {featuredNews.slice(0, 2).map((item, index) => {
                  const delay = index * 100;
                  return (
                    <Card 
                      key={item.id} 
                      className="group hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-card/90 backdrop-blur-sm border-2 border-border overflow-hidden relative"
                      style={{ transitionDelay: `${delay}ms` }}
                    >
                      <div className="relative overflow-hidden">
                        <img 
                          src={item.image} 
                          alt={item.title} 
                          className="w-full h-64 object-contain bg-muted/30 group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <Badge className="absolute top-4 left-4 bg-yellow-500 text-white shadow-lg">{t('news.featured')}</Badge>
                      </div>
                      <CardHeader className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="secondary" className="bg-primary/10 text-primary border border-primary/20">{item.category}</Badge>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(item.date).toLocaleDateString()}
                          </div>
                        </div>
                        <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors mb-2">{item.title}</CardTitle>
                        <CardDescription className="line-clamp-2 text-sm">{item.excerpt}</CardDescription>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <User className="w-4 h-4 mr-1" />
                            {item.author}
                          </div>
                          <Button asChild variant="ghost" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                            <Link to={`/news/${item.slug}`}>
                              {t('news.read_more')}
                              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actualités régulières - Enhanced */}
          {regularNews.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {regularNews.map((item, index) => {
                const delay = index * 50;
                return (
                  <Card 
                    key={item.id} 
                    className="group hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-card/90 backdrop-blur-sm border-2 border-border overflow-hidden relative"
                    style={{ transitionDelay: `${delay}ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-full h-56 object-contain bg-muted/30 group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground shadow-lg border-none font-semibold">
                        {item.category}
                      </Badge>
                    </div>
                    <CardHeader className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(item.date).toLocaleDateString()}
                        </div>
                        <span className="text-sm text-muted-foreground">{item.read_time} {t('news.read_time')}</span>
                      </div>
                      <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-2 mb-2">{item.title}</CardTitle>
                      <CardDescription className="line-clamp-3 text-sm">
                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.excerpt) }} />
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <User className="w-4 h-4 mr-1" />
                          {item.author}
                        </div>
                        <Button asChild variant="ghost" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                          <Link to={`/news/${item.slug}`}>
                            {t('news.read_more')}
                            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            ) : !loading && featuredNews.length === 0 && (
              <div className="text-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed border-muted-foreground/20 max-w-3xl mx-auto">
                <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Star className="w-10 h-10 text-primary/40" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  {selectedCategory === 'all' 
                    ? "Aucune actualité disponible" 
                    : `Pas d'actualités dans la catégorie "${categories.find(c => c.id === selectedCategory)?.name}"`
                  }
                </h3>
                <p className="text-muted-foreground text-lg max-w-md mx-auto mb-8">
                  Nous préparons actuellement du nouveau contenu passionnant pour cette section. Restez à l'écoute !
                </p>
                {selectedCategory !== 'all' && (
                  <Button onClick={() => setSelectedCategory('all')} variant="outline" className="hover:bg-primary hover:text-primary-foreground transition-all">
                    Voir toutes les actualités
                  </Button>
                )}
              </div>
            )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-10 mb-16">
              <Button 
                variant="outline" 
                disabled={page === 1} 
                onClick={() => handlePageChange('prev')}
              >
                Précédent
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} sur {totalPages}
              </span>
              <Button 
                variant="outline" 
                disabled={page === totalPages} 
                onClick={() => handlePageChange('next')}
              >
                Suivant
              </Button>
            </div>
          )}
            </TabsContent>

            {/* ===== Section Événements — plein niveau, plus une sidebar ===== */}
            <TabsContent value="events" className="mt-0">
              <div className="mb-10 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent inline-flex items-center gap-3">
                  <CalendarDays className="w-8 h-8 text-primary" />
                  Événements KILIMO
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Rencontres, salons, formations en présentiel et webinaires — retrouvez tous nos rendez-vous à venir.
                </p>
              </div>

              {events.length === 0 ? (
                <div className="text-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed border-muted-foreground/20 max-w-3xl mx-auto">
                  <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CalendarDays className="w-10 h-10 text-primary/40" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">Aucun événement programmé</h3>
                  <p className="text-muted-foreground text-lg max-w-md mx-auto">
                    De nouveaux événements seront bientôt annoncés. Revenez prochainement !
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {events.map((event, index) => {
                    const eventDate = new Date(event.date);
                    const day = eventDate.toLocaleDateString('fr-FR', { day: '2-digit' });
                    const month = eventDate.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');
                    const isPast = eventDate.getTime() < Date.now();
                    return (
                      <Link
                        key={event.id}
                        to={`/events/${event.slug}`}
                        className="group"
                        style={{ transitionDelay: `${index * 50}ms` }}
                      >
                        <Card className="h-full hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-card/90 backdrop-blur-sm border-2 border-border overflow-hidden relative">
                          <div className="relative overflow-hidden aspect-[16/9] bg-muted">
                            {event.imageUrl ? (
                              <img
                                src={event.imageUrl}
                                alt={event.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                                <CalendarDays className="w-16 h-16 text-primary/40" />
                              </div>
                            )}
                            {/* Badge date en overlay */}
                            <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg text-center min-w-[60px]">
                              <div className="text-2xl font-bold leading-none text-primary">{day}</div>
                              <div className="text-xs uppercase font-semibold text-muted-foreground mt-1">{month}</div>
                            </div>
                            {isPast && (
                              <Badge className="absolute top-4 right-4 bg-muted text-muted-foreground border-none">
                                Passé
                              </Badge>
                            )}
                          </div>
                          <CardHeader>
                            <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-2 mb-2">
                              {event.title}
                            </CardTitle>
                            {event.description && (
                              <CardDescription className="line-clamp-2 text-sm">
                                {event.description.replace(/<[^>]*>/g, '')}
                              </CardDescription>
                            )}
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <MapPin className="w-4 h-4 text-primary" />
                                <span className="line-clamp-1">{event.location}</span>
                              </div>
                              <span className="inline-flex items-center gap-1 text-primary font-medium group-hover:gap-2 transition-all">
                                Détails
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>

        </div>
      </section>
      <Footer />
    </div>
  );
}
