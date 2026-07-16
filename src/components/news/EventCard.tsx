import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';

export interface EventCardItem {
  id: number | string;
  slug: string;
  title: string;
  date: string;
  location: string;
}

interface EventCardProps {
  event: EventCardItem;
  className?: string;
}

/**
 * Compact secondary event card, visually harmonised with NewsCard
 * (shared tokens: radius, border, spacing, focus ring).
 */
export function EventCard({ event, className = '' }: EventCardProps) {
  const d = new Date(event.date);
  const day = d.toLocaleDateString('fr-FR', { day: '2-digit' });
  const month = d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');
  const fullDate = d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Link
      to={`/events/${event.slug}`}
      aria-label={`Événement ${event.title} le ${fullDate} à ${event.location}`}
      className={
        'group flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 min-h-11 transition-all hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
        className
      }
    >
      <div className="flex-shrink-0 text-center bg-primary/10 rounded-lg px-2.5 py-1.5 min-w-[52px]">
        <div className="text-lg font-bold leading-none text-primary">{day}</div>
        <div className="text-[10px] uppercase font-semibold text-muted-foreground mt-0.5">{month}</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {event.title}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
          <MapPin className="w-3 h-3" aria-hidden="true" />
          <span className="line-clamp-1">{event.location}</span>
        </div>
      </div>
    </Link>
  );
}

export default EventCard;