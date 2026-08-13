import { Link } from "react-router-dom";
import DOMPurify from "dompurify";
import { Calendar, User, Share2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AppPageHeader } from "@/components/pwa/AppPageHeader";
import { RelatedArticleSkeleton } from "@/components/news/CardSkeletons";
import type { Article } from "@/pages/NewsDetail";

interface NewsDetailAppViewProps {
  article: Article;
  relatedLoading: boolean;
  onShare: () => void;
  isSharing: boolean;
  formatDate: (dateString: string) => string;
}

export function NewsDetailAppView({ article, relatedLoading, onShare, isSharing, formatDate }: NewsDetailAppViewProps) {
  return (
    <div className="pb-8">
      <AppPageHeader
        title={article.title}
        backTo="/news"
        right={
          <button type="button" onClick={onShare} disabled={isSharing} aria-label="Partager" className="w-9 h-9 rounded-full flex items-center justify-center active:bg-muted">
            <Share2 className="w-4 h-4" />
          </button>
        }
      />

      <div className="aspect-video bg-muted overflow-hidden">
        <img src={article.image} alt={article.title} className="w-full h-full object-cover" loading="eager" />
      </div>

      <div className="px-4 pt-4 space-y-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-xs">{article.category}</Badge>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" />{article.readTime}</span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="w-3 h-3" />{formatDate(article.date)}</span>
          </div>
          <h1 className="text-xl font-bold leading-tight mb-2">{article.title}</h1>
          {article.excerpt && <p className="text-sm text-muted-foreground leading-relaxed">{article.excerpt}</p>}
        </div>

        <div className="flex items-center gap-3 py-3 border-y border-border">
          <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">{article.author}</p>
            <p className="text-xs text-muted-foreground">Publié le {formatDate(article.date)}</p>
          </div>
        </div>

        <div
          className="prose prose-sm max-w-none dark:prose-invert
            prose-headings:text-foreground prose-p:text-foreground/85 prose-p:leading-relaxed
            prose-a:text-primary prose-strong:text-foreground
            prose-img:rounded-xl prose-img:my-4"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }}
        />

        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-xs">{article.category}</Badge>
          <Badge variant="outline" className="text-xs">Agritech</Badge>
          <Badge variant="outline" className="text-xs">KILIMO</Badge>
        </div>

        {(relatedLoading || article.relatedArticles.length > 0) && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">À lire aussi</h2>
            {relatedLoading ? (
              <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 hide-scrollbar">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="w-52 shrink-0"><RelatedArticleSkeleton /></div>
                ))}
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 snap-x snap-mandatory hide-scrollbar">
                {article.relatedArticles.map((related) => (
                  <Link key={related.id} to={`/news/${related.slug}`} className="shrink-0 w-52 snap-start rounded-2xl border border-border/60 bg-card overflow-hidden">
                    <div className="h-28 bg-muted overflow-hidden">
                      <img src={related.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-semibold line-clamp-2 leading-snug mb-1">{related.title}</h3>
                      <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{formatDate(related.date)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default NewsDetailAppView;
