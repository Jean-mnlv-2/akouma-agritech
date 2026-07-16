import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, CalendarDays, CalendarX2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EventCard, EventCardItem } from './EventCard';
import { EventCardSkeleton } from './CardSkeletons';

interface UpcomingEventsStripProps {
  events: EventCardItem[];
  loading?: boolean;
}

/**
 * Secondary/complementary strip listing upcoming events above the main
 * Actualités feed. Reuses design-system tokens and shares the EventCard
 * component so events and news cards stay visually consistent.
 */
export function UpcomingEventsStrip({ events, loading = false }: UpcomingEventsStripProps) {
  const [showAll, setShowAll] = useState(false);

  const upcoming = events
    .filter((e) => new Date(e.date).getTime() >= Date.now() - 86400000)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const visible = showAll ? upcoming : upcoming.slice(0, 4);
  const hasMore = upcoming.length > 4;

  return (
    <aside
      aria-labelledby="upcoming-events-heading"
      className="mb-12 rounded-2xl border border-border bg-muted/30 p-4 md:p-5"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <CalendarDays className="w-4 h-4 text-primary" aria-hidden="true" />
          <h2 id="upcoming-events-heading" className="text-sm font-semibold">
            Événements à venir
          </h2>
          <span className="text-xs font-normal text-muted-foreground">· info complémentaire</span>
        </div>
        <div className="flex items-center gap-2">
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll((v) => !v)}
              className="text-xs h-8 min-h-11"
              aria-expanded={showAll}
              aria-controls="upcoming-events-list"
            >
              {showAll ? 'Réduire' : `Voir tous (${upcoming.length})`}
            </Button>
          )}
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-xs h-8 min-h-11 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Link to="/events" aria-label="Voir tous les événements sur la page dédiée">
              Tous les événements
              <ArrowRight className="w-3 h-3 ml-1" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div
          id="upcoming-events-list"
          aria-busy="true"
          className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1"
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <EventCardSkeleton key={i} className="flex-shrink-0 w-[280px]" />
          ))}
        </div>
      ) : upcoming.length === 0 ? (
        <div
          id="upcoming-events-list"
          role="status"
          className="flex items-center gap-3 rounded-xl bg-background border border-dashed border-border px-4 py-4 text-sm text-muted-foreground"
        >
          <CalendarX2 className="w-5 h-5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
          <span>Aucun événement programmé pour le moment. Revenez bientôt pour découvrir nos prochains rendez-vous.</span>
        </div>
      ) : (
        <ul
          id="upcoming-events-list"
          role="list"
          className={
            showAll
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 list-none p-0'
              : 'flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x list-none'
          }
        >
          {visible.map((event) => (
            <li key={event.id} className={showAll ? '' : 'flex-shrink-0 w-[280px] snap-start'}>
              <EventCard event={event} />
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

export default UpcomingEventsStrip;