import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar, User, ArrowRight, Star, MapPin, CalendarDays, CalendarX2 } from 'lucide-react';
import TitleManager from '@/components/TitleManager';
import DOMPurify from 'dompurify';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useI18n } from '@/i18n';
import PageHeaderCarousel from '@/components/PageHeaderCarousel';

interface UpcomingEventsStripProps {
  events: EventItem[];
}

function UpcomingEventsStrip({ events }: UpcomingEventsStripProps) {
  const [showAll, setShowAll] = useState(false);
  const upcoming = events
    .filter((e) => new Date(e.date).getTime() >= Date.now() - 86400000)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const visible = showAll ? upcoming : upcoming.slice(0, 4);
  const hasMore = upcoming.length > 4;

  return (
    <aside
      aria-label="Événements à venir"
      className="mb-12 rounded-2xl border border-border bg-muted/30 p-4 md:p-5"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <CalendarDays className="w-4 h-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold">Événements à venir</h2>
          <span className="text-xs font-normal text-muted-foreground">
            · info complémentaire
          </span>
        </div>
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll((v) => !v)}
            className="text-xs h-8"
            aria-expanded={showAll}
          >
            {showAll ? 'Réduire' : `Voir tous (${upcoming.length})`}
            <ArrowRight className="w-3 h-3 ml-1" aria-hidden="true" />
          </Button>
        )}
      </div>

      {upcoming.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl bg-background border border-dashed border-border px-4 py-4 text-sm text-muted-foreground">
          <CalendarX2 className="w-5 h-5 text-muted-foreground/70 flex-shrink-0" aria-hidden="true" />
          <span>Aucun événement programmé pour le moment. Revenez bientôt pour découvrir nos prochains rendez-vous.</span>
        </div>
      ) : (
        <div
          className={
            showAll
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
              : 'flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x'
          }
        >
          {visible.map((event) => {
            const d = new Date(event.date);
            const day = d.toLocaleDateString('fr-FR', { day: '2-digit' });
            const month = d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');
            return (
              <Link
                key={event.id}
                to={`/events/${event.slug}`}
                aria-label={`Événement ${event.title} le ${d.toLocaleDateString('fr-FR')} à ${event.location}`}
                className={
                  'group flex items-center gap-3 rounded-xl bg-background border border-border px-3 py-2.5 hover:border-primary/40 hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
                  (showAll ? '' : 'flex-shrink-0 w-[280px] snap-start')
                }
              >
                <div className="flex-shrink-0 text-center bg-primary/10 rounded-lg px-2.5 py-1.5 min-w-[52px]">
                  <div className="text-lg font-bold leading-none text-primary">{day}</div>
                  <div className="text-[10px] uppercase font-semibold text-muted-foreground mt-0.5">{month}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {event.title}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="w-3 h-3" aria-hidden="true" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </aside>
  );
}

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
          {/* Bande supplémentaire compacte "Événements à venir" — rôle secondaire */}
          <UpcomingEventsStrip events={events} />

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
        </div>
      </section>
      <Footer />
    </div>
  );
}
