import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, Share2, Clock } from "lucide-react";
import DOMPurify from "dompurify";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useCopyProtection } from "@/hooks/use-copy-protection";
import CopyProtectionDialog from "@/components/CopyProtectionDialog";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { RelatedArticleSkeleton } from "@/components/news/CardSkeletons";
import { useStandalonePwa } from "@/hooks/use-standalone-pwa";
import NewsDetailAppView from "@/components/pwa/news/NewsDetailAppView";

export interface Article {
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

export interface RelatedArticle {
  id: string;
  slug: string;
  title: string;
  image: string;
  date: string;
  excerpt: string;
  category?: string;
}

const NewsDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const isStandalone = useStandalonePwa();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    if (isSharing) return;
    const shareData = {
      title: article?.title || "KILIMO Agritech",
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
      const { data } = (await res.json()) as { data: {
        id: string | number;
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
      } };

      const normalized: Article = {
        id: String(data.id),
        title: data.title,
        excerpt: data.excerpt || data.description || '',
        content: data.content || '',
        author: data.author || data.author_name || 'KILIMO Team',
        date: data.createdAt || data.created_at || data.date || new Date().toISOString(),
        category: data.category || 'Général',
        image: data.imageUrl || data.image_url || '/kilimo-logo.png',
        readTime: String(data.read_time || 5) + ' min',
        isCopyProtected: data.isCopyProtected ?? data.is_copy_protected ?? false,
        relatedArticles: []
      };

      try {
        setRelatedLoading(true);
        const relRes = await fetch(`${apiBaseUrl}/api/news?is_published=true`, { credentials: 'include' });
        if (relRes.ok) {
          const relBody = await relRes.json();
          const relItems = Array.isArray(relBody) ? relBody : relBody.data;
          normalized.relatedArticles = (relItems || [])
            .filter((it: { id: string | number }) => String(it.id) !== String(normalized.id))
            .slice(0, 3)
            .map((it: { 
              id: string | number; 
              slug?: string; 
              title: string; 
              imageUrl?: string; 
              image_url?: string; 
              createdAt?: string; 
              created_at?: string; 
              date?: string; 
              excerpt?: string; 
              description?: string; 
              category?: string; 
            }) => ({
              id: String(it.id),
              slug: it.slug || String(it.id),
              title: it.title,
              image: it.imageUrl || it.image_url || '/kilimo-logo.png',
              date: it.createdAt || it.created_at || it.date || new Date().toISOString(),
              excerpt: it.excerpt || it.description || '',
              category: it.category
            }));
        }
      } catch (err) {
        console.warn('Error fetching related articles:', err);
      } finally {
        setRelatedLoading(false);
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

  const seo = (
    <SEO
      title={article.title}
      description={article.excerpt}
      image={article.image}
      type="article"
      jsonLd={[
        {
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          "headline": article.title,
          "description": article.excerpt,
          "image": article.image.startsWith('http') ? article.image : `${window.location.origin}${article.image}`,
          "author": { "@type": "Person", "name": article.author },
          "publisher": {
            "@type": "Organization",
            "name": "KILIMO Agritech",
            "logo": { "@type": "ImageObject", "url": `${window.location.origin}/kilimo-logo.png` }
          },
          "datePublished": article.date,
          "dateModified": article.date,
          "mainEntityOfPage": window.location.href,
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Accueil", item: window.location.origin + "/" },
            { "@type": "ListItem", position: 2, name: "Actualités", item: window.location.origin + "/news" },
            { "@type": "ListItem", position: 3, name: article.title, item: window.location.href },
          ],
        },
      ]}
    />
  );

  const copyProtectionDialog = (
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
  );

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-background">
        {seo}
        <Header />
        {copyProtectionDialog}
        <NewsDetailAppView
          article={article}
          relatedLoading={relatedLoading}
          onShare={handleShare}
          isSharing={isSharing}
          formatDate={formatDate}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {seo}
      <Header />
      {copyProtectionDialog}

      <main>
        {/* Breadcrumb + back */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
          <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-sm text-muted-foreground mb-3 flex-wrap">
            <Link to="/" className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">Accueil</Link>
            <span aria-hidden="true">/</span>
            <Link to="/news" className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">Actualités</Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground truncate max-w-[200px]" aria-current="page">{article.title}</span>
          </nav>
          <Link
            to="/news"
            className="inline-flex items-center text-primary hover:text-primary/80 text-sm mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            <ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" />
            Retour aux actualités
          </Link>
        </div>

        <article className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
          {/* En-tête */}
          <header className="mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                {article.category}
              </Badge>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                {article.readTime} de lecture
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                {formatDate(article.date)}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight tracking-tight mb-5">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                {article.excerpt}
              </p>
            )}
          </header>

