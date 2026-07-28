import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle, XCircle, Award, RotateCcw, ArrowRight, Timer, HelpCircle, Loader2 } from "lucide-react";
import { api } from "@/integrations/api/client";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  explanation?: string;
}

interface QuizCheckResult {
  correct: boolean;
  correctAnswer: number;
  explanation?: string | null;
}

interface QuizComponentProps {
  moduleId: number;
  title: string;
  questions: QuizQuestion[];
  passingScore?: number;
  onComplete: (score: number, passed: boolean) => void;
  onRetry?: () => void;
}

const QuizComponent = ({ moduleId, title, questions, passingScore = 70, onComplete, onRetry }: QuizComponentProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [results, setResults] = useState<Record<string, QuizCheckResult>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [showResult, setShowResult] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  // Timer
  useEffect(() => {
    if (showResult) return;
    const timer = setInterval(() => setTimeElapsed(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, [showResult]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const computeScore = (finalResults: Record<string, QuizCheckResult>) => {
    const correctCount = Object.values(finalResults).filter(r => r.correct).length;
    return Math.round((correctCount / questions.length) * 100);
  };

  const handleAnswer = async () => {
    if (!selectedAnswer || checking) return;
    const answerIndex = parseInt(selectedAnswer);
    setChecking(true);
    setCheckError(null);
    try {
      const res = await api.request('POST', `/api/course_modules/${moduleId}/quiz/check`, {
        body: { questionId: question.id, answer: answerIndex },
      });
      setResults(prev => ({ ...prev, [question.id]: res.data }));
      setShowExplanation(true);
    } catch {
      setCheckError("Impossible de vérifier votre réponse. Réessayez.");
    } finally {
      setChecking(false);
    }
  };

  const handleNext = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowExplanation(false);
      setSelectedAnswer("");
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        const score = computeScore(results);
        setShowResult(true);
        onComplete(score, score >= passingScore);
      }
      setIsTransitioning(false);
    }, 300);
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setResults({});
    setSelectedAnswer("");
    setShowResult(false);
    setShowExplanation(false);
    setCheckError(null);
    setTimeElapsed(0);
    setIsTransitioning(false);
    onRetry?.();
  };

  const score = computeScore(results);
  const currentResult = results[question?.id];

  if (showResult) {
    const passed = score >= passingScore;
    return (
      <Card className={`border-2 transition-all duration-500 ${passed ? 'border-green-300 bg-gradient-to-br from-green-50/50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10' : 'border-red-300 bg-gradient-to-br from-red-50/50 to-orange-50/30 dark:from-red-950/20 dark:to-orange-950/10'}`}>
        <CardContent className="p-6 sm:p-10 text-center">
          <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center transition-all duration-700 ${passed ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-200 dark:shadow-green-900/30' : 'bg-gradient-to-br from-red-400 to-orange-500 shadow-lg shadow-red-200 dark:shadow-red-900/30'}`}>
            {passed ? <Award className="w-12 h-12 text-white" /> : <XCircle className="w-12 h-12 text-white" />}
          </div>

          <h3 className="text-2xl sm:text-3xl font-bold mb-3">
            {passed ? '🎉 Félicitations !' : '📚 Continuez vos efforts'}
          </h3>

          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {passed
              ? `Excellent travail ! Vous avez obtenu ${score}% et pouvez passer au module suivant.`
              : `Vous avez obtenu ${score}%. Il faut ${passingScore}% minimum pour valider ce quiz.`}
          </p>

          {/* Score circle */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
              <circle
                cx="60" cy="60" r="50" fill="none"
                stroke={passed ? "hsl(142, 69%, 45%)" : "hsl(0, 84%, 60%)"}
                strokeWidth="8"
                strokeDasharray={`${(score / 100) * 314} 314`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{score}%</span>
              <span className="text-xs text-muted-foreground">/ {passingScore}%</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-6 mb-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Timer className="w-4 h-4" />
              <span>Temps : {formatTime(timeElapsed)}</span>
            </div>
            <div className="flex items-center gap-1">
              <HelpCircle className="w-4 h-4" />
              <span>{questions.length} questions</span>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            {!passed && (
              <Button onClick={handleRetry} variant="outline" size="lg">
                <RotateCcw className="w-4 h-4 mr-2" /> Recommencer
              </Button>
            )}
            {passed && (
              <Button onClick={handleNext} size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg">
                <ArrowRight className="w-4 h-4 mr-2" /> Module suivant
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-border overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-mono">
              <Timer className="w-3 h-3 mr-1" />
              {formatTime(timeElapsed)}
            </Badge>
            <Badge variant="outline">
              {currentQuestion + 1}/{questions.length}
            </Badge>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      <CardContent className={`p-4 sm:p-6 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        {/* Question number indicator */}
        <div className="flex gap-1.5 mb-6">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i < currentQuestion ? 'bg-primary' :
                i === currentQuestion ? 'bg-primary/60' :
                'bg-muted'
              }`}
            />
          ))}
        </div>

        <h3 className="text-lg font-semibold mb-6 leading-relaxed">{question.question}</h3>

        <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer} className="space-y-3" disabled={showExplanation || checking}>
          {question.options.map((option, i) => {
            const isCorrect = showExplanation && currentResult ? i === currentResult.correctAnswer : false;
            const isSelected = parseInt(selectedAnswer) === i;
            let optionClass = "border-2 border-border rounded-xl p-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-200";
            if (showExplanation) {
              if (isCorrect) optionClass = "border-2 border-green-500 bg-green-50 dark:bg-green-950/30 rounded-xl p-4 shadow-sm";
              else if (isSelected && !isCorrect) optionClass = "border-2 border-red-500 bg-red-50 dark:bg-red-950/30 rounded-xl p-4";
              else optionClass = "border-2 border-border rounded-xl p-4 opacity-40";
            } else if (isSelected) {
              optionClass = "border-2 border-primary bg-primary/5 rounded-xl p-4 shadow-sm";
            }

            return (
              <label key={i} className={`flex items-center gap-3 ${optionClass}`}>
                <RadioGroupItem value={String(i)} id={`q-${question.id}-${i}`} />
                <span className="flex-1 text-base">{option}</span>
                {showExplanation && isCorrect && <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />}
                {showExplanation && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
              </label>
            );
          })}
        </RadioGroup>

        {showExplanation && currentResult?.explanation && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl animate-in slide-in-from-bottom-2 duration-300">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>💡 Explication :</strong> {currentResult.explanation}
            </p>
          </div>
        )}

        {checkError && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-700 dark:text-red-300">{checkError}</p>
          </div>
        )}

        <div className="flex justify-between items-center mt-6">
          <span className="text-sm text-muted-foreground">
            Question {currentQuestion + 1} sur {questions.length}
          </span>
          {!showExplanation ? (
            <Button onClick={handleAnswer} disabled={!selectedAnswer || checking} size="lg">
              {checking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Valider
            </Button>
          ) : (
            <Button onClick={handleNext} size="lg">
              {currentQuestion < questions.length - 1 ? "Suivante" : "Voir le résultat"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizComponent;
