import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle, XCircle, Award, RotateCcw, ArrowRight } from "lucide-react";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizComponentProps {
  title: string;
  questions: QuizQuestion[];
  passingScore?: number;
  onComplete: (score: number, passed: boolean) => void;
  onRetry?: () => void;
}

const QuizComponent = ({ title, questions, passingScore = 70, onComplete, onRetry }: QuizComponentProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [showResult, setShowResult] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = () => {
    if (!selectedAnswer) return;
    const answerIndex = parseInt(selectedAnswer);
    setAnswers({ ...answers, [question.id]: answerIndex });
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    setSelectedAnswer("");
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate score
      const correctCount = Object.entries({ ...answers, [question.id]: parseInt(selectedAnswer) })
        .filter(([qId, ans]) => {
          const q = questions.find(qq => qq.id === qId);
          return q && q.correctAnswer === ans;
        }).length;
      const score = Math.round((correctCount / questions.length) * 100);
      setShowResult(true);
      onComplete(score, score >= passingScore);
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setSelectedAnswer("");
    setShowResult(false);
    setShowExplanation(false);
    onRetry?.();
  };

  const score = (() => {
    const correctCount = Object.entries(answers).filter(([qId, ans]) => {
      const q = questions.find(qq => qq.id === qId);
      return q && q.correctAnswer === ans;
    }).length;
    return Math.round((correctCount / questions.length) * 100);
  })();

  if (showResult) {
    const passed = score >= passingScore;
    return (
      <Card className={`border-2 ${passed ? 'border-green-300 bg-green-50/50 dark:bg-green-950/20' : 'border-red-300 bg-red-50/50 dark:bg-red-950/20'}`}>
        <CardContent className="p-6 sm:p-8 text-center">
          <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${passed ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'}`}>
            {passed ? <Award className="w-10 h-10 text-green-600" /> : <XCircle className="w-10 h-10 text-red-600" />}
          </div>
          <h3 className="text-2xl font-bold mb-2">{passed ? '🎉 Félicitations !' : '📚 Continuez vos efforts'}</h3>
          <p className="text-muted-foreground mb-4">
            {passed
              ? `Vous avez obtenu ${score}% ! Vous pouvez passer au module suivant.`
              : `Vous avez obtenu ${score}%. Le score minimum requis est de ${passingScore}%.`}
          </p>
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-4xl font-bold" style={{ color: passed ? 'hsl(142, 69%, 30%)' : 'hsl(0, 84%, 60%)' }}>
              {score}%
            </span>
            <span className="text-muted-foreground">/ {passingScore}% requis</span>
          </div>
          {!passed && (
            <Button onClick={handleRetry} variant="outline" className="mr-2">
              <RotateCcw className="w-4 h-4 mr-2" /> Recommencer le quiz
            </Button>
          )}
          {passed && (
            <Button onClick={handleNext} className="bg-green-600 hover:bg-green-700 text-white">
              <ArrowRight className="w-4 h-4 mr-2" /> Module suivant
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
          <Badge variant="outline">
            {currentQuestion + 1}/{questions.length}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-6">{question.question}</h3>

        <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer} className="space-y-3" disabled={showExplanation}>
          {question.options.map((option, i) => {
            const isCorrect = i === question.correctAnswer;
            const isSelected = parseInt(selectedAnswer) === i;
            let optionClass = "border-2 border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-all";
            if (showExplanation) {
              if (isCorrect) optionClass = "border-2 border-green-500 bg-green-50 dark:bg-green-950/30 rounded-lg p-4";
              else if (isSelected && !isCorrect) optionClass = "border-2 border-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg p-4";
              else optionClass = "border-2 border-border rounded-lg p-4 opacity-50";
            } else if (isSelected) {
              optionClass = "border-2 border-primary bg-primary/5 rounded-lg p-4";
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

        {showExplanation && question.explanation && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300"><strong>Explication :</strong> {question.explanation}</p>
          </div>
        )}

        <div className="flex justify-end mt-6 gap-2">
          {!showExplanation ? (
            <Button onClick={handleAnswer} disabled={!selectedAnswer}>
              Valider la réponse
            </Button>
          ) : (
            <Button onClick={handleNext}>
              {currentQuestion < questions.length - 1 ? "Question suivante" : "Voir le résultat"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizComponent;
