import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/ui/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Star, Trophy, Medal, Crown, Target } from "lucide-react";

export default function BadgesPage() {
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

  // Fetch user badges
  const { data: userBadges = [] } = useQuery({
    queryKey: ["/api/user-badges"],
    enabled: isAuthenticated,
  });

  // Fetch all available badges
  const { data: allBadges = [] } = useQuery({
    queryKey: ["/api/badges"],
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

  // Calculate achievements
  const completedModules = progress.filter((p: any) => p.status === 'completed').length;
  const passedQuizzes = quizAttempts.filter((attempt: any) => attempt.passed).length;
  const perfectScores = quizAttempts.filter((attempt: any) => attempt.score === 100).length;

  // Define achievement badges with requirements
  const achievementBadges = [
    {
      id: 'first_module',
      name: 'Premier Pas',
      description: 'Terminer votre premier module',
      icon: Star,
      color: 'bg-yellow-500',
      earned: completedModules >= 1,
      progress: Math.min(completedModules, 1),
      total: 1
    },
    {
      id: 'module_master',
      name: 'Maître des Modules',
      description: 'Terminer 5 modules',
      icon: Trophy,
      color: 'bg-blue-500',
      earned: completedModules >= 5,
      progress: Math.min(completedModules, 5),
      total: 5
    },
    {
      id: 'quiz_champion',
      name: 'Champion des Quiz',
      description: 'Réussir 10 quiz',
      icon: Medal,
      color: 'bg-green-500',
      earned: passedQuizzes >= 10,
      progress: Math.min(passedQuizzes, 10),
      total: 10
    },
    {
      id: 'perfectionist',
      name: 'Perfectionniste',
      description: 'Obtenir 100% à un quiz',
      icon: Crown,
      color: 'bg-purple-500',
      earned: perfectScores >= 1,
      progress: Math.min(perfectScores, 1),
      total: 1
    },
    {
      id: 'level_master',
      name: 'Montée en Niveau',
      description: 'Atteindre le niveau 5',
      icon: Target,
      color: 'bg-orange-500',
      earned: (user?.level || 1) >= 5,
      progress: Math.min(user?.level || 1, 5),
      total: 5
    },
    {
      id: 'xp_collector',
      name: 'Collecteur d\'XP',
      description: 'Accumuler 1000 XP',
      icon: Award,
      color: 'bg-red-500',
      earned: (user?.xp || 0) >= 1000,
      progress: Math.min(user?.xp || 0, 1000),
      total: 1000
    }
  ];

  const earnedBadges = achievementBadges.filter(badge => badge.earned);
  const unearnedBadges = achievementBadges.filter(badge => !badge.earned);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de vos badges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Navigation Sidebar */}
      <Navigation variant="student" />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden bg-background shadow-sm border-b border-border p-4">
          <div className="flex items-center justify-between">
            <Navigation variant="student" />
            <h1 className="text-lg font-bold text-foreground">Mes Badges</h1>
            <div></div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="bg-primary text-white w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 heading-french">Mes Badges</h1>
                <p className="text-gray-600 subtitle-french">
                  Vos récompenses et accomplissements
                </p>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="gradient-card">
                <CardContent className="p-6 text-center">
                  <div className="bg-green-100 text-green-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800 mb-1">{earnedBadges.length}</div>
                  <p className="text-gray-600 text-sm">Badges obtenus</p>
                </CardContent>
              </Card>

              <Card className="gradient-card">
                <CardContent className="p-6 text-center">
                  <div className="bg-blue-100 text-primary w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Target className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800 mb-1">{unearnedBadges.length}</div>
                  <p className="text-gray-600 text-sm">Objectifs restants</p>
                </CardContent>
              </Card>

              <Card className="gradient-card">
                <CardContent className="p-6 text-center">
                  <div className="bg-purple-100 text-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Star className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800 mb-1">
                    {Math.round((earnedBadges.length / achievementBadges.length) * 100)}%
                  </div>
                  <p className="text-gray-600 text-sm">Progression totale</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Earned Badges */}
          {earnedBadges.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 heading-french">
                Badges Obtenus ({earnedBadges.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {earnedBadges.map((badge) => {
                  const Icon = badge.icon;
                  return (
                    <Card key={badge.id} className="gradient-card hover:shadow-lg transition-shadow">
                      <CardContent className="p-6 text-center">
                        <div className={`${badge.color} text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 badge-glow`}>
                          <Icon className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">{badge.name}</h3>
                        <p className="text-gray-600 text-sm mb-3">{badge.description}</p>
                        <Badge className="bg-green-100 text-green-700">
                          ✓ Obtenu
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Progress Towards Badges */}
          {unearnedBadges.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 heading-french">
                Objectifs en Cours ({unearnedBadges.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {unearnedBadges.map((badge) => {
                  const Icon = badge.icon;
                  const progressPercent = Math.round((badge.progress / badge.total) * 100);
                  
                  return (
                    <Card key={badge.id} className="gradient-card opacity-75 hover:opacity-100 transition-opacity">
                      <CardContent className="p-6 text-center">
                        <div className="bg-gray-300 text-gray-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Icon className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">{badge.name}</h3>
                        <p className="text-gray-600 text-sm mb-3">{badge.description}</p>
                        
                        <div className="mb-3">
                          <div className="bg-gray-200 rounded-full h-3 mb-2">
                            <div 
                              className="bg-primary h-3 rounded-full transition-all duration-500" 
                              style={{ width: `${progressPercent}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500">
                            {badge.progress} / {badge.total} ({progressPercent}%)
                          </p>
                        </div>
                        
                        <Badge variant="outline" className="bg-gray-100 text-gray-600">
                          En cours...
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {earnedBadges.length === 0 && (
            <Card className="gradient-card">
              <CardContent className="p-12 text-center">
                <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Aucun badge obtenu pour le moment
                </h3>
                <p className="text-gray-600 mb-6">
                  Commencez votre parcours de formation pour débloquer vos premiers badges !
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Star className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-blue-700">Premier badge</p>
                    <p className="text-xs text-blue-600">Terminez votre premier module</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Trophy className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-green-700">Réussite</p>
                    <p className="text-xs text-green-600">Réussissez votre premier quiz</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips for Earning Badges */}
          <Card className="gradient-card mt-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 heading-french">
                Comment Gagner des Badges
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 text-primary w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-sm font-bold">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Terminez des modules</p>
                      <p className="text-sm text-gray-600">Chaque module terminé vous rapproche d'un nouveau badge</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="bg-green-100 text-green-600 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-sm font-bold">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Réussissez les quiz</p>
                      <p className="text-sm text-gray-600">Obtenez de bons scores pour débloquer des récompenses</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="bg-purple-100 text-purple-600 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-sm font-bold">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Accumulez de l'XP</p>
                      <p className="text-sm text-gray-600">Plus vous participez, plus vous gagnez d'expérience</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-sm font-bold">4</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Montez en niveau</p>
                      <p className="text-sm text-gray-600">Atteignez de nouveaux niveaux pour des badges exclusifs</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}