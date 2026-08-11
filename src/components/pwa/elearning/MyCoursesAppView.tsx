import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen, Play, Award, Calendar, Trophy, ShieldCheck,
  ShieldAlert, ExternalLink, Loader2, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AppPageHeader } from "@/components/pwa/AppPageHeader";
import { EmptyState } from "@/components/elearning/EmptyState";
import { ABSENCE_PENALTY } from "@/lib/elearningFormat";
import type { Enrollment, Certificate, Schedule } from "@/pages/MyCourses";

interface MyCoursesAppViewProps {
  active: Enrollment[];
  completed: Enrollment[];
  certificates: Certificate[];
  schedules: Schedule[];
  loadingEnrollments: boolean;
  certByCourse: (courseId: number) => Certificate | undefined;
  requestCertificate: (enrollment: Enrollment) => void;
  requestingCourseId: number | null;
}

export function MyCoursesAppView({
  active, completed, certificates, schedules, loadingEnrollments,
  certByCourse, requestCertificate, requestingCourseId,
}: MyCoursesAppViewProps) {
  const navigate = useNavigate();
  const apiBase = (import.meta as any).env?.VITE_API_BASE_URL
    || (window.location.hostname === 'kilimo.onrender.com' ? 'https://kilimo-backend.onrender.com' : window.location.origin);

  const totalAttended = schedules.filter(s => s.status === 'attended').length;
  const totalAbsent = schedules.filter(s => s.status === 'absent').length;
  const totalScheduled = schedules.filter(s => s.status === 'scheduled').length;
  const certsSent = certificates.filter(c => c.status === 'sent').length;

  return (
    <div className="pb-8">
      <AppPageHeader title="Mes cours" subtitle={`${active.length} en cours · ${completed.length} terminé${completed.length > 1 ? "s" : ""}`} />

      <div className="px-4 pt-4 space-y-8">
        {/* Résumé compact */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { icon: BookOpen, value: active.length, label: "En cours" },
            { icon: Trophy, value: completed.length, label: "Terminés" },
            { icon: Award, value: certsSent, label: "Certificats" },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl border border-border/60 p-3 text-center">
              <s.icon className="w-4 h-4 text-primary mx-auto mb-1.5" />
              <p className="text-lg font-black leading-none">{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* En cours */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">En cours</h2>
          {loadingEnrollments ? (
            <div className="space-y-2.5">
              {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}
            </div>
          ) : active.length === 0 ? (
            <EmptyState icon={BookOpen} title="Aucun cours en cours" description="Inscrivez-vous à une formation pour démarrer." action={{ label: "Découvrir les cours", onClick: () => navigate('/elearning') }} className="rounded-2xl py-10" />
          ) : (
            <div className="space-y-2.5">
              {active.map((e) => (
                <Link
                  key={e.id}
                  to={`/elearning/${e.courseId}/learn`}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-border/60 bg-card active:bg-muted/60 transition-colors"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-muted">
                    {e.course?.thumbnailUrl && <img src={e.course.thumbnailUrl} alt={e.course.title} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold line-clamp-1 mb-1.5">{e.course?.title}</h3>
                    <Progress value={e.progress} className="h-1.5 mb-1" />
                    <p className="text-[11px] text-muted-foreground">{Math.round(e.progress)}% complété</p>
                  </div>
                  <Play className="w-5 h-5 text-primary shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Terminés & certificats */}
        {completed.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">Terminés</h2>
            <div className="space-y-2.5">
              {completed.map((e) => {
                const cert = certByCourse(e.courseId);
                return (
                  <div key={e.id} className="rounded-2xl border border-yellow-300/40 bg-gradient-to-br from-yellow-50/50 to-orange-50/30 dark:from-yellow-950/10 dark:to-orange-950/5 p-3.5">
                    <div className="flex items-center gap-3 mb-2.5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shrink-0">
                        <Trophy className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold line-clamp-1">{e.course?.title}</h3>
                        <p className="text-[11px] text-muted-foreground">
                          {e.completedAt ? `Terminé le ${new Date(e.completedAt).toLocaleDateString('fr-FR')}` : "Terminé"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {!cert || cert.status === 'failed' ? (
                        <Button size="sm" className="h-8 text-xs" onClick={() => requestCertificate(e)} disabled={requestingCourseId === e.courseId}>
                          {requestingCourseId === e.courseId ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Award className="w-3.5 h-3.5 mr-1.5" />}
                          Demander le certificat
                        </Button>
                      ) : cert.status === 'sent' ? (
                        <>
                          <Button size="sm" variant="outline" className="h-8 text-xs" asChild>
                            <a href={`${apiBase}/api/certificates/${cert.id}/pdf`} target="_blank" rel="noreferrer">📄 PDF</a>
                          </Button>
                          {cert.credentialUrl && (
                            <Button size="sm" variant="outline" className="h-8 text-xs" asChild>
                              <a href={cert.credentialUrl} target="_blank" rel="noreferrer"><ExternalLink className="w-3.5 h-3.5 mr-1" />Vérifier</a>
                            </Button>
                          )}
                        </>
                      ) : (
                        <span className="inline-flex items-center text-xs text-muted-foreground"><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Émission en cours</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Présences */}
        {schedules.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Présences
            </h2>
            {totalAbsent >= ABSENCE_PENALTY.THRESHOLD && (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300/50 p-3 mb-3 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 dark:text-amber-200">
                  {totalAbsent} absences — pénalité de {ABSENCE_PENALTY.PERCENT_PER_ABSENCE}% par absence supplémentaire.
                </p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="rounded-xl border border-border/60 p-2.5 text-center">
                <p className="text-base font-black text-green-600">{totalAttended}</p>
                <p className="text-[10px] text-muted-foreground">Présent</p>
              </div>
              <div className="rounded-xl border border-border/60 p-2.5 text-center">
                <p className="text-base font-black text-destructive">{totalAbsent}</p>
                <p className="text-[10px] text-muted-foreground">Absent</p>
              </div>
              <div className="rounded-xl border border-border/60 p-2.5 text-center">
                <p className="text-base font-black text-muted-foreground">{totalScheduled}</p>
                <p className="text-[10px] text-muted-foreground">À venir</p>
              </div>
            </div>
          </section>
        )}

        {certificates.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">Tous mes certificats</h2>
            <div className="space-y-2">
              {certificates.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-border/60 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold line-clamp-1">{c.course?.title}</p>
                    <p className="text-[11px] font-mono text-muted-foreground">N° {c.certificateNumber}</p>
                  </div>
                  {c.status === 'sent' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 shrink-0"><ShieldCheck className="w-3.5 h-3.5" />Émis</span>
                  ) : c.status === 'failed' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive shrink-0"><ShieldAlert className="w-3.5 h-3.5" />Échec</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground shrink-0"><Loader2 className="w-3.5 h-3.5 animate-spin" />En cours</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default MyCoursesAppView;
