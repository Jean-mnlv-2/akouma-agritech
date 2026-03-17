import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar, User, ArrowRight, Star } from 'lucide-react';
import TitleManager from '@/components/TitleManager';
import DOMPurify from 'dompurify';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useI18n } from '@/i18n/i18n';

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

export default function News() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const { toast } = useToast();
  const { t } = useI18n();

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string) || window.location.origin;

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedCategory !== 'all') params.set('category', selectedCategory);
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));
        const url = new URL(`/api/news?${params.toString()}`, apiBaseUrl);
        const res = await fetch(url.toString(), { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load news');
        const body = await res.json();
        const items = Array.isArray(body) ? body : body.data;
        const normalized = (items || []).map((item: any) => ({
          id: String(item.id),
          slug: item.slug || String(item.id),
          title: item.title ?? '',
          excerpt: item.excerpt ?? item.description ?? '',
          content: item.content ?? '',
          author: item.author || item.author_name || 'BIA Team',
          image: item.imageUrl || item.image_url,
          featured: Boolean(item.isPublished ?? item.is_featured ?? false),
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
  }, [selectedCategory, page, pageSize, toast, t]);

  const categories = [
    { id: 'all', name: t('news.cat.all') },
    { id: 'techniques', name: t('news.cat.techniques') },
    { id: 'innovation', name: t('news.cat.innovation') },
    { id: 'formation', name: t('news.cat.formation') },
    { id: 'evenements', name: t('news.cat.events') }
  ];

  const filteredNews = selectedCategory === 'all' 
    ? news 
    : news.filter(item => (item.category || '').toLowerCase() === selectedCategory);

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
          image="/logo-ak.png"
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
        image="/logo-ak.png"
      />
      <Header />
      {/* Hero Section - Modern Design */}
      <section className="relative pt-8 pb-20 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="/lovable-uploads/4fa2637d-1bbd-47d7-aceb-da19ce83532d.png"
            alt={t('news.hero.alt')}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/50"></div>
          {/* Animated background decorations */}
          <div className="absolute top-20 right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-32 left-16 w-32 h-32 bg-accent/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
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
                    <Badge className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm shadow-lg">{item.category}</Badge>
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

          {/* Pagination */}
          <div className="flex items-center justify-center gap-4 mt-10">
            <Button variant="outline" disabled={page === 1} onClick={() => handlePageChange('prev')}>Précédent</Button>
            <span className="text-sm text-muted-foreground">Page {page}</span>
            <Button variant="outline" onClick={() => handlePageChange('next')}>Suivant</Button>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
