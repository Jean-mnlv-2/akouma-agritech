import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, Share2, Clock } from "lucide-react";
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
  isCopyProtected: boolean;
  relatedArticles: RelatedArticle[];
}

interface RelatedArticle {
  id: string;
  slug: string;
  title: string;
  image: string;
  date: string;
  excerpt: string;
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
      title: article?.title || "BIA Agritech",
      text: article?.excerpt,
      url: window.location.href,
    };
    try {
      if (typeof navigator.share !== 'undefined') {
        setIsSharing(true);
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: "Lien copié", description: "Le lien de l'article a été copié." });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') console.error('Share error:', error);
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
      date: article ? new Date(article.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined,
      url: window.location.href,
    }
  );

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

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
        author: data.author || data.author_name || 'BIA Team',
        date: data.createdAt || data.created_at || data.date || new Date().toISOString(),
        category: data.category || 'Général',
        image: data.imageUrl || data.image_url || '/logo-ak.png',
        readTime: String(data.read_time || 5) + ' min',
        isCopyProtected: data.isCopyProtected ?? data.is_copy_protected ?? false,
        relatedArticles: []
      };

      try {
        const relRes = await fetch(`${apiBaseUrl}/api/news?is_published=true`, { credentials: 'include' });
        if (relRes.ok) {
          const relBody = await relRes.json();
          const relItems = Array.isArray(relBody) ? relBody : relBody.data;
          normalized.relatedArticles = (relItems || [])
            .filter((it: RawArticleData) => String(it.id) !== String(normalized.id))
            .slice(0, 3)
            .map((it: RawArticleData) => ({
              id: String(it.id),
              slug: (it as any).slug || String(it.id),
              title: it.title,
              image: it.imageUrl || it.image_url || '/logo-ak.png',
              date: it.createdAt || it.created_at || it.date || new Date().toISOString(),
              excerpt: it.excerpt || it.description || '',
            }));
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
  }, [slug, apiBaseUrl]);

  useEffect(() => { fetchArticle(); }, [fetchArticle]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

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
          <Link to="/news" className="text-primary hover:underline">Retour aux actualités</Link>
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

      {/* Hero image - full width, large */}
      <div className="w-full bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="aspect-[21/9] md:aspect-[2.5/1] w-full overflow-hidden">
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        {/* Breadcrumb + back */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-6 mb-4 flex-wrap">
          <Link to="/" className="hover:text-primary">Accueil</Link>
          <span>/</span>
          <Link to="/news" className="hover:text-primary">Actualités</Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-[200px]">{article.title}</span>
        </div>

        <Link to="/news" className="inline-flex items-center text-primary hover:text-primary/80 text-sm mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Retour aux actualités
        </Link>

        {/* Article header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-xs">
              {article.category}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {article.readTime} de lecture
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-6">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              {article.excerpt}
            </p>
          )}

          <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-border">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium">{article.author}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(article.date)}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
              <Share2 className="w-4 h-4" />
              Partager
            </Button>
          </div>
        </header>

        {/* Article body - rich content with inline images supported via HTML */}
        <div
          className="prose prose-lg max-w-none dark:prose-invert
            prose-headings:text-foreground prose-p:text-foreground/85 prose-p:leading-relaxed
            prose-a:text-primary prose-strong:text-foreground
            prose-img:rounded-xl prose-img:shadow-md prose-img:mx-auto prose-img:my-8
            prose-blockquote:border-primary/40 prose-blockquote:bg-muted/30 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:px-4
            prose-li:text-foreground/85"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Related articles */}
        {article.relatedArticles.length > 0 && (
          <section className="mt-16 pt-8 border-t border-border">
            <h2 className="text-2xl font-bold text-foreground mb-8">
              À lire aussi
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {article.relatedArticles.map((related) => (
                <Link
                  key={related.id}
                  to={`/news/${related.slug}`}
                  className="group block rounded-xl overflow-hidden border border-border bg-card hover:shadow-lg transition-all duration-300"
                >
                  <div className="aspect-[16/9] overflow-hidden bg-muted">
                    <img
                      src={related.image}
                      alt={related.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                      {related.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{related.excerpt}</p>
                    <span className="text-xs text-muted-foreground">{formatDate(related.date)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>

      <Footer />
    </div>
  );
};

export default NewsDetail;
