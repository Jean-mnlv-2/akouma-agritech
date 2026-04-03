import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
// Tabs removed - unused
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TitleManager from "@/components/TitleManager";
import QuizComponent from "@/components/elearning/QuizComponent";
import CertificateGenerator from "@/components/elearning/CertificateGenerator";
import logoAk from "@/assets/logo-ak.png";
import {
  BookOpen, Video, FileText, CheckCircle, Lock, Play,
  ChevronRight, Award, Clock, ArrowLeft
} from "lucide-react";

interface Module {
  id: string;
  title: string;
  type: "video" | "text" | "pdf" | "quiz";
  duration: string;
  completed: boolean;
  locked: boolean;
  content?: string;
  quizQuestions?: any[];
}

const DEMO_MODULES: Module[] = [
  { id: "1", title: "Introduction à l'Agriculture Moderne", type: "video", duration: "15 min", completed: true, locked: false, content: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: "2", title: "Les capteurs IoT en agriculture", type: "text", duration: "10 min", completed: true, locked: false, content: "Les capteurs IoT (Internet of Things) révolutionnent l'agriculture en permettant une surveillance en temps réel des cultures. Ces capteurs mesurent l'humidité du sol, la température, la luminosité et d'autres paramètres essentiels.\n\n## Types de capteurs\n- **Capteurs d'humidité** : Mesurent le taux d'humidité du sol\n- **Capteurs de température** : Surveillent les variations thermiques\n- **Capteurs de luminosité** : Optimisent l'exposition solaire\n- **Capteurs de pH** : Contrôlent l'acidité du sol\n\n## Avantages\n1. Réduction de la consommation d'eau de 30%\n2. Amélioration des rendements de 25%\n3. Détection précoce des maladies\n4. Optimisation des intrants agricoles" },
  { id: "3", title: "Document : Guide d'installation", type: "pdf", duration: "5 min", completed: false, locked: false },
  { id: "4", title: "Quiz : Fondamentaux IoT", type: "quiz", duration: "10 min", completed: false, locked: false, quizQuestions: [
    { id: "q1", question: "Quel est l'avantage principal des capteurs IoT en agriculture ?", options: ["Réduire le travail manuel uniquement", "Surveiller en temps réel les cultures", "Remplacer les agriculteurs", "Augmenter les coûts"], correctAnswer: 1, explanation: "Les capteurs IoT permettent une surveillance en temps réel des paramètres essentiels des cultures." },
    { id: "q2", question: "De combien les capteurs IoT peuvent-ils réduire la consommation d'eau ?", options: ["10%", "20%", "30%", "50%"], correctAnswer: 2, explanation: "Les études montrent une réduction moyenne de 30% de la consommation d'eau grâce à l'irrigation intelligente." },
    { id: "q3", question: "Quel capteur mesure l'acidité du sol ?", options: ["Capteur d'humidité", "Capteur de température", "Capteur de pH", "Capteur de luminosité"], correctAnswer: 2, explanation: "Le capteur de pH est spécifiquement conçu pour mesurer l'acidité ou l'alcalinité du sol." },
    { id: "q4", question: "Quelle technologie permet la transmission des données des capteurs ?", options: ["Bluetooth uniquement", "Wi-Fi uniquement", "LoRaWAN / Réseaux IoT", "Câble Ethernet"], correctAnswer: 2, explanation: "LoRaWAN et les réseaux IoT longue portée sont les plus adaptés pour l'agriculture connectée." },
    { id: "q5", question: "Quel est l'amélioration moyenne des rendements avec l'IoT ?", options: ["5%", "15%", "25%", "45%"], correctAnswer: 2, explanation: "Les solutions IoT en agriculture permettent en moyenne une amélioration de 25% des rendements." },
  ]},
  { id: "5", title: "Systèmes d'irrigation intelligente", type: "video", duration: "20 min", completed: false, locked: true },
  { id: "6", title: "Quiz final : Certification", type: "quiz", duration: "15 min", completed: false, locked: true },
];

