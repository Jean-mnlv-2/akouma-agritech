import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, CalendarX2 } from 'lucide-react';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeaderCarousel from '@/components/PageHeaderCarousel';
import { EventCardSkeleton } from '@/components/news/CardSkeletons';

interface EventItem {
  id: number | string;
  title: string;
  slug: string;
  description?: string;
  date: string;
  location: string;
  imageUrl?: string;
}

function EventGridCard({ event }: { event: EventItem }) {
  const d = new Date(event.date);
  const day = d.toLocaleDateString('fr-FR', { day: '2-digit' });
  const month = d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');
  const fullDate = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Link
      to={`/events/${event.slug}`}
      aria-label={`Événement ${event.title} le ${fullDate} à ${event.location}`}
      className="group flex flex-col overflow-hidden rounded-2xl border-2 border-border bg-card hover:border-primary/40 hover:shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted/30">
        <img
          src={event.imageUrl || '/kilimo-logo.png'}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm rounded-xl px-3 py-1.5 text-center shadow-sm">
          <div className="text-lg font-bold leading-none text-primary">{day}</div>
          <div className="text-[10px] uppercase font-semibold text-muted-foreground mt-0.5">{month}</div>
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col gap-2">
        <h3 className="text-lg font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {event.title}
        </h3>
        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.description.replace(/<[^>]*>/g, '')}
          </p>
        )}
        <div className="mt-auto pt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          <span className="line-clamp-1">{event.location}</span>
        </div>
      </div>
    </Link>
  );
}

export default function Events() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string) || window.location.origin;

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiBaseUrl}/api/events`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load events');
        const body = await res.json();
        setEvents(Array.isArray(body) ? body : (body.data || []));
      } catch (e) {
        console.error('Error fetching events:', e);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [apiBaseUrl]);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now() - 86400000;
    const sorted = [...events];
    return {
      upcoming: sorted
        .filter((e) => new Date(e.date).getTime() >= now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      past: sorted
        .filter((e) => new Date(e.date).getTime() < now)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    };
  }, [events]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Événements"
        description="Découvrez tous les événements agricoles à venir et passés organisés ou relayés par KILIMO Agritech."
        image="/kilimo-logo.png"
        type="website"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Accueil', item: window.location.origin + '/' },
              { '@type': 'ListItem', position: 2, name: 'Événements', item: window.location.href },
            ],
          },
        ]}
      />
      <Header />

      <section className="relative pt-8 pb-16 overflow-hidden">
        <PageHeaderCarousel
          pageKey="events"
          fallbackImage="/kilimo-logo.png"
          fallbackAlt="Événements agricoles KILIMO"
          overlayClassName="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/50"
        />
        <div className="relative container mx-auto px-6 z-10">
          <div className="max-w-4xl">
            <Badge className="mb-6 bg-primary/20 backdrop-blur-sm text-white border-2 border-primary/30">
              <Calendar className="w-4 h-4 mr-2" />
              Événements
            </Badge>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Tous les <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">événements</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 leading-relaxed">
              Salons, formations en présentiel, webinaires et rencontres agricoles à ne pas manquer.
            </p>
          </div>
        </div>
      </section>

      <main id="main-content" className="py-16 bg-background">
        <div className="container mx-auto px-6">
          {loading ? (
            <div aria-busy="true" aria-label="Chargement des événements" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <EventCardSkeleton key={i} className="h-24" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed border-muted-foreground/20 max-w-3xl mx-auto">
              <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CalendarX2 className="w-10 h-10 text-primary/60" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Aucun événement programmé</h3>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                Revenez bientôt pour découvrir nos prochains rendez-vous agricoles.
              </p>
            </div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <section aria-labelledby="upcoming-heading" className="mb-16">
                  <h2 id="upcoming-heading" className="text-3xl font-bold text-foreground mb-8 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    À venir
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcoming.map((event) => (
                      <EventGridCard key={event.id} event={event} />
                    ))}
                  </div>
                </section>
              )}

              {past.length > 0 && (
                <section aria-labelledby="past-heading">
                  <h2 id="past-heading" className="text-3xl font-bold text-foreground mb-8">
                    Événements passés
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80">
                    {past.map((event) => (
                      <EventGridCard key={event.id} event={event} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
