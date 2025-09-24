import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User, Share2, Heart, MessageCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";

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
  relatedArticles: RelatedArticle[];
}

interface RelatedArticle {
  id: string;
  title: string;
  image: string;
  date: string;
}

const NewsDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  // Fetch article data from backend
  const fetchArticle = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/news/${id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch article');
      const { data } = await res.json();
      
      const normalized: Article = {
        id: data.id,
        title: data.title,
        excerpt: data.excerpt || data.description || '',
        content: data.content || '',
        author: data.author_name || data.author || 'AKOUMA Team',
        date: data.created_at || data.date,
        category: data.category || 'Général',
        image: data.image_url || '/lovable-uploads/4fa2637d-1bbd-47d7-aceb-da19ce83532d.png',
        readTime: String(data.read_time || 5) + ' min',
        tags: [data.category || 'Général'],
        relatedArticles: []
      };

      // Fetch related articles by same category (excluding current)
      try {
        const relRes = await fetch(`/api/news?category=${encodeURIComponent(normalized.category)}&limit=4`, { credentials: 'include' });
        if (relRes.ok) {
          const relBody = await relRes.json();
          const relItems = Array.isArray(relBody) ? relBody : relBody.data;
          const related: RelatedArticle[] = (relItems || [])
            .filter((it: any) => String(it.id) !== String(normalized.id))
            .slice(0, 4)
            .map((it: any) => ({
              id: String(it.id),
              title: it.title,
              image: it.image_url || '/lovable-uploads/4fa2637d-1bbd-47d7-aceb-da19ce83532d.png',
              date: it.created_at || new Date().toISOString(),
            }));
          normalized.relatedArticles = related;
        }
      } catch (_) {
        // ignore related errors
      }

      setArticle(normalized);
    } catch (error) {
      console.error('Error fetching article:', error);
      setArticle(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticle();
  }, [id]);

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
          {/* Article content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline">{article.category}</Badge>
                <span className="text-sm text-muted-foreground">{article.readTime} de lecture</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">{article.title}</h1>
              <div className="flex items-center gap-6 mb-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><User className="w-4 h-4" />{article.author}</div>
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4" />{formatDate(article.date)}</div>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">{article.excerpt}</p>
            </div>

            {/* Featured image */}
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
            </div>

            {/* Article content */}
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Tags */}
            <div className="pt-8 border-t">
              <h4 className="font-semibold mb-4">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Author info */}
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold mb-4">À propos de l'auteur</h4>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h5 className="font-medium">{article.author}</h5>
                    <p className="text-sm text-muted-foreground mt-2">
                      {article.author === 'AKOUMA Team' ? "Équipe éditoriale AKOUMA." : "Auteur invité - expert en innovation agricole."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Related articles */}
            {article.relatedArticles.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold mb-6">Articles connexes</h4>
                  <div className="space-y-4">
                    {article.relatedArticles.map((related) => (
                      <Link key={related.id} to={`/news/${related.id}`} className="block group">
                        <div className="flex gap-3">
                          <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                            <img src={related.image} alt={related.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">{related.title}</h5>
                            <p className="text-xs text-muted-foreground mt-1">{formatDate(related.date)}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
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