          {/* Hero image */}
          <figure className="mb-8 -mx-4 sm:-mx-6 md:mx-0">
            <div className="aspect-[16/9] md:aspect-[2.4/1] w-full overflow-hidden md:rounded-2xl bg-muted">
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
          </figure>

          {/* Méta : auteur + partage */}
          <div className="flex items-center justify-between flex-wrap gap-4 py-4 mb-8 border-y border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center" aria-hidden="true">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground leading-tight">{article.author}</div>
                <div className="text-xs text-muted-foreground">Publié le {formatDate(article.date)}</div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              disabled={isSharing}
              className="gap-2 min-h-11"
              aria-label="Partager cet article"
            >
              <Share2 className="w-4 h-4" aria-hidden="true" />
              Partager
            </Button>
          </div>

          {/* Corps de l'article */}
          <div
            className="prose prose-lg max-w-none dark:prose-invert
              prose-headings:text-foreground prose-headings:tracking-tight
              prose-p:text-foreground/85 prose-p:leading-relaxed
              prose-a:text-primary prose-strong:text-foreground
              prose-img:rounded-xl prose-img:shadow-md prose-img:mx-auto prose-img:my-8
              prose-blockquote:border-primary/40 prose-blockquote:bg-muted/30 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:px-4
              prose-li:text-foreground/85"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }}
          />

          {/* Tags + auteur */}
          <footer className="mt-12 pt-8 border-t border-border">
            <div className="grid gap-6 md:grid-cols-2">
              <section aria-labelledby="tags-heading">
                <h2 id="tags-heading" className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
                  Thématiques
                </h2>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                    {article.category}
                  </Badge>
                  <Badge variant="outline">Agritech</Badge>
                  <Badge variant="outline">KILIMO</Badge>
                </div>
              </section>
              <section aria-labelledby="author-heading" className="rounded-2xl border border-border bg-muted/30 p-4">
                <h2 id="author-heading" className="sr-only">À propos de l'auteur</h2>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0" aria-hidden="true">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground">{article.author}</div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      Contributeur KILIMO Agritech — actualités et analyses du secteur agricole.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </footer>

          {/* Related articles */}
          <section aria-labelledby="related-heading" className="mt-16 pt-8 border-t border-border">
            <h2 id="related-heading" className="text-2xl font-bold text-foreground mb-8">
              À lire aussi
            </h2>
            {relatedLoading ? (
              <div
                aria-busy="true"
                aria-label="Chargement des articles liés"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {Array.from({ length: 3 }).map((_, i) => (
                  <RelatedArticleSkeleton key={i} />
                ))}
              </div>
            ) : article.relatedArticles.length === 0 ? (
              <p
                role="status"
                className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground text-center"
              >
                Aucun autre article à recommander pour le moment. Revenez bientôt !
              </p>
            ) : (
              <ul role="list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 list-none p-0">
                {article.relatedArticles.map((related) => (
                  <li key={related.id}>
                  <Link
                    to={`/news/${related.slug}`}
                    aria-label={`Lire l'article : ${related.title}`}
                    className="group block h-full rounded-xl overflow-hidden border border-border bg-card hover:shadow-lg hover:-translate-y-1 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="aspect-[16/9] overflow-hidden bg-muted">
                      <img
                        src={related.image}
                        alt=""
                        aria-hidden="true"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4">
                      {related.category && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-none mb-2">
                          {related.category}
                        </Badge>
                      )}
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                        {related.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{related.excerpt}</p>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" aria-hidden="true" />
                        <time dateTime={related.date}>{formatDate(related.date)}</time>
                      </span>
                    </div>
                  </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default NewsDetail;
