import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, Share2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useCopyProtection } from "@/hooks/use-copy-protection";
import CopyProtectionDialog from "@/components/CopyProtectionDialog";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface RawArticleData {
  id: string;
  title: string;
  excerpt?: string;
  description?: string;
  content?: string;
  author?: string;
  author_name?: string;
  createdAt?: string;
  created_at?: string;
  date?: string;
  category?: string;
  imageUrl?: string;
  image_url?: string;
  read_time?: number;
  isCopyProtected?: boolean;
  is_copy_protected?: boolean;
}

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  image: string;
  readTime: string;
  tags: string[];
  isCopyProtected: boolean;
  relatedArticles: RelatedArticle[];
}

interface RelatedArticle {
  id: string;
  slug: string;
  title: string;
  image: string;
  date: string;
}

const NewsDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    if (isSharing) return;
    
    const shareData = {
      title: article?.title || "AKOUMA Agritech",
      text: article?.excerpt,
      url: window.location.href,
    };

    try {
      if (typeof navigator.share !== 'undefined') {
        setIsSharing(true);
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Lien copié",
          description: "Le lien de l'article a été copié.",
        });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share error:', error);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const { isDialogOpen, closeDialog } = useCopyProtection(
    !!article?.isCopyProtected,
    {
      title: article?.title || "",
      imageUrl: article?.image,
      excerpt: article?.excerpt,
      date: article ? new Date(article.date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : undefined,
      url: window.location.href,
    }
  );

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

  // Fetch article data from backend
  const fetchArticle = useCallback(async () => {
    if (!slug) return;
    
    try {
      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/api/news/slug/${slug}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch article');
      const { data } = (await res.json()) as { data: RawArticleData };
      
      const normalized: Article = {
        id: data.id,
        title: data.title,
        excerpt: data.excerpt || data.description || '',
        content: data.content || '',
        author: data.author || data.author_name || 'AKOUMA Team',
        date: data.createdAt || data.created_at || data.date || new Date().toISOString(),
        category: data.category || 'Général',
        image: data.imageUrl || data.image_url || '/logo-ak.png',
        readTime: String(data.read_time || 5) + ' min',
        tags: [data.category || 'Général'],
        isCopyProtected: data.isCopyProtected ?? data.is_copy_protected ?? false,
        relatedArticles: []
      };

      // Fetch related articles by same category (excluding current)
      try {
        const relRes = await fetch(`${apiBaseUrl}/api/news?category=${encodeURIComponent(normalized.category)}&limit=4`, { credentials: 'include' });
        if (relRes.ok) {
          const relBody = await relRes.json();
          const relItems = Array.isArray(relBody) ? relBody : relBody.data;
          const related: RelatedArticle[] = (relItems || [])
            .filter((it: RawArticleData) => String(it.id) !== String(normalized.id))
            .slice(0, 4)
            .map((it: RawArticleData) => ({
              id: String(it.id),
              slug: (it as any).slug || String(it.id),
              title: it.title,
              image: it.imageUrl || it.image_url || '/logo-ak.png',
              date: it.createdAt || it.created_at || it.date || new Date().toISOString(),
            }));
          normalized.relatedArticles = related;
        }
      } catch (err) {
        console.warn('Error fetching related articles:', err);
      }

      setArticle(normalized);
    } catch (error) {
      console.error('Error fetching article:', error);
      setArticle(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-6 py-12 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Article introuvable</h1>
          <Link to="/news" className="text-primary hover:underline">
            Retour aux actualités
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {article && (
        <CopyProtectionDialog
          isOpen={isDialogOpen}
          onClose={closeDialog}
          item={{
            title: article.title,
            imageUrl: article.image,
            excerpt: article.excerpt,
            date: formatDate(article.date),
            url: window.location.href,
          }}
        />
      )}

      <div className="container mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary">Accueil</Link>
          <span>/</span>
          <Link to="/news" className="hover:text-primary">Actualités</Link>
          <span>/</span>
          <span className="text-foreground">{article.title}</span>
        </div>

        {/* Back button */}
        <Link to="/news" className="inline-flex items-center text-primary hover:text-primary/80 mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux actualités
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Article content - Enhanced */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header - Enhanced */}
            <div className="bg-gradient-to-br from-primary/5 via-background to-accent/5 rounded-2xl p-8 border-2 border-border">
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                  {article.category}
                </Badge>
                <span className="text-sm text-muted-foreground font-medium bg-card/50 px-3 py-1 rounded-lg">
                  {article.readTime} de lecture
                </span>
                <Button variant="outline" size="sm" onClick={handleShare} className="gap-2 ml-auto">
                  <Share2 className="w-4 h-4" />
                  Partager
                </Button>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-tight">
                {article.title}
              </h1>
              <div className="flex items-center gap-6 mb-6 text-sm text-muted-foreground flex-wrap">
                <div className="flex items-center gap-2 bg-card/50 px-4 py-2 rounded-lg">
                  <User className="w-4 h-4 text-primary" />
                  <span className="font-medium">{article.author}</span>
                </div>
                <div className="flex items-center gap-2 bg-card/50 px-4 py-2 rounded-lg">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-medium">{formatDate(article.date)}</span>
                </div>
              </div>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">{article.excerpt}</p>
            </div>

            {/* Featured image - Enhanced */}
            <div className="aspect-video bg-muted/30 rounded-2xl overflow-hidden border-2 border-border group relative">
              <img 
                src={article.image} 
                alt={article.title} 
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>

            {/* Article content - Enhanced */}
            <div 
              className="prose prose-lg max-w-none bg-card/50 rounded-2xl p-8 border-2 border-border"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Tags - Enhanced */}
            <div className="pt-8 border-t-2 border-border">
              <h4 className="font-bold text-xl mb-4 text-foreground">Tags</h4>
              <div className="flex flex-wrap gap-3">
                {article.tags.map((tag, index) => (
                  <Badge 
                    key={`tag-${index}-${tag}`} 
                    variant="secondary" 
                    className="bg-primary/10 text-primary border border-primary/20 hover:scale-105 transition-transform cursor-pointer"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Enhanced */}
          <div className="space-y-6">
            {/* Author info - Enhanced */}
            <Card className="bg-card/90 backdrop-blur-sm border-2 border-border hover:shadow-xl transition-all duration-500 sticky top-24">
              <CardContent className="p-6">
                <h4 className="font-bold text-xl mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  À propos de l'auteur
                </h4>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h5 className="font-bold text-lg mb-2">{article.author}</h5>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {article.author === 'AKOUMA Team' ? "Équipe éditoriale AKOUMA." : "Auteur invité - expert en innovation agricole."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Related articles - Enhanced */}
            {article.relatedArticles.length > 0 && (
              <Card className="bg-card/90 backdrop-blur-sm border-2 border-border hover:shadow-xl transition-all duration-500">
                <CardContent className="p-6">
                  <h4 className="font-bold text-xl mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Articles connexes
                  </h4>
                  <div className="space-y-4">
                    {article.relatedArticles.map((related, index) => {
                      const delay = index * 50;
                      return (
                        <Link 
                          key={related.id} 
                          to={`/news/${related.slug}`} 
                          className="block group hover:bg-primary/5 p-3 rounded-lg transition-all duration-300"
                          style={{ transitionDelay: `${delay}ms` }}
                        >
                          <div className="flex gap-3">
                            <div className="w-20 h-20 bg-muted rounded-xl overflow-hidden flex-shrink-0 group-hover:scale-110 transition-transform duration-300 border-2 border-border">
                              <img src={related.image} alt={related.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2 mb-1">
                                {related.title}
                              </h5>
                              <p className="text-xs text-muted-foreground">{formatDate(related.date)}</p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
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

export default NewsDetail;
