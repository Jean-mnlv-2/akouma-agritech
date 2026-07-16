import { Skeleton } from '@/components/ui/skeleton';

export function NewsCardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Chargement d'un article"
      className="h-full flex flex-col overflow-hidden rounded-lg border-2 border-border bg-card/60"
    >
      <Skeleton className="h-56 w-full rounded-none" />
      <div className="p-6 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <span className="sr-only">Chargement…</span>
    </div>
  );
}

export function EventCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Chargement d'un événement"
      className={
        'flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 min-h-11 ' +
        className
      }
    >
      <Skeleton className="h-11 w-[52px] rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <span className="sr-only">Chargement…</span>
    </div>
  );
}

export function RelatedArticleSkeleton() {
  return (
    <div
      role="status"
      aria-label="Chargement d'un article lié"
      className="rounded-xl overflow-hidden border border-border bg-card"
    >
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <span className="sr-only">Chargement…</span>
    </div>
  );
}