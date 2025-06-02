import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BookOpen, 
  Trophy, 
  Target, 
  Clock, 
  Star, 
  Play,
  Award,
  TrendingUp,
  Calendar,
  Users,
  Video,
  MessageSquare,
  Zap,
  Gift,
  Medal,
  CheckCircle,
  ArrowRight,
  Timer,
  Brain,
  Gamepad2,
  Sparkles,
  Flame,
  Crown,
  Shield,
  Rocket,
  Bolt
} from "lucide-react";
import Navigation from "@/components/ui/navigation";
import { useAuth } from "@/hooks/useAuth";
import StatsCard from "@/components/stats-card";
import XPProgress from "@/components/xp-progress";
import ModuleCard from "@/components/module-card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import type { Module, ModuleProgress, QuizAttempt, UserBadge, User } from "@shared/schema";

interface Quiz {
  id: number;
  moduleId: number;
  title: string;
  description: string;
  questions: Array<{
    id: number;
    question: string;
    options: string[];
    correct: number;
    explanation?: string;
  }>;
  passingScore: number;
  timeLimit: number;
  xpReward: number;
  isActive: boolean;
}

interface Activity {
  id: string;
  type: "module_completed" | "quiz_passed" | "badge_earned" | "streak" | "challenge";
  title: string;
  timestamp: string;
  xp: number;
  description?: string;
  icon?: string;
}

interface QuizModalProps {
  quiz: Quiz;
  onClose: () => void;
  onSubmit: (answers: Record<number, number>, timeSpent: number) => void;
}

