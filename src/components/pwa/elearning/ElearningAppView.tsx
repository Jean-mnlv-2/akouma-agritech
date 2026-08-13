import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, SlidersHorizontal, Download, Radio, GraduationCap, BookOpen, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppPageHeader } from "@/components/pwa/AppPageHeader";
import { AppCourseCard } from "@/components/pwa/elearning/AppCourseCard";
import { EmptyState } from "@/components/elearning/EmptyState";
import type { UICourse, LiveStreamItem, PreviewDisplayItem } from "@/pages/ELearning";
import type { Enrollment } from "@/hooks/useEnrollments";
import type { AuthUser } from "@/hooks/useAuthUser";

interface ElearningAppViewProps {
  courses: UICourse[];
  loading: boolean;
  error: string | null;
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  availableLanguages: string[];
  languageFilter: string;
  setLanguageFilter: (l: string) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
  showOnlyPreview: boolean;
  setShowOnlyPreview: (v: boolean) => void;
  liveStreams: LiveStreamItem[];
  freePreviewContent: PreviewDisplayItem[];
  currentUser: AuthUser | null;
  userEnrollments: Enrollment[];
}

export function ElearningAppView({
  courses,
  loading,
  error,
  categories,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  availableLanguages,
  languageFilter,
  setLanguageFilter,
  sortBy,
  setSortBy,
  showOnlyPreview,
  setShowOnlyPreview,
  liveStreams,
  freePreviewContent,
  currentUser,
  userEnrollments,
}: ElearningAppViewProps) {
  const [searchOpen, setSearchOpen] = useState(!!searchQuery);

  const enrolledIds = new Set(userEnrollments.map((e) => Number(e.courseId)));
  const continuingCourses = courses.filter((c) => enrolledIds.has(Number(c.id)));
  const progressByCourse = new Map(userEnrollments.map((e) => [Number(e.courseId), e.progress ?? 0]));

  return (
    <div className="pb-8">
      <AppPageHeader
        title="E-Learning"
        subtitle={`${courses.length} formation${courses.length > 1 ? "s" : ""} disponible${courses.length > 1 ? "s" : ""}`}
        right={
          <>
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Rechercher"
              className="w-9 h-9 rounded-full flex items-center justify-center active:bg-muted"
            >
              {searchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>
            <Drawer>
              <DrawerTrigger asChild>
                <button
                  type="button"
                  aria-label="Filtres"
                  className="w-9 h-9 rounded-full flex items-center justify-center active:bg-muted relative"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {(languageFilter !== "Toutes langues" || sortBy !== "recent" || showOnlyPreview) && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader className="text-left">
                  <DrawerTitle>Filtres</DrawerTitle>
                </DrawerHeader>
                <div className="px-4 pb-8 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Langue</label>
                    <Select value={languageFilter} onValueChange={setLanguageFilter}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Toutes langues">Toutes langues</SelectItem>
                        {availableLanguages.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Trier par</label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Plus récents</SelectItem>
                        <SelectItem value="popular">Plus populaires</SelectItem>
                        <SelectItem value="rating">Mieux notés</SelectItem>
                        <SelectItem value="price_asc">Prix croissant</SelectItem>
                        <SelectItem value="price_desc">Prix décroissant</SelectItem>
                        <SelectItem value="title">Titre (A-Z)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <label htmlFor="preview-only-app" className="flex items-center justify-between py-1">
                    <span className="text-sm font-medium">Aperçu gratuit uniquement</span>
                    <Switch id="preview-only-app" checked={showOnlyPreview} onCheckedChange={setShowOnlyPreview} />
                  </label>
                </div>
              </DrawerContent>
            </Drawer>
          </>
        }
      >
        {searchOpen && (
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Rechercher une formation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-xl bg-muted/40 border-0"
              />
            </div>
          </div>
        )}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 hide-scrollbar">
          {categories.map((cat) => {
            const active = selectedCategory === cat || (cat === "Tous" && !selectedCategory);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-3.5 h-8 rounded-full text-xs font-semibold transition-colors ${
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </AppPageHeader>

      <div className="px-4 pt-4 space-y-8">
        {/* Continuer mes cours */}
        {currentUser && continuingCourses.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">Continuer mes cours</h2>
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 -mx-4 px-4 hide-scrollbar">
              {continuingCourses.map((c) => (
                <AppCourseCard key={c.id} course={c} variant="continue" progress={progressByCourse.get(Number(c.id))} />
              ))}
            </div>
          </section>
        )}

        {/* Live streams */}
        {liveStreams.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-red-500" /> En direct
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 hide-scrollbar">
              {liveStreams.map((s) => (
                <div key={s.id} className="shrink-0 w-64 rounded-2xl border border-border/60 bg-card overflow-hidden">
                  <div className="relative h-32 bg-muted overflow-hidden">
                    {s.thumbnailUrl && <img src={s.thumbnailUrl} alt={s.title} className="w-full h-full object-cover" />}
                    {s.isLive && (
                      <Badge className="absolute top-2 left-2 bg-red-600 border-none animate-pulse text-xs">● LIVE</Badge>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold line-clamp-2 mb-1">{s.title}</h3>
                    <p className="text-sm text-muted-foreground">{s.instructorName || "KILIMO"}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Aperçus gratuits */}
        {freePreviewContent.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">Aperçus gratuits</h2>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 hide-scrollbar">
              {freePreviewContent.map((item, i) => {
                const Icon = item.icon;
                const isVideo = item.type === "video";
                return (
                  <Dialog key={i}>
                    <DialogTrigger asChild>
                      <button type="button" className="shrink-0 w-44 text-left rounded-2xl border border-border/60 bg-card overflow-hidden active:scale-[0.98] transition-transform">
                        <div className={`h-20 flex items-center justify-center ${isVideo ? "bg-primary/10" : "bg-red-500/10"}`}>
                          <Icon className={`w-7 h-7 ${isVideo ? "text-primary" : "text-red-500"}`} />
                        </div>
                        <div className="p-2.5">
                          <p className="text-xs font-semibold line-clamp-2 leading-snug">{item.title}</p>
                          {item.duration && <p className="text-sm text-muted-foreground mt-1">{item.duration}</p>}
                        </div>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg p-0 overflow-hidden bg-black border-none rounded-3xl">
                      <DialogHeader className="sr-only">
                        <DialogTitle>{item.title}</DialogTitle>
                        <DialogDescription>{item.desc}</DialogDescription>
                      </DialogHeader>
                      <div className="aspect-video w-full">
                        {isVideo ? (
                          <iframe src={item.url} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-white p-8 bg-gradient-to-br from-slate-900 to-slate-800">
                            <Download className="w-10 h-10 text-primary mb-4" />
                            <p className="text-sm text-slate-300 text-center mb-4">{item.desc}</p>
                            <Button size="sm" variant="nature" asChild>
                              <a href={item.url} target="_blank" rel="noreferrer">Télécharger</a>
                            </Button>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                );
              })}
            </div>
          </section>
        )}

        {/* Catalogue */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">Catalogue</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-2xl border border-border/50">
                  <Skeleton className="w-20 h-20 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <p className="text-center text-sm text-destructive py-8">{error}</p>
          ) : courses.length === 0 ? (
            <EmptyState icon={BookOpen} title="Aucune formation trouvée" description="Essayez d'autres filtres ou un autre mot-clé." className="rounded-2xl py-12" />
          ) : (
            <div className="space-y-2.5">
              {courses.map((c) => (
                <AppCourseCard key={c.id} course={c} isEnrolled={enrolledIds.has(Number(c.id))} />
              ))}
            </div>
          )}
        </section>

        {!currentUser && (
          <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Crée ton compte pour t'inscrire</p>
              <p className="text-sm text-muted-foreground">Suis ta progression et obtiens tes certificats.</p>
            </div>
            <Button size="sm" asChild><Link to="/auth">Rejoindre</Link></Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ElearningAppView;
