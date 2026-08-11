import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import QuizComponent from "@/components/elearning/QuizComponent";
import CertificateGenerator from "@/components/elearning/CertificateGenerator";
import CourseComments from "@/components/elearning/CourseComments";
import LiveCourseChat from "@/components/elearning/LiveCourseChat";
import LoadingSpinner from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/elearning/EmptyState";
import { ErrorState } from "@/components/elearning/ErrorState";
import { CourseProgressBar } from "@/components/elearning/CourseProgressBar";
import kilimoLogo from "@/assets/kilimo-logo.png";
import { api } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useEnrollments } from "@/hooks/useEnrollments";
import { useStandalonePwa } from "@/hooks/use-standalone-pwa";
import CourseLearnAppShell from "@/components/pwa/elearning/CourseLearnAppShell";
import {
  BookOpen, Video, FileText, CheckCircle, Lock, Play,
  ChevronRight, Award, Clock, ArrowLeft, MessageCircle, Loader2, Trophy, CalendarClock
} from "lucide-react";

export interface Module {
  id: number;
  title: string;
  type: string;
  duration: string | null;
  content: string | null;
  videoUrl: string | null;
  pdfUrl: string | null;
  order: number;
  quizQuestions: any;
  completed: boolean;
  locked: boolean;
  videoPositionSec: number;
  pdfPage: number;
  openDate: string | null;
  cohortLocked: boolean;
  assessmentWindowClosed: boolean;
  attempted: boolean;
}

interface RattrapageRequestData {
  id: number;
  status: 'pending' | 'granted' | 'rejected' | 'completed';
  resolutionNote: string | null;
  alternateModuleId: number | null;
  alternateModule?: { id: number; title: string; quizQuestions: any } | null;
}

interface CourseData {
  id: number;
  slug: string;
  title: string;
}

