import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Star } from 'lucide-react';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useI18n } from '@/i18n';
import PageHeaderCarousel from '@/components/PageHeaderCarousel';
import { NewsCard } from '@/components/news/NewsCard';
import { NewsCardSkeleton } from '@/components/news/CardSkeletons';
import { UpcomingEventsStrip } from '@/components/news/UpcomingEventsStrip';
import { useStandalonePwa } from '@/hooks/use-standalone-pwa';
import NewsAppView from '@/components/pwa/news/NewsAppView';

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
  id: number | string;
  title: string;
  slug: string;
  description?: string;
  date: string;
  location: string;
  imageUrl?: string;
}

export default function News() {
  const isStandalone = useStandalonePwa();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
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
        setEventsLoading(true);
        const res = await fetch(`${apiBaseUrl}/api/events`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load events');
        const body = await res.json();
        setEvents(Array.isArray(body) ? body : (body.data || []));
      } catch (e) {
        console.error('Error fetching events:', e);
      } finally {
        setEventsLoading(false);
      }
    };
    fetchEvents();
  }, [apiBaseUrl]);

  // Dérivées des actualités réelles plutôt qu'une liste figée : plusieurs
  // catégories codées en dur ("Agriculture", "Technologie"...) n'existaient
  // dans aucun article, et "Régional" (la plus grande catégorie réelle)
  // n'avait aucun bouton — filtres silencieusement cassés ou incomplets.
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([
    { id: 'all', name: t('news.cat.all') },
  ]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const url = new URL(`/api/news?is_published=true&pageSize=1000`, apiBaseUrl);
        const res = await fetch(url.toString(), { credentials: 'include' });
        if (!res.ok) return;
        const body = await res.json();
        const items: { category?: string }[] = body.data || [];
        const unique = Array.from(new Set(items.map((i) => i.category).filter(Boolean))).sort() as string[];
        setCategories([{ id: 'all', name: t('news.cat.all') }, ...unique.map((c) => ({ id: c, name: c }))]);
      } catch (e) {
        console.error('Error fetching news categories:', e);
      }
    };
    fetchCategories();
  }, [apiBaseUrl, t]);

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

  const seo = (
    <SEO
      title={t('nav.news')}
      description={t('news.meta.desc')}
      image="/kilimo-logo.png"
      type="website"
      jsonLd={[
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": t('nav.news'),
          "description": t('news.meta.desc'),
          "url": window.location.href,
          "publisher": {
            "@type": "Organization",
            "name": "KILIMO Agritech",
            "logo": {
              "@type": "ImageObject",
              "url": `${window.location.origin}/kilimo-logo.png`
            }
          }
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Accueil", "item": window.location.origin + "/" },
            { "@type": "ListItem", "position": 2, "name": "Actualités & Événements", "item": window.location.href }
          ]
        }
      ]}
    />
  );

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-background">
        {seo}
        <Header />
        <NewsAppView
          news={news}
          featuredNews={featuredNews}
          regularNews={regularNews}
          loading={loading}
          events={events}
          eventsLoading={eventsLoading}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          page={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          readTimeLabel={t('news.read_time')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {seo}
      <Header />
      {/* Hero Section - Modern Design */}
      <section className="relative pt-8 pb-20 overflow-hidden">
        <PageHeaderCarousel
          pageKey="news"
          fallbackImage="/kilimo-logo.png"
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
            <p className="text-xl md:text-2xl text-white/90 mb-10 leading-relaxed">{t('news.hero.desc')}</p>
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
      <main id="main-content" className="py-16 bg-background">
        <div className="container mx-auto px-6">
          {/* Bande supplémentaire compacte "Événements à venir" — rôle secondaire */}
          <UpcomingEventsStrip events={events} loading={eventsLoading} />

          {/* Filtres par catégorie */}
          <div
            role="tablist"
            aria-label="Filtrer les actualités par catégorie"
            className="flex flex-wrap justify-center gap-2 mb-8"
          >
            {categories.map((category) => (
              <Button
                key={category.id}
                role="tab"
                aria-selected={selectedCategory === category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                onClick={() => { setPage(1); setSelectedCategory(category.id); }}
                className="min-h-11 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {category.name}
              </Button>
            ))}
          </div>

          {loading ? (
            <div
              aria-busy="true"
              aria-label="Chargement des actualités"
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <NewsCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
          {/* Actualités en vedette - Enhanced */}
          {featuredNews.length > 0 && (
            <section aria-labelledby="featured-heading" className="mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8 flex items-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                <Star className="w-8 h-8 mr-3 text-yellow-500 fill-yellow-500" aria-hidden="true" />
                <span id="featured-heading">{t('news.featured')}</span>
              </h2>
              <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                {featuredNews.slice(0, 2).map((item) => (
                  <NewsCard
                    key={item.id}
                    item={item}
                    variant="featured"
                    readMoreLabel={t('news.read_more')}
                    readTimeLabel={t('news.read_time')}
                    featuredLabel={t('news.featured')}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Actualités régulières - Enhanced */}
          {regularNews.length > 0 ? (
              <section aria-label="Liste des actualités" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {regularNews.map((item) => (
                  <NewsCard
                    key={item.id}
                    item={item}
                    readMoreLabel={t('news.read_more')}
                    readTimeLabel={t('news.read_time')}
                  />
                ))}
              </section>
            ) : !loading && featuredNews.length === 0 && (
              <div className="text-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed border-muted-foreground/20 max-w-3xl mx-auto">
                <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Star className="w-10 h-10 text-primary/60" aria-hidden="true" />
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
                  <Button onClick={() => setSelectedCategory('all')} variant="outline" className="min-h-11 hover:bg-primary hover:text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    Voir toutes les actualités
                  </Button>
                )}
              </div>
            )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Pagination des actualités" className="flex items-center justify-center gap-4 mt-10 mb-16">
              <Button 
                variant="outline" 
                disabled={page === 1} 
                onClick={() => handlePageChange('prev')}
                className="min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Page précédente"
              >
                Précédent
              </Button>
              <span className="text-sm text-muted-foreground" aria-live="polite">
                Page {page} sur {totalPages}
              </span>
              <Button 
                variant="outline" 
                disabled={page === totalPages} 
                onClick={() => handlePageChange('next')}
                className="min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Page suivante"
              >
                Suivant
              </Button>
            </nav>
          )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
