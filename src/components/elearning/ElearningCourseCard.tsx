import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Clock, Users, Award, Star, Eye, GraduationCap, PlayCircle, UserPlus, Download, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import DOMPurify from 'dompurify';

interface User {
  id: string | number;
  email: string;
  name?: string;
}

interface PreviewItem {
  id: string | number;
  courseId: number;
  title: string;
  description?: string;
  type: string;
  url: string;
  previewType?: {
    name: string;
  };
}

interface CourseCardProps {
  course: {
    id: string;
    slug: string;
    title: string;
    description: string;
    price: string;
    category: string;
    level: string;
    duration: string;
    students: number;
    rating: number;
    isCertifying: boolean;
    thumbnail: string;
    instructor: string;
    isPreviewAvailable?: boolean;
  };
  currentUser: User | null;
  isEnrolled?: boolean;
  previewItems: PreviewItem[];
  onEnroll: () => void;
  t: (key: string) => string;
  index: number;
}

const getLevelColor = (level: string) => {
  switch (level.toLowerCase()) {
    case 'débutant': case 'beginner': return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700';
    case 'intermédiaire': case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700';
    case 'avancé': case 'advanced': return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

const ElearningCourseCard = ({ course, currentUser, isEnrolled, previewItems, onEnroll, t, index }: CourseCardProps) => {
  const navigate = useNavigate();
  const coursePreviewItems = previewItems.filter((it: PreviewItem) => it.courseId === Number(course.id));

  return (
    <Card className="group hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border border-border overflow-hidden flex flex-col" style={{ transitionDelay: `${index * 50}ms` }}>
      {/* Thumbnail */}
      <div className="relative overflow-hidden h-48">
        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <Badge className={`${getLevelColor(course.level)} text-xs font-semibold border`}>{course.level}</Badge>
          {course.isCertifying && (
            <Badge className="bg-yellow-500 text-yellow-50 text-xs border-yellow-600">
              <Award className="w-3 h-3 mr-1" />
              {t("elearning.certifying")}
            </Badge>
          )}
        </div>
        {course.price === "Gratuit" && (
          <Badge className="absolute top-3 right-3 bg-green-500 text-green-50">{t("elearning.free")}</Badge>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-14 h-14 bg-background/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <PlayCircle className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      <CardHeader className="pb-2 flex-1">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-xs">{course.category || t("elearning.category")}</Badge>
          <div className="flex items-center gap-1 text-sm">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="font-semibold">{course.rating}</span>
          </div>
        </div>
        <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-2">
          {course.title}
        </CardTitle>
        <CardDescription className="line-clamp-2 text-sm">
          <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(course.description) }} />
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground mb-3 flex-wrap font-medium">
          <span className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3 text-primary" />{course.duration}</span>
          <span className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-full"><Users className="w-3 h-3 text-primary" />{course.students} {t("elearning.students_label")}</span>
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
            <GraduationCap className="w-4 h-4 text-primary" />
          </div>
          <span className="text-xs font-semibold text-foreground/80">{course.instructor}</span>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-primary/10 mb-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("elearning.price_label") || "Prix"}</span>
            <span className="text-xl font-black text-primary">
              {course.price === "Gratuit" || course.price === "0" ? (
                <span className="text-green-600 dark:text-green-400">Gratuit</span>
              ) : (
                `${course.price} FCFA`
              )}
            </span>
          </div>
          {course.price !== "Gratuit" && course.price !== "0" && (
            <span className="text-xs text-muted-foreground line-through opacity-50 font-medium">
              {(Number(course.price) * 1.5).toLocaleString()} FCFA
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="rounded-xl font-bold border-2 hover:bg-primary/5 hover:border-primary/30 transition-all" asChild>
            <Link to={`/elearning/${course.slug}`}>
              <Eye className="w-4 h-4 mr-1.5" />
              {t("elearning.view_program")}
            </Link>
          </Button>
          <Button
            size="sm"
            className="rounded-xl font-bold shadow-md transition-all active:scale-95"
            variant={isEnrolled ? "outline" : (currentUser ? "default" : "nature")}
            onClick={() => {
              if (isEnrolled) return;
              currentUser ? onEnroll() : navigate('/auth');
            }}
            disabled={isEnrolled}
          >
            {isEnrolled ? (
              <><CheckCircle className="w-4 h-4 mr-1.5" />{t("elearning.enrolled") || "Inscrit"}</>
            ) : currentUser ? (
              <><UserPlus className="w-4 h-4 mr-1.5" />{t("elearning.enroll")}</>
            ) : (
              <><PlayCircle className="w-4 h-4 mr-1.5" />Démarrer</>
            )}
          </Button>
        </div>

        {/* Course-specific preview */}
        {course.isPreviewAvailable && coursePreviewItems.length > 0 && (
          <div className="mt-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="w-full">
                  <Eye className="w-4 h-4 mr-2" />
                  {t("elearning.preview.open")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{t("elearning.preview.title")}</DialogTitle>
                  <DialogDescription>Consultez un extrait du cours avant de vous inscrire.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {coursePreviewItems.map((item: PreviewItem) => {
                    const isVideo = item.type === 'video' || item.previewType?.name === 'video';
                    return (
                      <div key={item.id} className="border rounded-lg p-3 space-y-3">
                        <div className="flex items-center gap-3">
                          {isVideo ? <PlayCircle className="w-5 h-5 text-primary" /> : <Download className="w-5 h-5 text-primary" />}
                          <div>
                            <div className="font-medium">{item.title}</div>
                            {item.description && <div className="text-sm text-muted-foreground">{item.description}</div>}
                          </div>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              {isVideo ? t("elearning.preview.watch") : t("elearning.preview.download")}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-none">
                            <DialogHeader className="sr-only">
                              <DialogTitle>{item.title}</DialogTitle>
                              <DialogDescription>{item.description || item.title}</DialogDescription>
                            </DialogHeader>
                            <div className="aspect-video w-full">
                              {isVideo ? (
                                <iframe src={item.url} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-white p-8">
                                  <Download className="w-16 h-16 mb-4 text-primary" />
                                  <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                                  <Button asChild><a href={item.url} target="_blank" rel="noreferrer">Télécharger</a></Button>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ElearningCourseCard;
