import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, X, Star } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
}

interface Quiz {
  id: number;
  title: string;
  questions: Question[];
}

interface QuizModalProps {
  quiz: Quiz;
  onClose: () => void;
}

export default function QuizModal({ quiz, onClose }: QuizModalProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitQuizMutation = useMutation({
    mutationFn: async (quizData: any) => {
      return await apiRequest("POST", "/api/quiz-attempts", quizData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-attempts"] });
    },
  });

  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
  const currentQ = quiz.questions[currentQuestion];

  const handleAnswerChange = (value: string) => {
    setAnswers({
      ...answers,
      [currentQuestion]: parseInt(value)
    });
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResults();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateResults = () => {
    let correctAnswers = 0;
    quiz.questions.forEach((question, index) => {
      if (answers[index] === question.correct) {
        correctAnswers++;
      }
    });

    const finalScore = Math.round((correctAnswers / quiz.questions.length) * 100);
    setScore(finalScore);
    setShowResults(true);

    // Submit quiz attempt
    const passed = finalScore >= 70;
    submitQuizMutation.mutate({
      quizId: quiz.id,
      score: finalScore,
      answers: answers,
      passed: passed
    });

    if (passed) {
      toast({
        title: "Félicitations !",
        description: `Vous avez réussi le quiz avec ${finalScore}% ! +50 XP gagnés`,
      });
    } else {
      toast({
        title: "Quiz terminé",
        description: `Score: ${finalScore}%. Essayez encore pour obtenir plus de 70%`,
        variant: "destructive",
      });
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setScore(0);
  };

  if (showResults) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">Résultats du Quiz</DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-8">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
              score >= 70 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}>
              {score >= 70 ? (
                <CheckCircle className="h-12 w-12" />
              ) : (
                <X className="h-12 w-12" />
              )}
            </div>
            
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {score >= 70 ? 'Félicitations !' : 'Continuez vos efforts !'}
            </h3>
            
            <p className="text-gray-600 mb-4">
              Votre score : <span className="font-bold text-primary">{score}%</span>
            </p>
            
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-2">
                {quiz.questions.reduce((correct, question, index) => 
                  correct + (answers[index] === question.correct ? 1 : 0), 0
                )} bonnes réponses sur {quiz.questions.length}
              </p>
            </div>

            {score >= 70 && (
              <Card className="bg-yellow-50 border-yellow-200 mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center">
                    <Star className="h-5 w-5 text-yellow-500 mr-2" />
                    <span className="text-yellow-800 font-medium">+50 XP gagnés !</span>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="flex space-x-4 justify-center">
              <Button onClick={resetQuiz} variant="outline">
                Recommencer
              </Button>
              <Button onClick={onClose}>
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{quiz.title}</DialogTitle>
          <Progress value={progress} className="w-full quiz-progress" />
          <p className="text-sm text-gray-600">
            Question {currentQuestion + 1} sur {quiz.questions.length}
          </p>
        </DialogHeader>
        
        <div className="py-6">
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">
              {currentQ.question}
            </h4>
            
            <RadioGroup
              value={answers[currentQuestion]?.toString()}
              onValueChange={handleAnswerChange}
              className="space-y-3"
            >
              {currentQ.options.map((option, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="flex justify-between">
            <Button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              variant="outline"
            >
              Précédent
            </Button>
            <Button
              onClick={handleNext}
              disabled={answers[currentQuestion] === undefined}
            >
              {currentQuestion === quiz.questions.length - 1 ? 'Terminer' : 'Suivant'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
