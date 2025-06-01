import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/ui/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, HelpCircle, TrendingUp, Plus, BarChart3, Award, Video, ArrowRight } from "lucide-react";

export default function AdminDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user as any)?.role !== 'admin')) {
      toast({
        title: "Accès refusé",
        description: "Vous devez être administrateur. Redirection...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  // Fetch admin stats
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
    }
  });

  // Fetch modules for admin
  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ["/api/admin/modules"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
    }
  });

  if (isLoading || statsLoading) {
    return (
      <div className="h-screen bg-background flex overflow-hidden">
        <Navigation variant="admin" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg text-muted-foreground">Chargement du panneau d'administration...</p>
          </div>
        </div>
      </div>
    );
  }

  const defaultStats = {
    totalStudents: 0,
    totalModules: modules.length || 0,
    totalQuizzes: 0,
    averageProgress: 0
  };

  const displayStats = stats || defaultStats;

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <Navigation variant="admin" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-background border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Tableau de Bord Administrateur</h1>
              <p className="text-muted-foreground mt-1">
                Bienvenue, {(user as any)?.firstName || (user as any)?.email || 'Admin'}
              </p>
            </div>
            <Badge variant="outline" className="px-3 py-1">
              <Users className="h-4 w-4 mr-1" />
              Administrateur
            </Badge>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-7xl mx-auto space-y-4">
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Étudiants Inscrits</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {typeof displayStats.totalStudents === 'number' ? displayStats.totalStudents : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total des apprenants
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Modules Actifs</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {displayStats.totalModules}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Formations disponibles
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Quiz Créés</CardTitle>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {displayStats.totalQuizzes}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Évaluations actives
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Progression Moyenne</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(displayStats.averageProgress || 0)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Taux de completion
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <Link href="/admin/modules">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Gérer les Modules</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Créer et modifier les formations
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardHeader>
                </Link>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <Link href="/admin/quizzes">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <HelpCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Créer des Quiz</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Évaluations et questionnaires
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardHeader>
                </Link>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <Link href="/admin/badges">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <Award className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Gérer les Badges</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Récompenses et achievements
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardHeader>
                </Link>
              </Card>
            </div>

            {/* Recent Modules */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Modules Récents</CardTitle>
                  <Link href="/admin/modules">
                    <Button variant="outline" size="sm">
                      Voir tout
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {modulesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : modules.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Aucun module créé</h3>
                    <p className="text-muted-foreground mb-4">
                      Commencez par créer votre premier module de formation.
                    </p>
                    <Link href="/admin/modules">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Créer un module
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {modules.slice(0, 5).map((module: any) => (
                      <div key={module.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">{module.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {module.platform} • {module.difficulty}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={module.isPublished ? "default" : "secondary"}>
                            {module.isPublished ? "Publié" : "Brouillon"}
                          </Badge>
                          <Link href="/admin/modules">
                            <Button variant="outline" size="sm">
                              Modifier
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">État du Système</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Base de données</span>
                      <Badge variant="default" className="bg-green-500">En ligne</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Authentification</span>
                      <Badge variant="default" className="bg-green-500">Fonctionnelle</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Upload de fichiers</span>
                      <Badge variant="default" className="bg-green-500">Opérationnel</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions Rapides</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Link href="/admin/modules">
                      <Button className="w-full justify-start" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Créer un nouveau module
                      </Button>
                    </Link>
                    <Link href="/admin/quizzes">
                      <Button className="w-full justify-start" variant="outline">
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Ajouter un quiz
                      </Button>
                    </Link>
                    <Link href="/admin/badges">
                      <Button className="w-full justify-start" variant="outline">
                        <Award className="h-4 w-4 mr-2" />
                        Créer un badge
                      </Button>
                    </Link>
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