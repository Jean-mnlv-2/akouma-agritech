import { Button } from "@/components/ui/button";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { AppPageHeader } from "@/components/pwa/AppPageHeader";
import { AppHeroBanner } from "@/components/pwa/AppHeroBanner";
import { EmptyState } from "@/components/elearning/EmptyState";
import { NewsListItem } from "@/components/pwa/news/NewsListItem";
import { UpcomingEventsStrip } from "@/components/news/UpcomingEventsStrip";
import { NewsCardSkeleton } from "@/components/news/CardSkeletons";
import type { NewsCardItem } from "@/components/news/NewsCard";
import type { EventCardItem } from "@/components/news/EventCard";
import heroImage from "@/assets/hero-agritech.jpg?format=webp&quality=75";

interface NewsAppViewProps {
  news: NewsCardItem[];
  featuredNews: NewsCardItem[];
  regularNews: NewsCardItem[];
  loading: boolean;
  events: EventCardItem[];
  eventsLoading: boolean;
  categories: { id: string; name: string }[];
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (direction: "prev" | "next") => void;
  readTimeLabel: string;
}

export function NewsAppView({
  news, featuredNews, regularNews, loading, events, eventsLoading,
  categories, selectedCategory, setSelectedCategory, page, totalPages, onPageChange,
  readTimeLabel,
}: NewsAppViewProps) {
  return (
    <div className="pb-8">
      <AppHeroBanner pageKey="news" image={heroImage} title="Actualités" subtitle="L'actualité agricole en continu" />
      <AppPageHeader title="Actualités" subtitle={`${news.length} article${news.length > 1 ? "s" : ""}`}>
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 hide-scrollbar">
          {categories.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 px-3.5 h-8 rounded-full text-xs font-semibold transition-colors ${
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </AppPageHeader>

      <div className="px-4 pt-4 space-y-8">
        <UpcomingEventsStrip events={events} loading={eventsLoading} />

        {loading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => <NewsCardSkeleton key={i} />)}
          </div>
        ) : (
          <>
            {featuredNews.length > 0 && (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" /> À la une
                </h2>
                <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 -mx-4 px-4 hide-scrollbar">
                  {featuredNews.slice(0, 4).map((item) => (
                    <NewsListItem key={item.id} item={item} readTimeLabel={readTimeLabel} variant="featured" />
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">Toutes les actualités</h2>
              {regularNews.length === 0 ? (
                <EmptyState
                  icon={Star}
                  title="Aucune actualité disponible"
                  description="Nous préparons du nouveau contenu pour cette catégorie. Revenez bientôt !"
                  className="rounded-2xl py-12"
                />
              ) : (
                <div className="space-y-2.5">
                  {regularNews.map((item) => (
                    <NewsListItem key={item.id} item={item} readTimeLabel={readTimeLabel} />
                  ))}
                </div>
              )}
            </section>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPageChange("prev")}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => onPageChange("next")}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default NewsAppView;
