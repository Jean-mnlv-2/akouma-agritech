import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedCategory !== 'all') params.set('category', selectedCategory);
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));
        const res = await fetch(`/api/news?${params.toString()}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load news');
        const body = await res.json();
        const items = Array.isArray(body) ? body : body.data;
        const normalized = (items || []).map((item: any) => ({
          id: String(item.id),
          title: item.title ?? '',
          excerpt: item.excerpt ?? item.description ?? '',
          content: item.content ?? '',
          author: item.author_name ?? 'AKOUMA Team',
          image: item.image_url ?? '/lovable-uploads/4fa2637d-1bbd-47d7-aceb-da19ce83532d.png',
          featured: Boolean(item.is_featured ?? false),
          date: item.created_at || new Date().toISOString(),
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
          title={t('news.meta.title')}
          description={t('news.meta.desc')}
          image="/lovable-uploads/4fa2637d-1bbd-47d7-aceb-da19ce83532d.png"
        />
        <Header />
        <div className="flex items-center justify-center min-h-[60vh] page-with-header">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TitleManager
        title={t('news.meta.title')}
        description={t('news.meta.desc')}
        image="/lovable-uploads/4fa2637d-1bbd-47d7-aceb-da19ce83532d.png"
      />
      <Header />
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden mobile-page-content">
        <div className="absolute inset-0">
          <img 
            src="/lovable-uploads/4fa2637d-1bbd-47d7-aceb-da19ce83532d.png"
            alt={t('news.hero.alt')}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40"></div>
        </div>
        <div className="relative container mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              <span className="text-green-400">{t('news.hero.title1')}</span> {t('news.hero.title2')}
            </h1>
            <p className="text-xl text-gray-200 mb-8 leading-relaxed">{t('news.hero.desc')}</p>
            <div className="flex flex-wrap gap-4">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Calendar className="w-4 h-4 mr-2" />
                {t('news.badge.daily')}
              </Badge>
              <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
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

          {/* Actualités en vedette */}
          {featuredNews.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center">
                <Star className="w-6 h-6 mr-2 text-yellow-500" />
                {t('news.featured')}
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {featuredNews.slice(0, 2).map((item) => (
                  <Card key={item.id} className="group hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <div className="relative overflow-hidden rounded-t-lg">
                      <img src={item.image} alt={item.title} className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300" />
                      <Badge className="absolute top-4 left-4 bg-yellow-500 text-white">{t('news.featured')}</Badge>
                    </div>
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">{item.category}</Badge>
                        <div className="flex items-center text-sm text-muted-foreground"><Calendar className="w-4 h-4 mr-1" />{new Date(item.date).toLocaleDateString()}</div>
                      </div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">{item.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{item.excerpt}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-muted-foreground"><User className="w-4 h-4 mr-1" />{item.author}</div>
                        <Button asChild variant="ghost" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground"><a href={`/news/${item.id}`}>{t('news.read_more')}<ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" /></a></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Actualités régulières */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularNews.map((item) => (
              <Card key={item.id} className="group hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="relative overflow-hidden rounded-t-lg">
                  <img src={item.image} alt={item.title} className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300" />
                  <Badge className="absolute top-4 left-4">{item.category}</Badge>
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center text-sm text-muted-foreground"><Calendar className="w-4 h-4 mr-1" />{new Date(item.date).toLocaleDateString()}</div>
                    <span className="text-sm text-muted-foreground">{item.read_time} {t('news.read_time')}</span>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">{item.title}</CardTitle>
                  <CardDescription className="line-clamp-3"><div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.excerpt) }} /></CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-muted-foreground"><User className="w-4 h-4 mr-1" />{item.author}</div>
                    <Button asChild variant="ghost" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground"><a href={`/news/${item.id}`}>{t('news.read_more')}<ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" /></a></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
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