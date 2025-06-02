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
    <div className="min-h-screen bg-background">
      {/* Navigation Sidebar */}
      <Navigation variant="student" />
      
      {/* Main Content with left margin for desktop sidebar */}
      <div className="md:ml-20 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden bg-background shadow-sm border-b border-border p-4">
          <div className="flex items-center justify-between">
            <Navigation variant="student" />
            <h1 className="text-lg font-bold text-foreground">Mes Badges</h1>
            <div></div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 h-screen overflow-hidden">
          {/* Compact Header */}
          <div className="flex items-center mb-4">
            <div className="bg-primary text-white w-10 h-10 rounded-lg flex items-center justify-center mr-3">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Mes Badges</h1>
              <p className="text-muted-foreground text-sm">
                {earnedBadges.length} obtenus • {unearnedBadges.length} à débloquer
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
                  <div className="text-2xl font-bold text-white mb-1">{earnedBadges.length}</div>
                  <p className="text-white/80 text-sm">Badges obtenus</p>
                </CardContent>
              </Card>

              <Card className="gradient-card">
                <CardContent className="p-6 text-center">
                  <div className="bg-blue-100 text-primary w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Target className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{unearnedBadges.length}</div>
                  <p className="text-white/80 text-sm">Objectifs restants</p>
                </CardContent>
              </Card>

              <Card className="gradient-card">
                <CardContent className="p-6 text-center">
                  <div className="bg-purple-100 text-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Star className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {Math.round((earnedBadges.length / achievementBadges.length) * 100)}%
                  </div>
                  <p className="text-white/80 text-sm">Progression totale</p>
                </CardContent>
              </Card>
            </div>

          {/* Compact Badges Grid */}
          <div className="h-[calc(100vh-240px)] overflow-y-auto">
            {earnedBadges.length > 0 && (
              <div className="mb-4">
                <h2 className="text-lg font-bold text-white mb-3">
                  Badges Obtenus ({earnedBadges.length})
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {earnedBadges.map((badge) => {
                    const Icon = badge.icon;
                    return (
                      <Card key={badge.id} className="gradient-card">
                        <CardContent className="p-4 text-center">
                          <div className={`${badge.color} text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <h3 className="text-sm font-semibold text-white mb-1">{badge.name}</h3>
                          <p className="text-white/80 text-xs mb-2">{badge.description}</p>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                            ✓ Obtenu
                          </Badge>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {unearnedBadges.length > 0 && (
              <div className="mb-4">
                <h2 className="text-lg font-bold text-white mb-3">
                  À Débloquer ({unearnedBadges.length})
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {unearnedBadges.map((badge) => {
                    const Icon = badge.icon;
                    return (
                      <Card key={badge.id} className="gradient-card opacity-75">
                        <CardContent className="p-4 text-center">
                          <div className="bg-gray-600 text-gray-400 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Icon className="h-6 w-6" />
                          </div>
                          <h3 className="text-sm font-semibold text-white/60 mb-1">{badge.name}</h3>
                          <p className="text-white/40 text-xs mb-2">{badge.description}</p>
                          <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(badge.progress / badge.total) * 100}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-white/60">{badge.progress}/{badge.total}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}