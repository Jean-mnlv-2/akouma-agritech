import { Link } from "react-router-dom";
import { Clock, Users, Star, Award, Play } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { formatCoursePrice } from "@/lib/elearningFormat";

export interface AppCourseCardData {
  id: string;
  slug: string;
  title: string;
  thumbnail: string;
  level: string;
  duration: string;
  students: number;
  rating: number | null;
  price: string;
  isCertifying: boolean;
}

interface AppCourseCardProps {
  course: AppCourseCardData;
  /** "list" = ligne horizontale aérée (catalogue) · "continue" = carte carrousel avec progression */
  variant?: "list" | "continue";
  progress?: number;
  isEnrolled?: boolean;
}

export function AppCourseCard({ course, variant = "list", progress, isEnrolled }: AppCourseCardProps) {
  const to = variant === "continue" ? `/elearning/${course.id}/learn` : `/elearning/${course.slug}`;

  if (variant === "continue") {
    return (
      <Link
        to={to}
        className="group shrink-0 w-56 snap-start rounded-2xl border border-border/60 bg-card overflow-hidden active:scale-[0.98] transition-transform"
      >
        <div className="relative h-28 overflow-hidden">
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center opacity-90 group-active:scale-90 transition-transform">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Play className="w-5 h-5 text-white fill-white/30" />
            </div>
          </div>
        </div>
        <div className="p-3">
          <h3 className="text-sm font-semibold line-clamp-2 leading-snug mb-2 min-h-[2.5rem]">{course.title}</h3>
          <Progress value={progress ?? 0} className="h-1.5 mb-1" />
          <p className="text-sm text-muted-foreground font-medium">{Math.round(progress ?? 0)}% complété</p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-3 rounded-2xl border border-border/50 bg-card active:bg-muted/60 transition-colors"
    >
      <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-muted">
        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" loading="lazy" />
        {course.isCertifying && (
          <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow">
            <Award className="w-3 h-3 text-primary-foreground" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold line-clamp-2 leading-snug mb-1">{course.title}</h3>
        <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground mb-1.5">
          <span className="px-1.5 py-0.5 rounded-md bg-muted font-medium">{course.level}</span>
          <span className="inline-flex items-center gap-0.5"><Clock className="w-3 h-3" />{course.duration}</span>
          {course.rating != null && (
            <span className="inline-flex items-center gap-0.5"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />{course.rating.toFixed(1)}</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          {isEnrolled ? (
            <span className="text-xs font-semibold text-primary">Continuer →</span>
          ) : (
            <span className="text-sm font-bold text-primary">{course.price === "Gratuit" ? "Gratuit" : formatCoursePrice(course.price)}</span>
          )}
          <span className="inline-flex items-center gap-0.5 text-sm text-muted-foreground"><Users className="w-3 h-3" />{course.students}</span>
        </div>
      </div>
    </Link>
  );
}

export default AppCourseCard;
