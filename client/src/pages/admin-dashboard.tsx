import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, LogOut, Users, BookOpen, HelpCircle, TrendingUp, Plus, BarChart3 } from "lucide-react";
import StatsCard from "@/components/stats-card";

export default function AdminDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Redirect to home if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      toast({
        title: "Accès refusé",
        description: "Vous devez être administrateur. Redirection...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  // Fetch admin stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Fetch modules for admin
  const { data: modules = [] } = useQuery({
    queryKey: ["/api/modules"],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (isLoading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du panneau d'administration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Navigation */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-red-600 text-white w-10 h-10 rounded-lg flex items-center justify-center mr-3">
                <Settings className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold text-gray-800 heading-french">Administration</h1>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-red-600 font-medium border-b-2 border-red-600 pb-2">Tableau de bord</a>
              <a href="#" className="text-gray-600 hover:text-red-600 transition-colors">Modules</a>
              <a href="#" className="text-gray-600 hover:text-red-600 transition-colors">Quiz</a>
              <a href="#" className="text-gray-600 hover:text-red-600 transition-colors">Élèves</a>
            </nav>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Admin</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            icon={Users}
            value={stats?.totalStudents || 0}
            label="Élèves inscrits"
            color="blue"
          />
          <StatsCard
            icon={BookOpen}
            value={stats?.totalModules || 0}
            label="Modules créés"
            color="green"
          />
          <StatsCard
            icon={HelpCircle}
            value={stats?.totalQuizzes || 0}
            label="Quiz actifs"
            color="purple"
          />
          <StatsCard
            icon={TrendingUp}
            value={`${stats?.averageProgress || 0}%`}
            label="Taux de progression"
            color="orange"
          />
        </div>

        {/* Quick Actions */}
        <Card className="gradient-card mb-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 heading-french">Actions Rapides</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="bg-primary text-white p-4 hover:bg-blue-700 transition-colors">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Module
              </Button>
              <Button className="bg-green-600 text-white p-4 hover:bg-green-700 transition-colors">
                <HelpCircle className="mr-2 h-4 w-4" />
                Créer un Quiz
              </Button>
              <Button className="bg-purple-600 text-white p-4 hover:bg-purple-700 transition-colors">
                <BarChart3 className="mr-2 h-4 w-4" />
                Voir les Statistiques
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity & Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card className="gradient-card">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 heading-french">Activité Récente</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">Nouvel élève inscrit</p>
                    <p className="text-xs text-gray-600">Utilisateur récent - il y a 2h</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">Module terminé</p>
                    <p className="text-xs text-gray-600">Formation Twitch - il y a 4h</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="bg-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">Nouveau record de progression</p>
                    <p className="text-xs text-gray-600">Niveau expert atteint</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Module Management */}
          <Card className="gradient-card">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 heading-french">Gestion des Modules</h3>
              <div className="space-y-4">
                {modules.slice(0, 3).map((module, index) => (
                  <div key={module.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{module.title}</p>
                      <p className="text-xs text-gray-600">
                        {module.platform} • {module.isPublished ? 'Publié' : 'Brouillon'}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        Éditer
                      </Button>
                      <Button size="sm" variant={module.isPublished ? "destructive" : "default"}>
                        {module.isPublished ? 'Masquer' : 'Publier'}
                      </Button>
                    </div>
                  </div>
                ))}
                {modules.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Aucun module créé pour le moment
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Overview */}
        <Card className="gradient-card mt-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 heading-french">Vue d'ensemble des Performances</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 text-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="h-8 w-8" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{stats?.averageProgress || 0}%</p>
                <p className="text-sm text-gray-600">Progression moyenne</p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="h-8 w-8" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{stats?.totalStudents || 0}</p>
                <p className="text-sm text-gray-600">Élèves actifs</p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 text-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2">
                  <BookOpen className="h-8 w-8" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{modules.filter(m => m.isPublished).length}</p>
                <p className="text-sm text-gray-600">Modules publiés</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