function QuizModal({ quiz, onClose, onSubmit }: QuizModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(quiz.timeLimit * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const timeSpent = (quiz.timeLimit * 60) - timeRemaining;
    onSubmit(selectedAnswers, timeSpent);
  };

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{quiz.title}</span>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                {formatTime(timeRemaining)}
              </Badge>
              <Badge variant="secondary">
                Question {currentQuestionIndex + 1} / {quiz.questions.length}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Progress value={progress} className="w-full" />
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">{currentQuestion.question}</h3>
            
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <Button
                  key={index}
                  variant={selectedAnswers[currentQuestion.id] === index ? "default" : "outline"}
                  className="w-full justify-start text-left h-auto p-4"
                  onClick={() => setSelectedAnswers(prev => ({
                    ...prev,
                    [currentQuestion.id]: index
                  }))}
                >
                  <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mr-3 text-sm">
                    {String.fromCharCode(65 + index)}
                  </span>
                  {option}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
            >
              Précédent
            </Button>
            
            <div className="flex gap-2">
              {currentQuestionIndex < quiz.questions.length - 1 ? (
                <Button
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  disabled={selectedAnswers[currentQuestion.id] === undefined}
                >
                  Suivant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={selectedAnswers[currentQuestion.id] === undefined || isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? "Envoi..." : "Terminer le Quiz"}
                  <CheckCircle className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Fetch user progress
  const { data: progress = [] } = useQuery<ModuleProgress[]>({
    queryKey: ["/api/progress"],
  });

  // Fetch modules
  const { data: modules = [] } = useQuery<Module[]>({
    queryKey: ["/api/modules"],
  });

  // Fetch quiz attempts
  const { data: quizAttempts = [] } = useQuery<QuizAttempt[]>({
    queryKey: ["/api/quiz-attempts"],
  });

  // Fetch user badges
  const { data: userBadges = [] } = useQuery<UserBadge[]>({
    queryKey: ["/api/user-badges"],
  });

  // Fetch available quizzes
  const { data: availableQuizzes = [] } = useQuery<Quiz[]>({
    queryKey: ["/api/admin/quizzes"],
  });

  // Daily challenge mutation
  const completeDailyChallenge = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/daily-challenge", "POST");
    },
    onSuccess: () => {
      toast({
        title: "Défi quotidien terminé !",
        description: "Vous avez gagné des XP bonus !",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  // Quiz submission mutation
  const submitQuiz = useMutation({
    mutationFn: async (quizData: { quizId: number; answers: Record<number, number>; timeSpent: number }) => {
      return await apiRequest("/api/quiz-attempts", "POST", quizData);
    },
    onSuccess: (result: any) => {
      toast({
        title: result.passed ? "Quiz réussi !" : "Quiz échoué",
        description: result.passed 
          ? `Vous avez gagné ${result.xpEarned || 0} XP !` 
          : "Essayez encore pour améliorer votre score.",
        variant: result.passed ? "default" : "destructive",
      });
      setSelectedQuiz(null);
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-attempts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  // Generate recent activities with real data
  const recentActivities: Activity[] = [
    ...(quizAttempts as any[]).slice(-3).map((attempt: any) => ({
      id: `quiz-${attempt.id}`,
      type: "quiz_passed" as const,
      title: `Quiz terminé - Score: ${attempt.score}%`,
      timestamp: attempt.completedAt,
      xp: attempt.xpEarned || 0,
      description: attempt.score >= 70 ? "Excellent travail !" : "Continuez vos efforts !",
    })),
    ...(progress as any[]).filter((p: any) => p.status === 'completed').slice(-2).map((prog: any) => ({
      id: `module-${prog.id}`,
      type: "module_completed" as const,
      title: "Module terminé",
      timestamp: prog.completedAt || new Date().toISOString(),
      xp: 50,
      description: "Formation complétée avec succès",
    })),
    {
      id: "daily-login",
      type: "streak" as const,
      title: `Série quotidienne: ${dailyStreak} jours`,
      timestamp: new Date().toISOString(),
      xp: dailyStreak * 5,
      description: "Continuez votre momentum !",
    }
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

  // Calculate enhanced stats
  const completedModules = (progress as any[]).filter((p: any) => p.status === 'completed').length;
  const totalVideos = (modules as any[]).reduce((sum: number, module: any) => sum + (module.videoUrl ? 1 : 0), 0);
  const overallProgress = modules.length > 0 
    ? Math.round((completedModules / modules.length) * 100) 
    : 0;

  // Enhanced XP calculation
  const userTyped = user as any;
  const currentLevel = userTyped?.level || 1;
  const currentXP = userTyped?.xp || 0;
  const nextLevelXP = Math.pow(currentLevel + 1, 2) * 100;
  const currentLevelXP = Math.pow(currentLevel, 2) * 100;
  const xpInCurrentLevel = currentXP - currentLevelXP;
  const xpNeededForCurrentLevel = nextLevelXP - currentLevelXP;
  const xpProgressPercent = Math.round((xpInCurrentLevel / xpNeededForCurrentLevel) * 100);

  const calculateStreak = () => {
    const today = new Date();
    const recentDays = 7;
    let streak = 0;
    
    for (let i = 0; i < recentDays; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      const hasActivity = recentActivities.some(activity => {
        const activityDate = new Date(activity.timestamp);
        return activityDate.toDateString() === checkDate.toDateString();
      });
      
      if (hasActivity) {
        streak++;
      } else if (i === 0) {
        continue;
      } else {
        break;
      }
    }
    
    return streak;
  };

  useEffect(() => {
    setDailyStreak(calculateStreak());
  }, [recentActivities]);

  const startQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
  };

  const handleQuizSubmit = (answers: Record<number, number>, timeSpent: number) => {
    if (!selectedQuiz) return;
    
    submitQuiz.mutate({
      quizId: selectedQuiz.id,
      answers,
      timeSpent,
    });
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'module_completed': return <BookOpen className="h-4 w-4" />;
      case 'quiz_passed': return <Brain className="h-4 w-4" />;
      case 'badge_earned': return <Medal className="h-4 w-4" />;
      case 'streak': return <Flame className="h-4 w-4" />;
      case 'challenge': return <Target className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Navigation variant="student" />
      
      <main className="flex-1 p-4 md:ml-20 h-screen overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Compact Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-primary text-white w-10 h-10 rounded-lg flex items-center justify-center mr-3">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Bonjour {userTyped?.firstName || 'Créateur'} !
                </h1>
                <p className="text-white/80 text-sm">
                  Niveau {currentLevel} - {currentXP} XP
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => completeDailyChallenge.mutate()}
                size="sm"
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                <Gift className="mr-2 h-4 w-4" />
                Défi
              </Button>
              
              <XPProgress 
                currentXP={xpInCurrentLevel}
                totalXP={xpNeededForCurrentLevel}
                progress={xpProgressPercent}
                nextLevel={currentLevel + 1}
              />
            </div>
          </div>

          {/* Compact Stats Grid */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <Card className="gradient-card">
              <CardContent className="p-3 text-center">
                <div className="bg-blue-100 text-primary w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="text-lg font-bold text-white">{completedModules}/{modules.length}</div>
                <p className="text-white/80 text-xs">Modules</p>
              </CardContent>
            </Card>

            <Card className="gradient-card">
              <CardContent className="p-3 text-center">
                <div className="bg-green-100 text-green-600 w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Trophy className="h-4 w-4" />
                </div>
                <div className="text-lg font-bold text-white">{(userBadges as any[]).length}</div>
                <p className="text-white/80 text-xs">Badges</p>
              </CardContent>
            </Card>

            <Card className="gradient-card">
              <CardContent className="p-3 text-center">
                <div className="bg-purple-100 text-purple-600 w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Target className="h-4 w-4" />
                </div>
                <div className="text-lg font-bold text-white">{overallProgress}%</div>
                <p className="text-white/80 text-xs">Progrès</p>
              </CardContent>
            </Card>

            <Card className="gradient-card">
              <CardContent className="p-3 text-center">
                <div className="bg-orange-100 text-orange-600 w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Flame className="h-4 w-4" />
                </div>
                <div className="text-lg font-bold text-white">{dailyStreak}</div>
                <p className="text-white/80 text-xs">Série</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Modules Section */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="gradient-blue-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Rocket className="h-5 w-5 text-blue-400" />
                    Formations Disponibles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {modules.slice(0, 3).map((module: any) => {
                      const moduleProgress = (progress as any[]).find((p: any) => p.moduleId === module.id);
                      const status = moduleProgress?.status || 'not_started';
                      const progressPercent = moduleProgress?.progress || 0;
                      
                      return (
                        <ModuleCard
                          key={module.id}
                          module={module}
                          status={status}
                          progress={progressPercent}
                          onStartQuiz={(quiz) => startQuiz(quiz)}
                        />
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Quiz Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    Quiz Rapides
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableQuizzes.slice(0, 4).map((quiz: any) => (
                      <Card key={quiz.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="secondary">{quiz.timeLimit} min</Badge>
                            <Badge className="bg-green-100 text-green-800">
                              +{quiz.xpReward} XP
                            </Badge>
                          </div>
                          <h4 className="font-semibold mb-2">{quiz.title}</h4>
                          <p className="text-sm text-white/80 mb-3">
                            {quiz.description}
                          </p>
                          <Button
                            onClick={() => startQuiz(quiz)}
                            className="w-full"
                            size="sm"
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Commencer
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bolt className="h-5 w-5 text-primary" />
                    Activité Récente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                          <div className="p-1 bg-primary/20 rounded-full">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{activity.title}</p>
                            <p className="text-xs text-white/80">{activity.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                +{activity.xp} XP
                              </Badge>
                              <span className="text-xs text-white/60">
                                {new Date(activity.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Latest Badges */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Derniers Badges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {(userBadges as any[]).slice(-4).map((badge: any, index) => (
                      <div key={badge.id || index} className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                          <Medal className="h-6 w-6 text-white" />
                        </div>
                        <p className="text-xs font-medium truncate">{badge.name || 'Badge'}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Learning Streak */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-primary" />
                    Série d'Apprentissage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">{dailyStreak}</div>
                    <p className="text-sm text-white/80 mb-4">jours consécutifs</p>
                    <Alert>
                      <Zap className="h-4 w-4" />
                      <AlertDescription>
                        Continuez votre série pour débloquer des récompenses spéciales !
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Quiz Modal */}
      {selectedQuiz && (
        <QuizModal
          quiz={selectedQuiz}
          onClose={() => setSelectedQuiz(null)}
          onSubmit={handleQuizSubmit}
        />
      )}


    </div>
  );
}