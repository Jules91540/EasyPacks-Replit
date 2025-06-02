import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/ui/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import XPProgress from "@/components/xp-progress";
import { BarChart3, CheckCircle, Clock, Star, Trophy, Target } from "lucide-react";

export default function ProgressPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Non autorisé",
        description: "Vous devez être connecté. Redirection...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch modules and progress
  const { data: modules = [] } = useQuery({
    queryKey: ["/api/modules"],
    enabled: isAuthenticated,
  });

  const { data: progress = [] } = useQuery({
    queryKey: ["/api/progress"],
    enabled: isAuthenticated,
  });

  const { data: quizAttempts = [] } = useQuery({
    queryKey: ["/api/quiz-attempts"],
    enabled: isAuthenticated,
  });

  // Calculate stats
  const completedModules = progress.filter(p => p.status === 'completed').length;
  const inProgressModules = progress.filter(p => p.status === 'in_progress').length;
  const totalModules = modules.length;
  const overallProgress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  
  // XP calculation for next level
  const currentLevel = user?.level || 1;
  const currentXP = user?.xp || 0;
  const nextLevelXP = Math.pow(currentLevel, 2) * 100;
  const currentLevelXP = Math.pow(currentLevel - 1, 2) * 100;
  const xpInCurrentLevel = currentXP - currentLevelXP;
  const xpNeededForCurrentLevel = nextLevelXP - currentLevelXP;
  const xpProgressPercent = Math.round((xpInCurrentLevel / xpNeededForCurrentLevel) * 100);

  // Quiz statistics
  const totalQuizAttempts = quizAttempts.length;
  const passedQuizzes = quizAttempts.filter(attempt => attempt.passed).length;
  const averageScore = totalQuizAttempts > 0 
    ? Math.round(quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalQuizAttempts)
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de votre progression...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Navigation Sidebar */}
      <Navigation variant="student" />
      
      {/* Main Content with left margin for desktop sidebar */}
      <div className="md:ml-20 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden bg-blue-50 shadow-sm border-b border-border p-4">
          <div className="flex items-center justify-between">
            <Navigation variant="student" />
            <h1 className="text-lg font-bold text-foreground">Ma Progression</h1>
            <div></div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="bg-primary text-white w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground heading-french">Ma Progression</h1>
                <p className="text-muted-foreground subtitle-french">
                  Suivez votre avancement dans votre parcours de formation
                </p>
              </div>
            </div>

            {/* XP Progress Section */}
            <div className="gradient-primary rounded-2xl text-white p-8 mb-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                <div className="mb-6 md:mb-0">
                  <h2 className="text-2xl font-bold mb-2">
                    Niveau {currentLevel} - {currentXP} XP
                  </h2>
                  <p className="text-blue-100 text-lg">
                    {currentLevel === 1 ? 'Débutant' : 
                     currentLevel === 2 ? 'Novice' : 
                     currentLevel === 3 ? 'Intermédiaire' : 
                     currentLevel === 4 ? 'Avancé' : 'Expert'}
                  </p>
                </div>
                
                <XPProgress 
                  currentXP={xpInCurrentLevel}
                  totalXP={xpNeededForCurrentLevel}
                  progress={xpProgressPercent}
                  nextLevel={currentLevel + 1}
                />
              </div>
            </div>
          </div>

          {/* Progress Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="gradient-card">
              <CardContent className="p-6 text-center">
                <div className="bg-green-100 text-green-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div className="text-2xl font-bold text-gray-800 mb-1">{completedModules}</div>
                <p className="text-gray-600 text-sm">Modules terminés</p>
              </CardContent>
            </Card>

            <Card className="gradient-card">
              <CardContent className="p-6 text-center">
                <div className="bg-blue-100 text-primary w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Clock className="h-6 w-6" />
                </div>
                <div className="text-2xl font-bold text-gray-800 mb-1">{inProgressModules}</div>
                <p className="text-gray-600 text-sm">En cours</p>
              </CardContent>
            </Card>

            <Card className="gradient-card">
              <CardContent className="p-6 text-center">
                <div className="bg-purple-100 text-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Trophy className="h-6 w-6" />
                </div>
                <div className="text-2xl font-bold text-gray-800 mb-1">{passedQuizzes}</div>
                <p className="text-gray-600 text-sm">Quiz réussis</p>
              </CardContent>
            </Card>

            <Card className="gradient-card">
              <CardContent className="p-6 text-center">
                <div className="bg-orange-100 text-orange-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Target className="h-6 w-6" />
                </div>
                <div className="text-2xl font-bold text-gray-800 mb-1">{overallProgress}%</div>
                <p className="text-gray-600 text-sm">Progression totale</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Module Progress */}
            <Card className="gradient-card">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 heading-french">
                  Progression par Module
                </h3>
                <div className="space-y-4">
                  {modules.length > 0 ? modules.map((module) => {
                    const moduleProgress = progress.find(p => p.moduleId === module.id);
                    const progressPercent = moduleProgress?.progress || 0;
                    const status = moduleProgress?.status || 'not_started';
                    
                    return (
                      <div key={module.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-800">{module.title}</h4>
                          <Badge variant={
                            status === 'completed' ? 'default' : 
                            status === 'in_progress' ? 'secondary' : 
                            'outline'
                          } className={
                            status === 'completed' ? 'bg-green-100 text-green-700' :
                            status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }>
                            {status === 'completed' ? 'Terminé' :
                             status === 'in_progress' ? 'En cours' :
                             'Non commencé'}
                          </Badge>
                        </div>
                        <div className="mb-2">
                          <Progress value={progressPercent} className="h-2" />
                        </div>
                        <p className="text-sm text-gray-600">
                          {progressPercent}% terminé • Plateforme: {module.platform || 'Général'}
                        </p>
                      </div>
                    );
                  }) : (
                    <p className="text-gray-500 text-center py-8">
                      Aucun module disponible pour le moment
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quiz Performance */}
            <Card className="gradient-card">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 heading-french">
                  Performance aux Quiz
                </h3>
                
                {totalQuizAttempts > 0 ? (
                  <div className="space-y-6">
                    {/* Overall Stats */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{averageScore}%</div>
                          <p className="text-sm text-gray-600">Score moyen</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{passedQuizzes}</div>
                          <p className="text-sm text-gray-600">Quiz réussis</p>
                        </div>
                      </div>
                    </div>

                    {/* Recent Attempts */}
                    <div>
                      <h4 className="font-medium text-gray-800 mb-3">Tentatives récentes</h4>
                      <div className="space-y-2">
                        {quizAttempts.slice(0, 5).map((attempt) => (
                          <div key={attempt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full mr-3 ${
                                attempt.passed ? 'bg-green-500' : 'bg-red-500'
                              }`}></div>
                              <span className="text-sm text-gray-800">Quiz #{attempt.quizId}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`text-sm font-medium ${
                                attempt.passed ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {attempt.score}%
                              </span>
                              {attempt.passed && <Star className="h-4 w-4 text-yellow-500" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Aucun quiz tenté pour le moment</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Commencez un module pour débloquer les quiz
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Achievement Goals */}
          <Card className="gradient-card mt-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 heading-french">
                Objectifs et Récompenses
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-yellow-100 text-yellow-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target className="h-8 w-8" />
                  </div>
                  <h4 className="font-medium text-gray-800 mb-2">Prochain Objectif</h4>
                  <p className="text-sm text-gray-600">
                    Terminer {5 - completedModules > 0 ? 5 - completedModules : 1} module(s) de plus
                  </p>
                  <div className="mt-2">
                    <Progress value={Math.min((completedModules / 5) * 100, 100)} className="h-2" />
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="bg-purple-100 text-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Star className="h-8 w-8" />
                  </div>
                  <h4 className="font-medium text-gray-800 mb-2">Prochain Niveau</h4>
                  <p className="text-sm text-gray-600">
                    {Math.max(xpNeededForCurrentLevel - xpInCurrentLevel, 0)} XP restants
                  </p>
                  <div className="mt-2">
                    <Progress value={xpProgressPercent} className="h-2" />
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Trophy className="h-8 w-8" />
                  </div>
                  <h4 className="font-medium text-gray-800 mb-2">Score Parfait</h4>
                  <p className="text-sm text-gray-600">
                    Obtenez 100% à un quiz pour débloquer un badge spécial
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}