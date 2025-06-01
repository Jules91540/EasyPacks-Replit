import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, LogOut, Award, Calendar, BarChart3, CheckCircle, Play, Lock, Download, Bell, Settings } from "lucide-react";
import Navigation from "@/components/ui/navigation";
import SearchBar from "@/components/ui/search-bar";
import XPProgress from "@/components/xp-progress";
import StatsCard from "@/components/stats-card";
import SimulationModal from "@/components/simulation-modal";

export default function StudentDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [selectedSimulation, setSelectedSimulation] = useState(null);

  // Redirect to home if not authenticated
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

  // Fetch modules
  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ["/api/modules"],
    enabled: isAuthenticated,
  });

  // Fetch user progress
  const { data: progress = [] } = useQuery({
    queryKey: ["/api/progress"],
    enabled: isAuthenticated,
  });

  // Fetch user badges
  const { data: userBadges = [] } = useQuery({
    queryKey: ["/api/user-badges"],
    enabled: isAuthenticated,
  });

  // Calculate stats
  const completedModules = progress.filter(p => p.status === 'completed').length;
  const totalVideos = modules.reduce((sum, module) => sum + (module.videoUrl ? 1 : 0), 0);
  const overallProgress = modules.length > 0 
    ? Math.round((completedModules / modules.length) * 100) 
    : 0;

  // XP calculation for next level
  const nextLevelXP = Math.pow(user?.level || 1, 2) * 100;
  const currentLevelXP = Math.pow((user?.level || 1) - 1, 2) * 100;
  const xpInCurrentLevel = (user?.xp || 0) - currentLevelXP;
  const xpNeededForCurrentLevel = nextLevelXP - currentLevelXP;
  const xpProgressPercent = Math.round((xpInCurrentLevel / xpNeededForCurrentLevel) * 100);

  // Record simulation usage mutation
  const simulationMutation = useMutation({
    mutationFn: async (simulationType: string) => {
      await apiRequest("POST", `/api/simulations/${simulationType}/use`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Simulation utilisée !",
        description: "+50 XP gagnés pour l'utilisation de la simulation",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer l'utilisation de la simulation",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleSimulation = (type: string) => {
    setSelectedSimulation(type);
    simulationMutation.mutate(type);
  };

  const getModuleStatus = (moduleId: number) => {
    const moduleProgress = progress.find(p => p.moduleId === moduleId);
    if (!moduleProgress) return 'not_started';
    return moduleProgress.status;
  };

  const getModuleProgress = (moduleId: number) => {
    const moduleProgress = progress.find(p => p.moduleId === moduleId);
    return moduleProgress?.progress || 0;
  };

  if (isLoading || modulesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Modern Sidebar */}
      <Navigation variant="student" />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header with Search */}
        <header className="bg-background border-b border-border p-4">
          <div className="flex items-center justify-between">
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Navigation variant="student" />
            </div>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-4">
              <SearchBar 
                placeholder="Rechercher des formations, quiz, simulations..."
                showFilter={true}
              />
            </div>
            
            {/* Right Section */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Settings className="h-5 w-5" />
              </Button>
              
              {/* User Avatar */}
              <div className="flex items-center space-x-3">
                {(user as any)?.profileImageUrl ? (
                  <img 
                    src={(user as any).profileImageUrl} 
                    alt="Photo de profil" 
                    className="w-8 h-8 rounded-full object-cover border-2 border-primary"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
                    {((user as any)?.firstName?.[0] || 'U').toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3 space-y-3">
        {/* Welcome Section with XP - Compact */}
        <div className="gradient-primary rounded-xl text-white p-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
            <div className="mb-3 lg:mb-0">
              <h2 className="text-xl font-bold mb-1">
                Bonjour {(user as any)?.firstName || 'Étudiant'} ! 👋
              </h2>
              <p className="text-blue-100 text-sm">
                Continuez votre parcours vers l'expertise en création de contenu
              </p>
              <div className="mt-2">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 px-3 py-1 rounded-lg">
                    <span className="text-xs font-medium">Niveau {(user as any)?.level || 1}</span>
                  </div>
                  <div className="bg-white/20 px-3 py-1 rounded-lg">
                    <span className="text-xs font-medium">{(user as any)?.xp || 0} XP</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full lg:w-64">
              <XPProgress 
                currentXP={xpInCurrentLevel}
                totalXP={xpNeededForCurrentLevel}
                progress={xpProgressPercent}
                nextLevel={(user as any)?.level ? (user as any).level + 1 : 2}
              />
            </div>
          </div>
        </div>

        {/* Stats Cards - Compact */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatsCard
            icon={CheckCircle}
            value={completedModules}
            label="Modules terminés"
            color="green"
          />
          <StatsCard
            icon={Play}
            value={totalVideos}
            label="Vidéos disponibles"
            color="blue"
          />
          <StatsCard
            icon={Award}
            value={userBadges.length}
            label="Badges obtenus"
            color="purple"
          />
          <StatsCard
            icon={BarChart3}
            value={`${overallProgress}%`}
            label="Progression totale"
            color="orange"
          />
        </div>

        {/* Formations et Actions Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Formation Progress */}
          <div className="lg:col-span-2">
            <Card className="gradient-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800 heading-french">Votre Formation</h3>
                  <Link href="/modules">
                    <Button variant="default" size="sm" className="text-xs px-3 py-1">
                      Voir tout
                    </Button>
                  </Link>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Progression générale</span>
                    <span className="text-sm font-bold text-primary">{overallProgress}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${overallProgress}%` }}
                    ></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div>
                      <div className="font-bold text-lg text-green-600">{completedModules}</div>
                      <div className="text-gray-600">Terminés</div>
                    </div>
                    <div>
                      <div className="font-bold text-lg text-blue-600">{(modules as any[]).length - completedModules}</div>
                      <div className="text-gray-600">Restants</div>
                    </div>
                    <div>
                      <div className="font-bold text-lg text-purple-600">{(modules as any[]).length}</div>
                      <div className="text-gray-600">Total</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Compact */}
          <div className="space-y-3">
            {/* Quick Actions */}
            <Card className="gradient-card">
              <CardContent className="p-3">
                <h4 className="font-semibold text-gray-800 mb-2 text-sm">Actions Rapides</h4>
                <div className="space-y-2">
                  <Button
                    onClick={() => handleSimulation('thumbnail_creator')}
                    className="w-full simulation-thumbnail text-white hover:opacity-90 transition-opacity text-xs h-8"
                    disabled={simulationMutation.isPending}
                  >
                    <Download className="mr-1 h-3 w-3" />
                    Miniatures
                  </Button>
                  <Button
                    onClick={() => handleSimulation('post_scheduler')}
                    className="w-full simulation-scheduler text-white hover:opacity-90 transition-opacity text-xs h-8"
                    disabled={simulationMutation.isPending}
                  >
                    <Calendar className="mr-1 h-3 w-3" />
                    Planificateur
                  </Button>
                  <Button
                    onClick={() => handleSimulation('performance_analyzer')}
                    className="w-full simulation-analyzer text-white hover:opacity-90 transition-opacity text-xs h-8"
                    disabled={simulationMutation.isPending}
                  >
                    <BarChart3 className="mr-1 h-3 w-3" />
                    Analyse
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Badges */}
            <Card className="gradient-card">
              <CardContent className="p-3">
                <h4 className="font-semibold text-gray-800 mb-2 text-sm">Badges Récents</h4>
                <div className="space-y-2">
                  {(userBadges as any[]).slice(0, 2).map((userBadge, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-yellow-50 rounded-lg">
                      <div className="bg-yellow-400 text-white w-6 h-6 rounded-full flex items-center justify-center badge-glow">
                        <Award className="h-3 w-3" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">Nouveau Badge</p>
                        <p className="text-xs text-gray-600">Obtenu récemment</p>
                      </div>
                    </div>
                  ))}
                  {userBadges.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Aucun badge obtenu pour le moment
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Weekly Goal - Compact */}
            <Card className="gradient-card">
              <CardContent className="p-3">
                <h4 className="font-semibold text-gray-800 mb-2 text-sm">Objectif Hebdomadaire</h4>
                <div className="text-center">
                  <div className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse-xp">
                    <span className="text-xs font-bold">{Math.min(completedModules, 5)}/5</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">Modules cette semaine</p>
                  <div className="bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-primary h-1 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min((completedModules / 5) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </main>
      </div>

      {/* Quiz Modal */}
      {selectedQuiz && (
        <QuizModal
          quiz={selectedQuiz}
          onClose={() => setSelectedQuiz(null)}
        />
      )}

      {/* Simulation Modal */}
      {selectedSimulation && (
        <SimulationModal
          type={selectedSimulation}
          onClose={() => setSelectedSimulation(null)}
        />
      )}
    </div>
  );
}
