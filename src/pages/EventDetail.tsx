import { useState, useEffect, useCallback } from "react";
import DOMPurify from 'dompurify';
import { useParams, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import TitleManager from "@/components/TitleManager";

interface Event {
  id: number;
  title: string;
  slug: string;
  description?: string;
  date: string;
  location: string;
  imageUrl?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

const EventDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

  const fetchEvent = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/api/events/slug/${slug}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Événement introuvable');
      const { data } = await res.json();
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
      setEvent(null);
    } finally {
      setLoading(false);
    }
  }, [slug, apiBaseUrl]);

  useEffect(() => { fetchEvent(); }, [fetchEvent]);

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

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-6 py-12 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Événement introuvable</h1>
          <Link to="/news" className="text-primary hover:underline">Retour aux actualités</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TitleManager 
        title={event.title} 
        description={event.description?.substring(0, 160)} 
        image={event.imageUrl}
        ogType="article"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Event",
            name: event.title,
            description: event.description?.replace(/<[^>]*>/g, '').slice(0, 500),
            image: event.imageUrl,
            startDate: event.date,
            eventStatus: "https://schema.org/EventScheduled",
            eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
            location: event.location ? { "@type": "Place", name: event.location } : undefined,
            organizer: { "@type": "Organization", name: "KILIMO Agritech", url: window.location.origin },
            url: window.location.href,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Accueil", item: window.location.origin + "/" },
              { "@type": "ListItem", position: 2, name: "Événements", item: window.location.origin + "/events" },
              { "@type": "ListItem", position: 3, name: event.title, item: window.location.href },
            ],
          },
        ]}
      />
      <Header />

      {/* Hero image */}
      <div className="w-full bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="aspect-[21/9] md:aspect-[2.5/1] w-full overflow-hidden">
            <img
              src={event.imageUrl || '/kilimo-logo.png'}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-6 mb-4 flex-wrap">
          <Link to="/" className="hover:text-primary">Accueil</Link>
          <span>/</span>
          <Link to="/news" className="hover:text-primary">Actualités</Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-[200px]">{event.title}</span>
        </div>

        <Link to="/news" className="inline-flex items-center text-primary hover:text-primary/80 text-sm mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Retour aux actualités
        </Link>

        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-xs">
              Événement
            </Badge>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-6">
            {event.title}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 p-6 bg-muted/30 rounded-xl border border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Date de l'événement</p>
                <p className="text-foreground font-medium">{formatDate(event.date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Lieu</p>
                <p className="text-foreground font-medium">{event.location}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="prose prose-lg max-w-none dark:prose-invert">
          {event.description && (
            <div 
              className="text-foreground leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(event.description)}}
            />
          )}
        </div>
      </article>
      <Footer />
    </div>
  );
};

export default EventDetail;
