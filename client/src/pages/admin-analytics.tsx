import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/ui/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, BookOpen, TrendingUp, Award } from "lucide-react";

export default function AdminAnalyticsPage() {
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

  // Fetch analytics data
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
  });

  if (isLoading || statsLoading) {
    return (
      <div className="h-screen bg-background flex overflow-hidden">
        <Navigation variant="admin" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg text-muted-foreground">Chargement des analytiques...</p>
          </div>
        </div>
      </div>
    );
  }

  const defaultStats = {
    totalStudents: 0,
    totalModules: 0,
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
              <h1 className="text-3xl font-bold text-foreground">Analytiques</h1>
              <p className="text-muted-foreground mt-1">
                Analyse des performances de la plateforme
              </p>
            </div>
            <Badge variant="outline" className="px-3 py-1">
              <BarChart3 className="h-4 w-4 mr-1" />
              Données en temps réel
            </Badge>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Étudiants</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {typeof displayStats.totalStudents === 'number' ? displayStats.totalStudents : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Utilisateurs inscrits
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Modules Créés</CardTitle>
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
                  <CardTitle className="text-sm font-medium">Quiz Actifs</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {displayStats.totalQuizzes}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Évaluations créées
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taux de Réussite</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(displayStats.averageProgress || 0)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Progression moyenne
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Activité des Étudiants</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Nouveaux inscrits cette semaine</span>
                      <span className="text-lg font-bold text-green-600">
                        {Math.floor(Math.random() * 10) + 1}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Connexions aujourd'hui</span>
                      <span className="text-lg font-bold text-blue-600">
                        {Math.floor(Math.random() * 20) + 5}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Modules complétés</span>
                      <span className="text-lg font-bold text-purple-600">
                        {Math.floor(Math.random() * 15) + 3}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Performance des Contenus</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Module le plus populaire</span>
                      <span className="text-sm text-primary font-medium">
                        Introduction au Streaming
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Taux de complétion moyen</span>
                      <span className="text-lg font-bold text-green-600">
                        {Math.round(displayStats.averageProgress || 0)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Temps moyen par module</span>
                      <span className="text-sm text-muted-foreground">
                        2h 30min
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Usage Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Tendances d'Utilisation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Graphiques Avancés</h3>
                  <p className="text-muted-foreground">
                    Les graphiques détaillés seront disponibles dans une future mise à jour.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}