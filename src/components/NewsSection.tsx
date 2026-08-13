import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, ArrowRight, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useContentSync } from '@/hooks/use-content-sync';
import { useI18n } from '@/i18n';
import DOMPurify from 'dompurify';

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

interface RawNewsItem {
  id?: string | number;
  slug?: string;
  title?: string;
  excerpt?: string;
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
  read_time?: number;
  isPublished?: boolean;
  is_published?: boolean;
}

const NewsSection = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [_currentIndex, setCurrentIndex] = useState(0);
  const { t } = useI18n();

  // Utiliser le hook de synchronisation pour les actualités
  useContentSync({
    contentType: 'news',
    onUpdate: (data) => {
      const rawItems = (data as RawNewsItem[]) || [];
      const publishedItems = rawItems.filter(item => item.isPublished || item.is_published);
      
      const normalizedNews = publishedItems.map((item) => ({
        id: String(item.id),
        slug: (item.slug as string) || String(item.id),
        title: item.title as string,
        excerpt: item.excerpt as string,
        content: item.content as string,
        author: item.author as string || item.author_name as string || 'KILIMO Team',
        image: item.imageUrl as string || item.image_url as string || '/placeholder.svg',
        featured: !!(item.isFeatured || item.is_featured),
        date: item.createdAt as string || item.created_at as string,
        category: item.category as string || 'Général',
        read_time: item.read_time as number || 5,
      }));

      const sortedNews = [...normalizedNews].sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      setNews(sortedNews.slice(0, 6));
      setLoading(false);
    },
    enabled: true,
  });

  // Fallback: arrêter le loading après 5 secondes si aucune donnée
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        console.log('NewsSection: Timeout fallback - no data received');
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [loading]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, news.length - 2));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.max(1, news.length - 2)) % Math.max(1, news.length - 2));
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-muted/30 to-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('home.news.title')}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t('home.news.subtitle')}
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-pulse bg-muted h-64 w-full max-w-md rounded-lg"></div>
          </div>
        </div>
      </section>
    );
  }

  if (news.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-gradient-to-br from-muted/40 via-background to-muted/20 relative overflow-hidden">
      {/* Enhanced background decorations */}
      <div className="absolute top-10 right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 left-10 w-32 h-32 bg-accent/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-primary/5 rounded-full blur-xl"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t('home.news.title')}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-6">
            {t('home.news.subtitle')}
          </p>
          <div className="mt-6">
            <Button variant="outline" size="lg" asChild className="group hover:bg-primary hover:text-primary-foreground transition-all duration-300">
              <Link to="/news">
                {t('home.news.view_all')}
                <ArrowRight className="ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Featured News - Large Card */}
        {news.length > 0 && (
          <div className="mb-12">
            <div className="relative bg-card rounded-2xl overflow-hidden shadow-natural group hover:shadow-xl transition-all duration-300">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="relative h-64 md:h-96 bg-muted/30 flex items-center justify-center">
                  <img
                    src={news[0].image}
                    alt={news[0].title}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                    <Star className="w-3 h-3 mr-1" />
                    {t('news.featured')}
                  </Badge>
                </div>
                <div className="p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-4 mb-4">
                    <Badge variant="outline">{news[0].category}</Badge>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(news[0].date).toLocaleDateString()}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors">
                    {news[0].title}
                  </h3>
                  <p className="text-muted-foreground mb-6 line-clamp-3">
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: DOMPurify.sanitize(news[0].excerpt) 
                      }} 
                    />
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <User className="w-4 h-4 mr-1" />
                      {news[0].author}
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/news/${news[0].slug}`}>
                        {t('news.read_more')}
                        <span className="sr-only">: {news[0].title}</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Horizontal Scroll News */}
        {news.length > 1 && (
          <div className="relative">
            <div className="flex overflow-x-auto scrollbar-hide gap-6 pb-4" style={{ scrollSnapType: 'x mandatory' }}>
              {news.slice(1).map((item) => (
                <div
                  key={item.id}
                  className="flex-shrink-0 w-80"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full">
                    <div className="relative overflow-hidden rounded-t-lg bg-muted/30 aspect-[4/3] flex items-center justify-center">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                      <Badge className="absolute top-3 left-3">
                        {item.category}
                      </Badge>
                    </div>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(item.date).toLocaleDateString()}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {item.read_time} {t('news.read_time')}
                        </span>
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="line-clamp-3 mb-4">
                        <div 
                          dangerouslySetInnerHTML={{ 
                            __html: DOMPurify.sanitize(item.excerpt) 
                          }} 
                        />
                      </CardDescription>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <User className="w-4 h-4 mr-1" />
                          {item.author}
                        </div>
                        <Button variant="ghost" size="sm" asChild className="group-hover:bg-primary group-hover:text-primary-foreground">
                          <Link to={`/news/${item.slug}`}>
                            {t('news.read_more')}
                            <span className="sr-only">: {item.title}</span>
                            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>

            {/* Navigation arrows */}
            {news.length > 3 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-background/80 backdrop-blur-sm"
                  onClick={prevSlide}
                  aria-label="Actualité précédente"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-background/80 backdrop-blur-sm"
                  onClick={nextSlide}
                  aria-label="Actualité suivante"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        )}

        {/* View All Button */}
        <div className="text-center mt-8">
          <Button variant="outline" size="lg" asChild>
            <Link to="/news">
              {t('home.news.view_all')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
