import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TitleManager from "@/components/TitleManager";
import QuizComponent from "@/components/elearning/QuizComponent";
import CertificateGenerator from "@/components/elearning/CertificateGenerator";
import CourseComments from "@/components/elearning/CourseComments";
import LiveCourseChat from "@/components/elearning/LiveCourseChat";
import LoadingSpinner from "@/components/LoadingSpinner";
import kilimoLogo from "@/assets/kilimo-logo.png";
import { api } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, Video, FileText, CheckCircle, Lock, Play,
  ChevronRight, Award, Clock, ArrowLeft, MessageCircle
} from "lucide-react";

interface Module {
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
}

const CourseLearn = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [modules, setModules] = useState<Module[]>([]);
  const [activeModule, setActiveModule] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null);
  const [, setProgressMap] = useState<Record<number, boolean>>({});
  const [showComments, setShowComments] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [resumeVideoSec, setResumeVideoSec] = useState(0);
  const [pdfPage, setPdfPage] = useState(1);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastSavedRef = useRef<number>(0);

  // Fetch user, course, modules, enrollment, progress
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Get user
      const { data: userData } = await api.auth.getUser();
      const currentUser = userData?.user;
      setUser(currentUser);

      // Get course by slug or ID
      let courseData;
      try {
        const res = await api.request("GET", `/api/courses/slug/${id}`);
        courseData = res.data;
      } catch {
        const res = await api.request("GET", `/api/courses/${id}`);
        courseData = res.data;
      }
      setCourse(courseData);

      if (!courseData) { setLoading(false); return; }

      // Get modules
      const modulesRes = await api.request("GET", `/api/course_modules/course/${courseData.id}`);
      const rawModules: any[] = modulesRes.data || [];

      // Get enrollment
      let enrId: number | null = null;
      const pMap: Record<number, boolean> = {};
      if (currentUser) {
        try {
          const enrRes = await api.request("GET", "/api/elearning_enrollments");
          const enrollments = enrRes.data || [];
          const myEnr = enrollments.find((e: any) => 
            String(e.userId) === String(currentUser.id) && String(e.courseId) === String(courseData.id)
          );
          if (myEnr) {
            enrId = myEnr.id;
            // Get progress
            try {
              const progRes = await api.request("GET", `/api/course_modules/progress/${myEnr.id}`);
              (progRes.data || []).forEach((p: any) => {
                if (p.completed) pMap[p.moduleId] = true;
              });
            } catch { /* no progress yet */ }
          }
        } catch { /* not enrolled */ }
      }
      setEnrollmentId(enrId);
      setProgressMap(pMap);

      // Restore resume state from enrollment row
      const myEnrFull = (await api.request("GET", "/api/elearning_enrollments").catch(() => ({ data: [] }))).data
        ?.find?.((e: any) => e.id === enrId);
      if (myEnrFull) {
        setResumeVideoSec(Number(myEnrFull.videoPositionSec || 0));
        setPdfPage(Math.max(1, Number(myEnrFull.pdfPage || 1)));
      }

      // Build module list with completion and lock state
      const builtModules: Module[] = rawModules.map((m, idx) => {
        const completed = !!pMap[m.id];
        // Lock if previous module not completed (sequential access)
        const locked = idx === 0 ? false : !pMap[rawModules[idx - 1]?.id];
        return { ...m, completed, locked };
      });

      setModules(builtModules);
      if (builtModules.length > 0) {
        // Resume: prefer last saved module if accessible, otherwise first incomplete
        const savedId = Number(myEnrFull?.currentModuleId || 0);
        const savedModule = savedId ? builtModules.find(m => m.id === savedId && !m.locked) : undefined;
        const firstIncomplete = builtModules.find(m => !m.completed && !m.locked);
        setActiveModule(savedModule?.id ?? firstIncomplete?.id ?? builtModules[0].id);
      }
    } catch (e) {
      console.error("Error loading course data:", e);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Autosave navigation state (debounced, throttled to 10s)
  const saveState = useCallback((payload: { currentModuleId?: number | null; videoPositionSec?: number; pdfPage?: number }) => {
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

  // Restore video position when video module activates
  useEffect(() => {
    if (currentModule?.type !== 'video') return;
    const el = videoRef.current;
    if (!el || !resumeVideoSec) return;
    const onLoaded = () => { try { el.currentTime = resumeVideoSec; } catch {} };
    el.addEventListener('loadedmetadata', onLoaded, { once: true });
    return () => el.removeEventListener('loadedmetadata', onLoaded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModule]);

  const currentModule = modules.find(m => m.id === activeModule);
  const completedCount = modules.filter(m => m.completed).length;
  const totalProgress = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;

  const handleModuleComplete = async (moduleId: number, score?: number) => {
    // Persist to backend
    if (enrollmentId) {
      try {
        await api.request("POST", "/api/course_modules/progress", {
          body: { enrollmentId, moduleId, quizScore: score },
        });
      } catch (e) {
        console.error("Failed to save progress:", e);
      }
    }

    // Update local state
    setProgressMap(prev => ({ ...prev, [moduleId]: true }));
    setModules(prev => {
      const updated = prev.map(m => m.id === moduleId ? { ...m, completed: true } : m);
      // Unlock next
      const idx = updated.findIndex(m => m.id === moduleId);
      if (idx < updated.length - 1) {
        updated[idx + 1] = { ...updated[idx + 1], locked: false };
      }
      // Si tous les modules sont complétés, demander l'émission du certificat
      const allDone = updated.every(m => m.completed);
      if (allDone && course?.id) {
        api.request("POST", "/api/certificates/request", { body: { courseId: course.id, score: score ?? undefined } }).catch(() => {});
      }
      return updated;
    });

    toast({ title: "Module terminé !", description: "Votre progression a été enregistrée." });
  };

  const handleQuizComplete = (score: number, passed: boolean) => {
    setQuizScore(score);
    if (passed && currentModule) {
      handleModuleComplete(currentModule.id, score);
      const allDone = modules.every(m => m.completed || m.id === currentModule.id);
      if (allDone && currentModule.id === modules[modules.length - 1]?.id) {
        setTimeout(() => setShowCertificate(true), 1500);
      }
    }
  };

  const getModuleIcon = (type: string) => {
    switch (type) {
      case "video": return Video;
      case "text": return FileText;
      case "pdf": return FileText;
      case "quiz": return Award;
      default: return BookOpen;
    }
  };

  const renderQuizQuestions = (questions: any) => {
    if (!questions) return null;
    const parsed = typeof questions === 'string' ? JSON.parse(questions) : questions;
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

  if (!course || modules.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-6 py-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-40" />
          <h1 className="text-2xl font-bold mb-2">Aucun module disponible</h1>
          <p className="text-muted-foreground mb-6">Ce cours n'a pas encore de modules. Revenez plus tard.</p>
          <Button variant="outline" onClick={() => navigate("/elearning")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux cours
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TitleManager
        title={`${course.title} - KILIMO E-Learning`}
        description="Suivez votre formation"
        canonical={window.location.origin + `/elearning/${id}/learn`}
        image={kilimoLogo}
      />
      <Header />

      <main className="container mx-auto px-4 sm:px-6 py-6">
        {/* Back + Progress */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate(`/elearning/${course.slug || id}`)} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour au cours
          </Button>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Progress value={totalProgress} className="h-3 w-48" />
            <span className="text-sm font-semibold text-primary">{totalProgress}%</span>
          </div>
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
            {showCertificate ? (
              <CertificateGenerator data={{
                studentName: user?.fullName || "Apprenant KILIMO",
                courseName: course.title,
                completionDate: new Date().toISOString(),
                score: quizScore || 85,
                certificateNumber: `KLM-CERT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`,
              }} />
            ) : currentModule?.type === "quiz" && renderQuizQuestions(currentModule.quizQuestions) ? (
              <QuizComponent
                title={currentModule.title}
                questions={renderQuizQuestions(currentModule.quizQuestions)!}
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
                          if (t > 0 && t % 10 === 0) saveState({ videoPositionSec: t });
                        }}
                        onPause={(e) => saveState({ videoPositionSec: Math.floor((e.target as HTMLVideoElement).currentTime || 0) })}
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
                      {resumeVideoSec > 0 && (
                        <span className="block text-xs text-primary mt-1">⏱ Reprise sauvegardée à {Math.floor(resumeVideoSec/60)}:{String(resumeVideoSec%60).padStart(2,'0')}</span>
                      )}
                    </p>
                    {!currentModule.completed && (
                      <Button onClick={() => handleModuleComplete(currentModule.id)}>
                        <CheckCircle className="w-4 h-4 mr-2" /> Marquer comme terminé
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
                      <Button onClick={() => handleModuleComplete(currentModule.id)}>
                        <CheckCircle className="w-4 h-4 mr-2" /> Marquer comme terminé
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
                  {pdfPage > 1 && (
                    <p className="text-xs text-primary mb-4">📑 Reprise sauvegardée : page {pdfPage}</p>
                  )}
                  {currentModule.pdfUrl && (
                    <iframe
                      src={`${currentModule.pdfUrl}#page=${pdfPage}`}
                      className="w-full h-[60vh] border rounded-lg mb-4"
                      title={currentModule.title}
                      onLoad={() => saveState({ pdfPage })}
                    />
                  )}
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Button variant="outline" size="sm" onClick={() => { const next = Math.max(1, pdfPage - 1); setPdfPage(next); lastSavedRef.current = 0; saveState({ pdfPage: next }); }}>Page précédente</Button>
                    <span className="text-sm text-muted-foreground">Page {pdfPage}</span>
                    <Button variant="outline" size="sm" onClick={() => { const next = pdfPage + 1; setPdfPage(next); lastSavedRef.current = 0; saveState({ pdfPage: next }); }}>Page suivante</Button>
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
                      <Button onClick={() => handleModuleComplete(currentModule.id)}>
                        <CheckCircle className="w-4 h-4 mr-2" /> Marquer comme terminé
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Comments section per module */}
            {showComments && currentModule && (
              <CourseComments
                courseId={course.id}
                moduleId={currentModule.id}
                currentUserId={user?.id}
              />
            )}

            {/* Live chat */}
            {showChat && (
              <LiveCourseChat
                courseId={course.id}
                currentUserId={user?.id}
              />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CourseLearn;