const CourseLearn = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthUser();
  const isStandalone = useStandalonePwa();

  const [course, setCourse] = useState<CourseData | null>(null);
  const [courseLoading, setCourseLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [modules, setModules] = useState<Module[]>([]);
  const [modulesLoading, setModulesLoading] = useState(true);
  const [activeModule, setActiveModule] = useState<number | null>(null);
  const [savingModuleId, setSavingModuleId] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [certificateRecord, setCertificateRecord] = useState<any>(null);
  const [certificateFailed, setCertificateFailed] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [rattrapageByModule, setRattrapageByModule] = useState<Record<number, RattrapageRequestData>>({});
  const [requestingRattrapage, setRequestingRattrapage] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastSavedRef = useRef<number>(0);

  const isPrivileged = user?.role === 'admin' || user?.role === 'supervisor';

  // Fetch the course directly by id (no more slug-then-id fallback round trip
  // — every caller now navigates here with the numeric courseId).
  useEffect(() => {
    let cancelled = false;
    const fetchCourse = async () => {
      setCourseLoading(true);
      setLoadError(null);
      try {
        const res = await api.request("GET", `/api/courses/${id}`);
        if (!cancelled) setCourse(res.data);
      } catch (e) {
        console.error("Error loading course:", e);
        if (!cancelled) setLoadError("Impossible de charger cette formation. Vérifiez votre connexion et réessayez.");
      } finally {
        if (!cancelled) setCourseLoading(false);
      }
    };
    if (id) fetchCourse();
    return () => { cancelled = true; };
  }, [id]);

  const { enrollments, findEnrollment } = useEnrollments({ courseId: course?.id, enabled: !!course?.id });
  const enrollment = course ? findEnrollment(course.id) : undefined;
  const enrollmentId = enrollment?.id ?? null;

  // Ce cours n'est accessible qu'aux inscrits (ou admin/superviseur) —
  // vérifié aussi côté serveur, mais rediriger tôt évite un écran de contenu
  // vide/cassé pour un visiteur non inscrit.
  useEffect(() => {
    if (!course || !user) return;
    if (!isPrivileged && !enrollment) {
      toast({ title: "Accès refusé", description: "Vous devez être inscrit à ce cours pour accéder à son contenu.", variant: "destructive" });
      navigate(`/elearning/${course.slug}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, user, enrollment, isPrivileged]);

  // Fetch modules + progress once the course (and, if applicable, the
  // enrollment) are known.
  useEffect(() => {
    if (!course) return;
    if (!isPrivileged && !enrollment) return; // redirect effect above handles this case

    let cancelled = false;
    const fetchModulesAndProgress = async () => {
      setModulesLoading(true);
      try {
        const modulesRes = await api.request("GET", `/api/course_modules/course/${course.id}`);
        const rawModules: any[] = modulesRes.data || [];

        const progressByModule: Record<number, { completed: boolean; videoPositionSec: number; pdfPage: number }> = {};
        if (enrollmentId) {
          try {
            const progRes = await api.request("GET", `/api/course_modules/progress/${enrollmentId}`);
            (progRes.data || []).forEach((p: any) => {
              progressByModule[p.moduleId] = {
                completed: !!p.completed,
                videoPositionSec: Number(p.videoPositionSec || 0),
                pdfPage: Math.max(1, Number(p.pdfPage || 1)),
              };
            });
          } catch { /* no progress yet */ }
        }

        // En préview admin/superviseur sans inscription personnelle, tous les
        // modules restent déverrouillés (rien à débloquer séquentiellement).
        // Verrouillage hybride : un module avec openDate est fermé pour TOUT
        // LE MONDE jusqu'à cette date (cohortLocked, calculé serveur) ; sinon
        // l'ancien verrouillage séquentiel par apprenant s'applique. Le
        // module "synthesis_exam" a en plus sa propre règle d'admissibilité
        // (tous les autres modules validés), indépendante de la date.
        const builtModules: Module[] = rawModules.map((m, idx) => {
          const p = progressByModule[m.id];
          const completed = !!p?.completed;
          let locked: boolean;
          if (isPrivileged) {
            locked = false;
          } else if (m.type === 'synthesis_exam') {
            const othersCompleted = rawModules
              .filter((om) => om.id !== m.id)
              .every((om) => progressByModule[om.id]?.completed);
            locked = !!m.cohortLocked || !othersCompleted;
          } else {
            const sequentialLocked = idx === 0 ? false : !progressByModule[rawModules[idx - 1]?.id]?.completed;
            locked = !!m.cohortLocked || sequentialLocked;
          }
          return {
            ...m,
            completed,
            locked,
            videoPositionSec: p?.videoPositionSec ?? 0,
            pdfPage: p?.pdfPage ?? 1,
            attempted: !!p,
          };
        });

        if (cancelled) return;
        setModules(builtModules);
        if (builtModules.length > 0) {
          const savedId = Number(enrollment?.currentModuleId || 0);
          const savedModule = savedId ? builtModules.find(m => m.id === savedId && !m.locked) : undefined;
          const firstIncomplete = builtModules.find(m => !m.completed && !m.locked);
          setActiveModule(savedModule?.id ?? firstIncomplete?.id ?? builtModules[0].id);
        }
      } catch (e) {
        console.error("Error loading modules:", e);
        if (!cancelled) setLoadError("Impossible de charger le programme de cette formation. Vérifiez votre connexion et réessayez.");
      } finally {
        if (!cancelled) setModulesLoading(false);
      }
    };
    fetchModulesAndProgress();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, enrollmentId, isPrivileged]);

  const loading = courseLoading || (!!course && (!isPrivileged && !enrollment ? false : modulesLoading));

  const fetchRattrapageRequests = useCallback(async () => {
    if (!enrollmentId) return;
    try {
      const res = await api.request("GET", `/api/rattrapage_requests/mine/${enrollmentId}`);
      const map: Record<number, RattrapageRequestData> = {};
      (res.data || []).forEach((r: any) => { map[r.moduleId] = r; });
      setRattrapageByModule(map);
    } catch {
      // pas bloquant : l'apprenant verra juste "demander un rattrapage" sans état préexistant
    }
  }, [enrollmentId]);

  useEffect(() => { fetchRattrapageRequests(); }, [fetchRattrapageRequests]);

  const requestRattrapage = async (moduleId: number) => {
    if (!enrollmentId || requestingRattrapage) return;
    setRequestingRattrapage(true);
    try {
      await api.request("POST", "/api/rattrapage_requests", { body: { enrollmentId, moduleId } });
      await fetchRattrapageRequests();
      toast({ title: "Demande envoyée", description: "Votre demande de rattrapage a été transmise à l'administrateur." });
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message || "Impossible d'envoyer la demande de rattrapage.", variant: "destructive" });
    } finally {
      setRequestingRattrapage(false);
    }
  };

  // Autosave navigation state (debounced, throttled to 8s). Passing
  // `moduleId` makes video/pdf position land on that module's ModuleProgress
  // row instead of a single course-wide field — required for courses with
  // more than one video/PDF module.
  const saveState = useCallback((payload: { currentModuleId?: number | null; videoPositionSec?: number; pdfPage?: number; moduleId?: number }) => {
    if (!enrollmentId) return;
    const now = Date.now();
    if (now - lastSavedRef.current < 8000) return;
    lastSavedRef.current = now;
    api.request("PUT", `/api/elearning_enrollments/${enrollmentId}/state`, { body: payload }).catch(() => {});
  }, [enrollmentId]);

  // Save active module change immediately
  useEffect(() => {
    if (enrollmentId && activeModule != null) {
      lastSavedRef.current = 0;
      saveState({ currentModuleId: activeModule });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModule, enrollmentId]);

  const currentModule = modules.find(m => m.id === activeModule);
  const currentRattrapage = currentModule ? rattrapageByModule[currentModule.id] : undefined;
  // Le rattrapage s'applique aux quiz de module ET à l'examen de synthèse.
  // Pour un quiz de module, le déclencheur est la fermeture de la fenêtre
  // d'évaluation (cohorte) sans validation. L'examen de synthèse, dernier
  // module, n'a pas de "fenêtre suivante" qui se ferme — son déclencheur est
  // directement une tentative échouée (sinon il resterait rejouable
  // indéfiniment, ce qui viderait le rattrapage de son sens pour un examen
  // final). Dans les deux cas, un rattrapage "granted" redonne accès au quiz.
  const rattrapageGateActive = !!(
    currentModule &&
    !currentModule.completed &&
    currentRattrapage?.status !== 'granted' &&
    (
      (currentModule.type === 'quiz' && currentModule.assessmentWindowClosed) ||
      (currentModule.type === 'synthesis_exam' && currentModule.attempted)
    )
  );
  const activeQuizQuestions = currentModule && currentRattrapage?.status === 'granted' && currentRattrapage.alternateModule
    ? currentRattrapage.alternateModule.quizQuestions
    : currentModule?.quizQuestions;

  // Restore video position when video module activates
  useEffect(() => {
    if (currentModule?.type !== 'video') return;
    const el = videoRef.current;
    const resumeSec = currentModule.videoPositionSec;
    if (!el || !resumeSec) return;
    const onLoaded = () => { try { el.currentTime = resumeSec; } catch { /* ignore */ } };
    el.addEventListener('loadedmetadata', onLoaded, { once: true });
    return () => el.removeEventListener('loadedmetadata', onLoaded);
  }, [activeModule, currentModule?.type, currentModule?.videoPositionSec]);

  // Poll le vrai statut d'émission du certificat plutôt que d'afficher un
  // numéro généré côté client sans rapport avec l'enregistrement réel.
  useEffect(() => {
    if (!showCertificate || !course?.id) return;
    if (certificateRecord?.status === 'sent') return;

    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 20; // ~1 minute à 3s d'intervalle

    const poll = async () => {
      attempts++;
      try {
        const res = await api.request("GET", "/api/certificates/my");
        if (cancelled) return;
        const cert = (res.data || []).find((c: any) => c.courseId === course.id || c.course?.id === course.id);
        if (cert) {
          setCertificateRecord(cert);
          if (cert.status === 'sent' || cert.status === 'failed') return;
        }
      } catch {
        // ignore, on retente au prochain tick
      }
      if (!cancelled && attempts < MAX_ATTEMPTS) {
        setTimeout(poll, 3000);
      } else if (!cancelled && attempts >= MAX_ATTEMPTS) {
        setCertificateFailed(true);
      }
    };

    poll();
    return () => { cancelled = true; };
  }, [showCertificate, course?.id, certificateRecord?.status]);

  const retryCertificateRequest = async () => {
    if (!course?.id) return;
    setCertificateFailed(false);
    setCertificateRecord(null);
    try {
      await api.request("POST", "/api/certificates/request", { body: { courseId: course.id, score: quizScore ?? undefined } });
    } catch {
      setCertificateFailed(true);
    }
  };

  const completedCount = modules.filter(m => m.completed).length;
  const totalProgress = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;

  const handleModuleComplete = async (moduleId: number, score?: number) => {
    if (enrollmentId) {
      setSavingModuleId(moduleId);
      try {
        await api.request("POST", "/api/course_modules/progress", {
          body: { enrollmentId, moduleId, quizScore: score },
        });
      } catch (e) {
        console.error("Failed to save progress:", e);
        toast({ title: "Erreur", description: "Impossible d'enregistrer votre progression. Réessayez.", variant: "destructive" });
        setSavingModuleId(null);
        return;
      }
      setSavingModuleId(null);
    }

    setModules(prev => {
      const updated = prev.map(m => m.id === moduleId ? { ...m, completed: true } : m);
      const idx = updated.findIndex(m => m.id === moduleId);
      if (idx >= 0 && idx < updated.length - 1) {
        updated[idx + 1] = { ...updated[idx + 1], locked: false };
      }
      // Décidé ici (sur le tableau frais `updated`, jamais sur l'état
      // périmé) — que ce soit un quiz ou un module classique qui termine le
      // cours, l'écran de certificat s'affiche dans les deux cas.
      const allDone = updated.every(m => m.completed);
      if (allDone && course?.id) {
        api.request("POST", "/api/certificates/request", { body: { courseId: course.id, score: score ?? undefined } }).catch(() => {});
        setTimeout(() => setShowCertificate(true), 1200);
      }
      return updated;
    });

    toast({ title: "Module terminé !", description: "Votre progression a été enregistrée." });
  };

  // Enregistre une tentative ÉCHOUÉE de l'examen de synthèse (completed:
  // false) — nécessaire car ce module n'a pas de "fenêtre suivante" qui se
  // ferme comme les autres ; sans cette trace, il resterait librement
  // rejouable et la demande de rattrapage n'aurait jamais de sens pour lui.
  const recordFailedSynthesisAttempt = async (moduleId: number, score: number) => {
    if (!enrollmentId) return;
    try {
      await api.request("POST", "/api/course_modules/progress", {
        body: { enrollmentId, moduleId, quizScore: score, completed: false },
      });
    } catch (e) {
      console.error("Failed to record synthesis exam attempt:", e);
    }
    setModules(prev => prev.map(m => m.id === moduleId ? { ...m, attempted: true } : m));
  };

  const handleQuizComplete = (score: number, passed: boolean) => {
    setQuizScore(score);
    if (!currentModule) return;
    if (passed) {
      handleModuleComplete(currentModule.id, score);
    } else if (currentModule.type === 'synthesis_exam') {
      recordFailedSynthesisAttempt(currentModule.id, score);
    }
  };

  const getModuleIcon = (type: string) => {
    switch (type) {
      case "video": return Video;
      case "text": return FileText;
      case "pdf": return FileText;
      case "quiz": return Award;
      case "synthesis_exam": return Trophy;
      default: return BookOpen;
    }
  };

  const renderQuizQuestions = (questions: any) => {
    if (!questions) return null;
    let parsed = questions;
    if (typeof questions === 'string') {
      try {
        parsed = JSON.parse(questions);
      } catch {
        return null;
      }
    }
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="large" text="Chargement du cours..." />
        </div>
        <Footer />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-6 py-12 max-w-xl">
          <ErrorState description={loadError} onRetry={() => window.location.reload()} />
        </div>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-6 py-12">
          <EmptyState
            icon={BookOpen}
            title="Formation introuvable"
            description="Cette formation n'existe pas ou a été retirée du catalogue."
            action={{ label: "Retour aux cours", onClick: () => navigate("/elearning") }}
          />
        </div>
        <Footer />
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-6 py-12">
          <EmptyState
            icon={BookOpen}
            title="Aucun module disponible"
            description="Ce cours n'a pas encore de modules. Revenez plus tard."
            action={{ label: "Retour aux cours", onClick: () => navigate("/elearning") }}
          />
        </div>
        <Footer />
      </div>
    );
  }

  const seo = (
    <SEO
      title={`${course.title} - KILIMO E-Learning`}
      description="Suivez votre formation"
      path={window.location.origin + `/elearning/${course.id}/learn`}
      image={kilimoLogo}
    />
  );

  const mainContent = (
    <>
      {showCertificate ? (
        certificateRecord?.status === 'sent' ? (
          <CertificateGenerator data={{
            studentName: (user as any)?.fullName || user?.name || "Apprenant KILIMO",
            courseName: course.title,
            completionDate: certificateRecord.completionDate || new Date().toISOString(),
            score: certificateRecord.score ?? quizScore ?? 100,
            certificateNumber: certificateRecord.certificateNumber,
          }} />
        ) : certificateFailed || certificateRecord?.status === 'failed' ? (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <p className="text-destructive font-medium">
                L'émission de votre certificat a rencontré un problème.
              </p>
              <p className="text-sm text-muted-foreground">
                Votre progression est bien enregistrée. Réessayez ou contactez le support si le problème persiste.
              </p>
              <Button onClick={retryCertificateRequest}>Réessayer</Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              <p className="font-medium">Émission de votre certificat en cours…</p>
              <p className="text-sm text-muted-foreground">
                Cela peut prendre quelques instants. Cette page se mettra à jour automatiquement.
              </p>
            </CardContent>
          </Card>
        )
      ) : rattrapageGateActive && currentModule ? (
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <CalendarClock className="w-12 h-12 text-amber-500 mx-auto" />
            <h2 className="text-xl font-bold">
              {currentModule.type === 'synthesis_exam' ? "Examen de synthèse non validé" : "Module non validé"}
            </h2>
            {currentRattrapage?.status === 'pending' ? (
              <p className="text-muted-foreground">
                Votre demande de rattrapage a été envoyée et est en attente de réponse de l'administrateur.
              </p>
            ) : currentRattrapage?.status === 'rejected' ? (
              <>
                <p className="text-muted-foreground">
                  Votre demande de rattrapage a été refusée{currentRattrapage.resolutionNote ? ` : ${currentRattrapage.resolutionNote}` : '.'}
                </p>
                <Button onClick={() => requestRattrapage(currentModule.id)} disabled={requestingRattrapage}>
                  {requestingRattrapage ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Envoi…</> : "Redemander un rattrapage"}
                </Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">
                  {currentModule.type === 'synthesis_exam'
                    ? "Vous n'avez pas validé l'examen de synthèse. Vous pouvez demander un rattrapage."
                    : "La fenêtre d'évaluation de ce module est fermée et vous ne l'avez pas validé. Vous pouvez demander un rattrapage."}
                </p>
                <Button onClick={() => requestRattrapage(currentModule.id)} disabled={requestingRattrapage}>
                  {requestingRattrapage ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Envoi…</> : "Demander un rattrapage"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (currentModule?.type === "quiz" || currentModule?.type === "synthesis_exam") && renderQuizQuestions(activeQuizQuestions) ? (
        <QuizComponent
          moduleId={currentModule.id}
          title={currentRattrapage?.status === 'granted' && currentRattrapage.alternateModule ? `Rattrapage : ${currentModule.title}` : currentModule.title}
          questions={renderQuizQuestions(activeQuizQuestions)!}
          passingScore={70}
          onComplete={handleQuizComplete}
          onRetry={() => setQuizScore(null)}
        />
      ) : currentModule?.type === "video" ? (
        <Card>
          <CardContent className="p-0">
            {currentModule.videoUrl ? (
              /\.(mp4|webm|mov|m4v)(\?|$)/i.test(currentModule.videoUrl) ? (
                <video
                  ref={videoRef}
                  src={currentModule.videoUrl}
                  className="w-full aspect-video bg-black rounded-t-lg"
                  controls
                  playsInline
                  onTimeUpdate={(e) => {
                    const t = Math.floor((e.target as HTMLVideoElement).currentTime || 0);
                    if (t > 0 && t % 10 === 0) saveState({ videoPositionSec: t, moduleId: currentModule.id });
                  }}
                  onPause={(e) => saveState({ videoPositionSec: Math.floor((e.target as HTMLVideoElement).currentTime || 0), moduleId: currentModule.id })}
                />
              ) : (
              <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
                <iframe
                  src={currentModule.videoUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={currentModule.title}
                />
              </div>
              )
            ) : (
              <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-t-lg flex items-center justify-center">
                <div className="text-center text-white">
                  <Play className="w-16 h-16 mx-auto mb-4 opacity-80" />
                  <p className="text-lg font-semibold">{currentModule.title}</p>
                  {currentModule.duration && (
                    <p className="text-sm text-white/60 mt-2">Durée : {currentModule.duration}</p>
                  )}
                </div>
              </div>
            )}
            <div className="p-6">
              <h2 className="text-xl font-bold mb-2">{currentModule.title}</h2>
              <p className="text-muted-foreground mb-4">
                Regardez la vidéo complète pour débloquer le module suivant.
                {currentModule.videoPositionSec > 0 && (
                  <span className="block text-xs text-primary mt-1">⏱ Reprise sauvegardée à {Math.floor(currentModule.videoPositionSec / 60)}:{String(currentModule.videoPositionSec % 60).padStart(2, '0')}</span>
                )}
              </p>
              {!currentModule.completed && (
                <Button onClick={() => handleModuleComplete(currentModule.id)} disabled={savingModuleId === currentModule.id}>
                  {savingModuleId === currentModule.id ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement…</>
                  ) : (
                    <><CheckCircle className="w-4 h-4 mr-2" /> Marquer comme terminé</>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : currentModule?.type === "text" ? (
        <Card>
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-2xl font-bold mb-6">{currentModule.title}</h2>
            <div className="prose prose-lg dark:prose-invert max-w-none">
              {currentModule.content?.split('\n').map((line, i) => {
                if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-6 mb-3 text-primary">{line.replace('## ', '')}</h2>;
                if (line.startsWith('- **')) {
                  const parts = line.replace('- **', '').split('**');
                  return <li key={i} className="ml-4 mb-2"><strong>{parts[0]}</strong>{parts[1]}</li>;
                }
                if (line.match(/^\d+\./)) return <li key={i} className="ml-4 mb-2">{line.replace(/^\d+\.\s*/, '')}</li>;
                if (line.trim() === '') return <br key={i} />;
                return <p key={i} className="mb-3 text-foreground leading-relaxed">{line}</p>;
              })}
            </div>
            {!currentModule.completed && (
              <div className="mt-8">
                <Button onClick={() => handleModuleComplete(currentModule.id)} disabled={savingModuleId === currentModule.id}>
                  {savingModuleId === currentModule.id ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement…</>
                  ) : (
                    <><CheckCircle className="w-4 h-4 mr-2" /> Marquer comme terminé</>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : currentModule?.type === "pdf" ? (
        <Card>
          <CardContent className="p-6 sm:p-8 text-center">
            <FileText className="w-20 h-20 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">{currentModule.title}</h2>
            <p className="text-muted-foreground mb-2">Téléchargez et consultez le document PDF ci-dessous.</p>
            {currentModule.pdfPage > 1 && (
              <p className="text-xs text-primary mb-4">📑 Reprise sauvegardée : page {currentModule.pdfPage}</p>
            )}
            {currentModule.pdfUrl && (
              <iframe
                src={`${currentModule.pdfUrl}#page=${currentModule.pdfPage}`}
                className="w-full h-[60vh] border rounded-lg mb-4"
                title={currentModule.title}
                onLoad={() => saveState({ pdfPage: currentModule.pdfPage, moduleId: currentModule.id })}
              />
            )}
            <div className="flex items-center justify-center gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const next = Math.max(1, currentModule.pdfPage - 1);
                  setModules(prev => prev.map(m => m.id === currentModule.id ? { ...m, pdfPage: next } : m));
                  lastSavedRef.current = 0;
                  saveState({ pdfPage: next, moduleId: currentModule.id });
                }}
              >
                Page précédente
              </Button>
              <span className="text-sm text-muted-foreground">Page {currentModule.pdfPage}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const next = currentModule.pdfPage + 1;
                  setModules(prev => prev.map(m => m.id === currentModule.id ? { ...m, pdfPage: next } : m));
                  lastSavedRef.current = 0;
                  saveState({ pdfPage: next, moduleId: currentModule.id });
                }}
              >
                Page suivante
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {currentModule.pdfUrl && (
                <Button variant="outline" asChild>
                  <a href={currentModule.pdfUrl} target="_blank" rel="noreferrer">
                    <FileText className="w-4 h-4 mr-2" /> Consulter le PDF
                  </a>
                </Button>
              )}
              {!currentModule.completed && (
                <Button onClick={() => handleModuleComplete(currentModule.id)} disabled={savingModuleId === currentModule.id}>
                  {savingModuleId === currentModule.id ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement…</>
                  ) : (
                    <><CheckCircle className="w-4 h-4 mr-2" /> Marquer comme terminé</>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </>
  );

  const commentsSlot = currentModule && (
    <CourseComments courseId={course.id} moduleId={currentModule.id} currentUserId={user?.id ? String(user.id) : undefined} />
  );
  const chatSlot = <LiveCourseChat courseId={course.id} currentUserId={user?.id ? String(user.id) : undefined} />;

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-background">
        {seo}
        <Header />
        <CourseLearnAppShell
          courseTitle={course.title}
          modules={modules}
          activeModuleId={activeModule}
          onSelectModule={setActiveModule}
          progress={totalProgress}
          completedCount={completedCount}
          getModuleIcon={getModuleIcon}
          onBack={() => navigate(`/elearning/${course.slug}`)}
          showComments={showComments}
          onToggleComments={() => setShowComments((v) => !v)}
          commentsSlot={commentsSlot}
          showChat={showChat}
          onToggleChat={() => setShowChat((v) => !v)}
          chatSlot={chatSlot}
        >
          {mainContent}
        </CourseLearnAppShell>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {seo}
      <Header />

      <main className="container mx-auto px-4 sm:px-6 py-6">
        {/* Back + Progress */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate(`/elearning/${course.slug}`)} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour au cours
          </Button>
          <CourseProgressBar progress={totalProgress} completedModules={completedCount} totalModules={modules.length} className="w-full sm:w-64" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="sticky top-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" /> Modules
                </CardTitle>
                <p className="text-sm text-muted-foreground">{completedCount}/{modules.length} complétés</p>
              </CardHeader>
              <CardContent className="p-2">
                <div className="space-y-1">
                  {modules.map((mod) => {
                    const Icon = getModuleIcon(mod.type);
                    const isActive = mod.id === activeModule;
                    return (
                      <button
                        key={mod.id}
                        onClick={() => !mod.locked && setActiveModule(mod.id)}
                        disabled={mod.locked}
                        className={`w-full text-left p-3 rounded-lg flex items-start gap-3 transition-all text-sm ${
                          isActive ? 'bg-primary/10 border border-primary/30' :
                          mod.locked ? 'opacity-50 cursor-not-allowed' :
                          'hover:bg-muted'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          mod.completed ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400' :
                          isActive ? 'bg-primary/20 text-primary' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {mod.completed ? <CheckCircle className="w-4 h-4" /> :
                           mod.locked ? <Lock className="w-4 h-4" /> :
                           <Icon className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>{mod.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{mod.type}</Badge>
                            {mod.duration && (
                              <span className="text-xs text-muted-foreground flex items-center">
                                <Clock className="w-3 h-3 mr-1" />{mod.duration}
                              </span>
                            )}
                          </div>
                          {mod.locked && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {mod.type === 'synthesis_exam'
                                ? 'Terminez tous les quiz de modules pour y accéder'
                                : mod.cohortLocked && mod.openDate
                                  ? `Ouvre le ${new Date(mod.openDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
                                  : 'Terminez le module précédent'}
                            </p>
                          )}
                        </div>
                        {isActive && <ChevronRight className="w-4 h-4 text-primary flex-shrink-0 mt-2" />}
                      </button>
                    );
                  })}
                </div>

                {/* Comments & Chat toggle */}
                <div className="mt-4 pt-4 border-t space-y-2">
                  <Button
                    variant={showComments ? "default" : "outline"}
                    size="sm"
                    className="w-full"
                    onClick={() => setShowComments(!showComments)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {showComments ? "Masquer discussions" : "Voir discussions"}
                  </Button>
                  <Button
                    variant={showChat ? "default" : "outline"}
                    size="sm"
                    className="w-full"
                    onClick={() => setShowChat(!showChat)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {showChat ? "Masquer le chat" : "💬 Chat live"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3 order-1 lg:order-2 space-y-6">
            {mainContent}

            {showComments && currentModule && commentsSlot}
            {showChat && chatSlot}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CourseLearn;
