import { Link } from "react-router-dom";
import { Calendar, Clock, Star } from "lucide-react";
import type { NewsCardItem } from "@/components/news/NewsCard";

interface NewsListItemProps {
  item: NewsCardItem;
  readTimeLabel: string;
  /** "list" = ligne horizontale aérée (flux principal) · "featured" = carte carrousel */
  variant?: "list" | "featured";
}

export function NewsListItem({ item, readTimeLabel, variant = "list" }: NewsListItemProps) {
  if (variant === "featured") {
    return (
      <Link
        to={`/news/${item.slug}`}
        className="shrink-0 w-64 snap-start rounded-2xl border border-border/60 bg-card overflow-hidden active:scale-[0.98] transition-transform"
      >
        <div className="relative h-32 bg-muted overflow-hidden">
          <img src={item.image} alt="" className="w-full h-full object-cover" loading="lazy" />
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-yellow-500 text-black text-xs font-semibold px-2 py-0.5 rounded-full">
            <Star className="w-3 h-3" /> À la une
          </span>
        </div>
        <div className="p-3">
          <h3 className="text-sm font-semibold line-clamp-2 leading-snug mb-1.5">{item.title}</h3>
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(item.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/news/${item.slug}`}
      className="flex items-center gap-3 p-3 rounded-2xl border border-border/50 bg-card active:bg-muted/60 transition-colors"
    >
      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-muted">
        <img src={item.image} alt="" className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div className="min-w-0 flex-1">
        <span className="inline-block px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-semibold mb-1">
          {item.category}
        </span>
        <h3 className="text-sm font-semibold line-clamp-2 leading-snug mb-1.5">{item.title}</h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(item.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
          <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{item.read_time} {readTimeLabel}</span>
        </div>
      </div>
    </Link>
  );
}

export default NewsListItem;
