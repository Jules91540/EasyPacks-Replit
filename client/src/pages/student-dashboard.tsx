import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, LogOut, Award, Calendar, BarChart3, CheckCircle, Play, Lock, Download } from "lucide-react";
import XPProgress from "@/components/xp-progress";
import StatsCard from "@/components/stats-card";
import ModuleCard from "@/components/module-card";
import QuizModal from "@/components/quiz-modal";
import SimulationModal from "@/components/simulation-modal";
import { useState } from "react";

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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-primary text-white w-10 h-10 rounded-lg flex items-center justify-center mr-3">
                <Video className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold text-gray-800 heading-french">Créateur Academy</h1>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-primary font-medium border-b-2 border-primary pb-2">Tableau de bord</a>
              <a href="#" className="text-gray-600 hover:text-primary transition-colors">Formations</a>
              <a href="#" className="text-gray-600 hover:text-primary transition-colors">Progression</a>
              <a href="#" className="text-gray-600 hover:text-primary transition-colors">Simulations</a>
            </nav>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-800">
                    {user?.firstName || 'Étudiant'} {user?.lastName || ''}
                  </p>
                  <p className="text-xs text-gray-600">
                    Niveau {user?.level || 1} - {user?.level === 1 ? 'Débutant' : user?.level === 2 ? 'Novice' : user?.level === 3 ? 'Intermédiaire' : 'Expert'}
                  </p>
                </div>
                {user?.profileImageUrl && (
                  <img 
                    src={user.profileImageUrl} 
                    alt="Photo de profil" 
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                  />
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section with XP */}
        <div className="gradient-primary rounded-2xl text-white p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="mb-6 md:mb-0">
              <h2 className="text-3xl font-bold mb-2">
                Bonjour {user?.firstName || 'Étudiant'} ! 👋
              </h2>
              <p className="text-blue-100 text-lg">
                Continuez votre parcours vers l'expertise en création de contenu
              </p>
              <div className="mt-4">
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 px-4 py-2 rounded-lg">
                    <span className="text-sm font-medium">Niveau {user?.level || 1}</span>
                  </div>
                  <div className="bg-white/20 px-4 py-2 rounded-lg">
                    <span className="text-sm font-medium">{user?.xp || 0} XP</span>
                  </div>
                </div>
              </div>
            </div>
            
            <XPProgress 
              currentXP={xpInCurrentLevel}
              totalXP={xpNeededForCurrentLevel}
              progress={xpProgressPercent}
              nextLevel={user?.level ? user.level + 1 : 2}
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

        {/* Training Modules Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Training Modules List */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800 heading-french">Modules de Formation</h3>
              <div className="flex space-x-2">
                <Button variant="default" size="sm">
                  Tous
                </Button>
                <Button variant="outline" size="sm">
                  En cours
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {modules.map((module) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  status={getModuleStatus(module.id)}
                  progress={getModuleProgress(module.id)}
                  onStartQuiz={setSelectedQuiz}
                />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="gradient-card">
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-800 mb-4">Actions Rapides</h4>
                <div className="space-y-3">
                  <Button
                    onClick={() => handleSimulation('thumbnail_creator')}
                    className="w-full simulation-thumbnail text-white hover:opacity-90 transition-opacity"
                    disabled={simulationMutation.isPending}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Créateur de Miniatures
                  </Button>
                  <Button
                    onClick={() => handleSimulation('post_scheduler')}
                    className="w-full simulation-scheduler text-white hover:opacity-90 transition-opacity"
                    disabled={simulationMutation.isPending}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Planificateur de Posts
                  </Button>
                  <Button
                    onClick={() => handleSimulation('performance_analyzer')}
                    className="w-full simulation-analyzer text-white hover:opacity-90 transition-opacity"
                    disabled={simulationMutation.isPending}
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Analyseur de Performance
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Badges */}
            <Card className="gradient-card">
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-800 mb-4">Badges Récents</h4>
                <div className="space-y-3">
                  {userBadges.slice(0, 2).map((userBadge, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                      <div className="bg-yellow-400 text-white w-10 h-10 rounded-full flex items-center justify-center badge-glow">
                        <Award className="h-5 w-5" />
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

            {/* Weekly Goal */}
            <Card className="gradient-card">
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-800 mb-4">Objectif Hebdomadaire</h4>
                <div className="text-center">
                  <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-xp">
                    <span className="text-xl font-bold">{Math.min(completedModules, 5)}/5</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Modules cette semaine</p>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min((completedModules / 5) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
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