const CourseLearn = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [modules, setModules] = useState<Module[]>(DEMO_MODULES);
  const [activeModule, setActiveModule] = useState<string>("1");
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);

  const currentModule = modules.find(m => m.id === activeModule);
  const completedCount = modules.filter(m => m.completed).length;
  const totalProgress = Math.round((completedCount / modules.length) * 100);

  const handleModuleComplete = (moduleId: string) => {
    setModules(prev => {
      const updated = prev.map(m => m.id === moduleId ? { ...m, completed: true } : m);
      // Unlock next module
      const idx = updated.findIndex(m => m.id === moduleId);
      if (idx < updated.length - 1) {
        updated[idx + 1] = { ...updated[idx + 1], locked: false };
      }
      return updated;
    });
  };

  const handleQuizComplete = (score: number, passed: boolean) => {
    setQuizScore(score);
    if (passed && currentModule) {
      handleModuleComplete(currentModule.id);
      // Check if all modules completed for certificate
      const allDone = modules.every(m => m.completed || m.id === currentModule.id);
      if (allDone && currentModule.id === modules[modules.length - 1].id) {
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

  return (
    <div className="min-h-screen bg-background">
      <TitleManager title="Formation en cours - KILIMO E-Learning" description="Suivez votre formation" canonical={window.location.origin + `/elearning/${id}/learn`} image={logoAk} />
      <Header />

      <main className="container mx-auto px-4 sm:px-6 py-6">
        {/* Back + Progress */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate(`/elearning/${id}`)} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour au cours
          </Button>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Progress value={totalProgress} className="h-3 w-48" />
            <span className="text-sm font-semibold text-primary">{totalProgress}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Module list */}
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
                          mod.completed ? 'bg-green-100 text-green-600' :
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
                            <span className="text-xs text-muted-foreground flex items-center"><Clock className="w-3 h-3 mr-1" />{mod.duration}</span>
                          </div>
                        </div>
                        {isActive && <ChevronRight className="w-4 h-4 text-primary flex-shrink-0 mt-2" />}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            {showCertificate ? (
              <CertificateGenerator data={{
                studentName: "Apprenant KILIMO",
                courseName: "Agriculture Moderne & IoT",
                completionDate: new Date().toISOString(),
                score: quizScore || 85,
                certificateNumber: `AK-CERT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`,
              }} />
            ) : currentModule?.type === "quiz" && currentModule.quizQuestions ? (
              <QuizComponent
                title={currentModule.title}
                questions={currentModule.quizQuestions}
                passingScore={70}
                onComplete={handleQuizComplete}
                onRetry={() => setQuizScore(null)}
              />
            ) : currentModule?.type === "video" ? (
              <Card>
                <CardContent className="p-0">
                  <div className="aspect-video bg-black rounded-t-lg flex items-center justify-center">
                    <div className="text-center text-white">
                      <Play className="w-16 h-16 mx-auto mb-4 opacity-80" />
                      <p className="text-lg font-semibold">{currentModule.title}</p>
                      <p className="text-sm text-white/60 mt-2">Durée : {currentModule.duration}</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-2">{currentModule.title}</h2>
                    <p className="text-muted-foreground mb-4">Regardez la vidéo complète pour débloquer le module suivant.</p>
                    <Button onClick={() => handleModuleComplete(currentModule.id)}>
                      <CheckCircle className="w-4 h-4 mr-2" /> Marquer comme terminé
                    </Button>
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
                  <div className="mt-8">
                    <Button onClick={() => handleModuleComplete(currentModule.id)}>
                      <CheckCircle className="w-4 h-4 mr-2" /> Marquer comme terminé
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : currentModule?.type === "pdf" ? (
              <Card>
                <CardContent className="p-6 sm:p-8 text-center">
                  <FileText className="w-20 h-20 text-red-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">{currentModule.title}</h2>
                  <p className="text-muted-foreground mb-6">Téléchargez et consultez le document PDF ci-dessous.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="outline">
                      <FileText className="w-4 h-4 mr-2" /> Consulter le PDF
                    </Button>
                    <Button onClick={() => handleModuleComplete(currentModule.id)}>
                      <CheckCircle className="w-4 h-4 mr-2" /> Marquer comme terminé
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CourseLearn;
