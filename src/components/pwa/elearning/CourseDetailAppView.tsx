import { useState } from "react";
import { Link } from "react-router-dom";
import DOMPurify from "dompurify";
import {
  Play, Clock, Users, Star, CheckCircle, Award, Video, FileText, HelpCircle,
  Lock, Loader2, BookOpen, ChevronDown, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AppPageHeader } from "@/components/pwa/AppPageHeader";
import { StickyActionBar } from "@/components/pwa/StickyActionBar";
import CourseComments from "@/components/elearning/CourseComments";
import { getLevelColor } from "@/lib/elearningFormat";
import type { Course, BackendModule } from "@/pages/CourseDetail";
import type { AuthUser } from "@/hooks/useAuthUser";

interface SimilarCourse {
  id?: number;
  slug?: string;
  title?: string;
  category?: string;
  duration?: number;
  price?: number;
  thumbnailUrl?: string;
}

interface CourseDetailAppViewProps {
  course: Course;
  modules: BackendModule[];
  modulesLoading: boolean;
  enrolled: boolean;
  enrolling: boolean;
  currentUser: AuthUser | null;
  formatPrice: (price: number) => string;
  onEnroll: () => void;
  onContinue: () => void;
  similarCourses: SimilarCourse[];
}

export function CourseDetailAppView({
  course, modules, modulesLoading, enrolled, enrolling, currentUser,
  formatPrice, onEnroll, onContinue, similarCourses,
}: CourseDetailAppViewProps) {
  const [descExpanded, setDescExpanded] = useState(false);

  return (
    <div className="pb-32">
      <AppPageHeader title={course.title} backTo="/elearning" />

      <div className="relative aspect-video bg-muted overflow-hidden">
        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center">
            <Play className="w-7 h-7 text-white fill-white/30" />
          </div>
        </div>
        <Badge className="absolute top-3 left-3 bg-primary border-none text-xs">{course.category}</Badge>
      </div>

      <div className="px-4 pt-4 space-y-6">
        <div>
          <h1 className="text-xl font-bold leading-tight mb-2">{course.title}</h1>
          <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground mb-3">
            <Badge className={`${getLevelColor(course.level)} border text-xs`}>{course.level}</Badge>
            <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{course.duration}</span>
            <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" />{course.students} étudiants</span>
            {course.rating > 0 && (
              <span className="inline-flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />{course.rating}</span>
            )}
          </div>
          <div
            className={`text-sm text-muted-foreground leading-relaxed ${!descExpanded ? "line-clamp-3" : ""}`}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(course.longDescription) }}
          />
          {course.longDescription.length > 160 && (
            <button type="button" onClick={() => setDescExpanded((v) => !v)} className="text-primary text-xs font-semibold mt-1">
              {descExpanded ? "Voir moins" : "Voir plus"}
            </button>
          )}
        </div>

        {course.isCertifying && (
          <div className="rounded-2xl bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border border-yellow-300/50 p-4 flex items-start gap-3">
            <Award className="w-8 h-8 text-yellow-600 shrink-0" />
            <div>
              <p className="text-sm font-bold">Certification incluse</p>
              <p className="text-sm text-muted-foreground mt-0.5">Certificat officiel KILIMO vérifiable en ligne (Sertifier).</p>
            </div>
          </div>
        )}

        {/* Programme */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Programme</h2>
            {modules.length > 0 && <span className="text-sm text-muted-foreground">{modules.length} modules</span>}
          </div>
          {modulesLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Chargement…
            </div>
          ) : modules.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Le programme détaillé sera bientôt disponible.</p>
          ) : (
            <Accordion type="single" collapsible className="space-y-2">
              {modules.map((m, idx) => {
                const ModuleIcon = m.type === "video" ? Video : m.type === "pdf" ? FileText : m.type === "quiz" ? HelpCircle : BookOpen;
                return (
                  <AccordionItem key={m.id} value={`m-${m.id}`} className="border border-border/60 rounded-xl px-3 bg-card">
                    <AccordionTrigger className="hover:no-underline py-3 [&>svg]:hidden">
                      <div className="flex items-center gap-3 flex-1 text-left">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <ModuleIcon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-muted-foreground uppercase">Module {idx + 1}</p>
                          <p className="text-sm font-semibold truncate">{m.title}</p>
                        </div>
                        {!enrolled && course.price > 0 ? (
                          <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 transition-transform" />
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3 pl-11 text-sm text-muted-foreground">
                      {m.content ? <p className="line-clamp-3">{m.content}</p> : "Contenu disponible après inscription."}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </section>

        {/* Instructeur */}
        <section className="flex items-center gap-3 rounded-2xl border border-border/60 p-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
            <User className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold">{course.instructor}</p>
            {course.instructorBio && <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{course.instructorBio}</p>}
          </div>
        </section>

        {similarCourses.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">Formations similaires</h2>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 hide-scrollbar">
              {similarCourses.map((c) => (
                <Link key={c.id} to={`/elearning/${c.slug}`} className="shrink-0 w-40 rounded-2xl border border-border/60 bg-card overflow-hidden">
                  <div className="h-24 bg-muted overflow-hidden">
                    <img src={c.thumbnailUrl || "/kilimo-logo.png"} alt={c.title} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold line-clamp-2 leading-snug">{c.title}</p>
                    <p className="text-xs font-bold text-primary mt-1">{Number(c.price) > 0 ? formatPrice(Number(c.price)) : "Gratuit"}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <CourseComments courseId={Number(course.id)} currentUserId={currentUser?.id ? String(currentUser.id) : undefined} />
      </div>

      {/* Barre d'action collante (au-dessus de la nav basse) */}
      <StickyActionBar>
        {!enrolled && (
          <div className="shrink-0">
            <p className="text-sm text-muted-foreground uppercase font-semibold">Prix</p>
            <p className="text-lg font-black text-primary leading-none">{formatPrice(course.price)}</p>
          </div>
        )}
        {enrolled ? (
          <Button className="flex-1 h-12 rounded-xl font-bold" onClick={onContinue}>
            <Play className="w-4 h-4 mr-2" /> Continuer la formation
          </Button>
        ) : (
          <Button className="flex-1 h-12 rounded-xl font-bold" onClick={onEnroll} disabled={enrolling}>
            {enrolling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            {!currentUser ? "Se connecter" : course.price > 0 ? "S'inscrire" : "S'inscrire — Gratuit"}
          </Button>
        )}
      </StickyActionBar>
    </div>
  );
}

export default CourseDetailAppView;
