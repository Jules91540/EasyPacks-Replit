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
          <p className="text-white/80">Chargement de votre progression...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Sidebar */}
      <Navigation variant="student" />
      
      {/* Main Content with left margin for desktop sidebar */}
      <div className="md:ml-20 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden bg-background shadow-sm border-b border-border p-4">
          <div className="flex items-center justify-between">
            <Navigation variant="student" />
            <h1 className="text-lg font-bold text-foreground">Ma Progression</h1>
            <div></div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 h-screen overflow-hidden">
          {/* Compact Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-primary text-white w-10 h-10 rounded-lg flex items-center justify-center mr-3">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Ma Progression</h1>
                <p className="text-white/80 text-sm">Niveau {currentLevel} - {currentXP} XP</p>
              </div>
            </div>
            
            <XPProgress 
              currentXP={xpInCurrentLevel}
              totalXP={xpNeededForCurrentLevel}
              progress={xpProgressPercent}
              nextLevel={currentLevel + 1}
            />
          </div>

          {/* Compact Stats Grid */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <Card className="gradient-card">
              <CardContent className="p-3 text-center">
                <div className="bg-green-100 text-green-600 w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div className="text-lg font-bold text-white">{completedModules}</div>
                <p className="text-white/80 text-xs">Terminés</p>
              </CardContent>
            </Card>

            <Card className="gradient-card">
              <CardContent className="p-3 text-center">
                <div className="bg-blue-100 text-primary w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="text-lg font-bold text-white">{inProgressModules}</div>
                <p className="text-white/80 text-xs">En cours</p>
              </CardContent>
            </Card>

            <Card className="gradient-card">
              <CardContent className="p-3 text-center">
                <div className="bg-purple-100 text-purple-600 w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Trophy className="h-4 w-4" />
                </div>
                <div className="text-lg font-bold text-white">{passedQuizzes}</div>
                <p className="text-white/80 text-xs">Quiz OK</p>
              </CardContent>
            </Card>

            <Card className="gradient-card">
              <CardContent className="p-3 text-center">
                <div className="bg-orange-100 text-orange-600 w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Target className="h-4 w-4" />
                </div>
                <div className="text-lg font-bold text-white">{overallProgress}%</div>
                <p className="text-white/80 text-xs">Total</p>
              </CardContent>
            </Card>
          </div>

          {/* Compact Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-280px)]">
            {/* Module Progress */}
            <Card className="gradient-card">
              <CardContent className="p-4 h-full">
                <h3 className="text-sm font-semibold text-white mb-3">Progression par Module</h3>
                <div className="space-y-2 overflow-y-auto h-[calc(100%-2rem)]">
                  {modules.length > 0 ? modules.map((module) => {
                    const moduleProgress = progress.find(p => p.moduleId === module.id);
                    const progressPercent = moduleProgress?.progress || 0;
                    const status = moduleProgress?.status || 'not_started';
                    
                    return (
                      <div key={module.id} className="border border-gray-600 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-white text-sm">{module.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {status === 'completed' ? 'Terminé' :
                             status === 'in_progress' ? 'En cours' :
                             'Non commencé'}
                          </Badge>
                        </div>
                        <Progress value={progressPercent} className="h-1 mb-1" />
                        <p className="text-xs text-white/80">
                          {progressPercent}% • {module.platform || 'Général'}
                        </p>
                      </div>
                    );
                  }) : (
                    <p className="text-white/60 text-center py-4 text-sm">
                      Aucun module disponible
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quiz Performance & Goals */}
            <div className="space-y-4">
              <Card className="gradient-card">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">Performance Quiz</h3>
                  {totalQuizAttempts > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-primary">{averageScore}%</div>
                        <p className="text-xs text-white/80">Score moyen</p>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-400">{passedQuizzes}</div>
                        <p className="text-xs text-white/80">Réussis</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Trophy className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-white/60 text-xs">Aucun quiz tenté</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="gradient-card">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">Objectifs</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-white/80">Prochain niveau</span>
                        <span className="text-xs text-white">{Math.max(xpNeededForCurrentLevel - xpInCurrentLevel, 0)} XP</span>
                      </div>
                      <Progress value={xpProgressPercent} className="h-1" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-white/80">Modules (5)</span>
                        <span className="text-xs text-white">{completedModules}/5</span>
                      </div>
                      <Progress value={Math.min((completedModules / 5) * 100, 100)} className="h-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}