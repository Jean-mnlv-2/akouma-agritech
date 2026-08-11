import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, ArrowRight, Star } from 'lucide-react';
import DOMPurify from 'dompurify';
import { trackSelectContent } from '@/lib/analyticsEvents';

export interface NewsCardItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  image: string;
  date: string;
  category: string;
  read_time: number;
  featured?: boolean;
}

interface NewsCardProps {
  item: NewsCardItem;
  variant?: 'featured' | 'regular';
  readMoreLabel: string;
  readTimeLabel: string;
  featuredLabel?: string;
}

/**
 * Shared news card used across the Actualités page and any related-article
 * listings. Uses design-system tokens for spacing, radii and colours to keep
 * cards visually consistent with the sibling EventCard component.
 */
export function NewsCard({
  item,
  variant = 'regular',
  readMoreLabel,
  readTimeLabel,
  featuredLabel,
}: NewsCardProps) {
  const isFeatured = variant === 'featured';
  const imgHeight = isFeatured ? 'h-64' : 'h-56';

  return (
    <Card
      className="group h-full flex flex-col overflow-hidden border-2 border-border bg-card/90 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-within:ring-2 focus-within:ring-ring"
    >
      <div className="relative overflow-hidden">
        <img
          src={item.image}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className={`w-full ${imgHeight} object-contain bg-muted/30 transition-transform duration-500 group-hover:scale-105`}
        />
        <Badge
          className={
            isFeatured
              ? 'absolute top-4 left-4 bg-yellow-500 text-black shadow-lg'
              : 'absolute top-4 left-4 bg-primary text-primary-foreground shadow-lg border-none font-semibold'
          }
        >
          {isFeatured && featuredLabel ? (
            <>
              <Star className="w-3 h-3 mr-1" aria-hidden="true" />
              {featuredLabel}
            </>
          ) : (
            item.category
          )}
        </Badge>
      </div>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-4 h-4" aria-hidden="true" />
            <time dateTime={item.date}>{new Date(item.date).toLocaleDateString()}</time>
          </span>
          <span>
            {item.read_time} {readTimeLabel}
          </span>
        </div>
        <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-2">
          {item.title}
        </CardTitle>
        <div
          className="line-clamp-3 text-sm text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.excerpt) }}
        />
      </CardHeader>
      <CardContent className="mt-auto pt-0">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground min-w-0">
            <User className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">{item.author}</span>
          </span>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="min-h-11 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          >
            <Link
              to={`/news/${item.slug}`}
              aria-label={`${readMoreLabel} : ${item.title}`}
              onClick={() => trackSelectContent('news', item.slug)}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              {readMoreLabel}
              <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default NewsCard;