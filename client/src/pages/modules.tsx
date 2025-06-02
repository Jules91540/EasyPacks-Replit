import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/ui/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ModuleCard from "@/components/module-card";
import QuizModal from "@/components/quiz-modal";
import { Search, Filter, BookOpen } from "lucide-react";

export default function ModulesPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("all");

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

  const getModuleStatus = (moduleId: number) => {
    const moduleProgress = progress.find(p => p.moduleId === moduleId);
    if (!moduleProgress) return 'not_started';
    return moduleProgress.status;
  };

  const getModuleProgress = (moduleId: number) => {
    const moduleProgress = progress.find(p => p.moduleId === moduleId);
    return moduleProgress?.progress || 0;
  };

  // Filter modules
  const filteredModules = modules.filter(module => {
    const matchesSearch = module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = filterPlatform === "all" || module.platform === filterPlatform;
    return matchesSearch && matchesPlatform;
  });

  const platforms = ["all", "twitch", "youtube", "instagram", "tiktok", "twitter"];
  const platformLabels = {
    all: "Toutes",
    twitch: "Twitch",
    youtube: "YouTube", 
    instagram: "Instagram",
    tiktok: "TikTok",
    twitter: "X (Twitter)"
  };

  if (isLoading || modulesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des formations...</p>
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
        <header className="md:hidden bg-blue-50 shadow-sm border-b border-border p-4">
          <div className="flex items-center justify-between">
            <Navigation variant="student" />
            <h1 className="text-lg font-bold text-foreground">Formations</h1>
            <div></div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="bg-primary text-white w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground heading-french">Formations</h1>
                <p className="text-muted-foreground subtitle-french">
                  Découvrez nos modules de formation pour devenir créateur de contenu
                </p>
              </div>
            </div>

            {/* Search and Filters */}
            <Card className="gradient-card">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher une formation..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <div className="flex items-center space-x-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Plateforme:</span>
                    </div>
                    {platforms.map((platform) => (
                      <Button
                        key={platform}
                        variant={filterPlatform === platform ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterPlatform(platform)}
                      >
                        {platformLabels[platform]}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Modules Grid */}
          {filteredModules.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredModules.map((module) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  status={getModuleStatus(module.id)}
                  progress={getModuleProgress(module.id)}
                  onStartQuiz={setSelectedQuiz}
                />
              ))}
            </div>
          ) : (
            <Card className="gradient-blue-card">
              <CardContent className="p-12 text-center">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  {searchTerm || filterPlatform !== "all" 
                    ? "Aucune formation trouvée" 
                    : "Aucune formation disponible"
                  }
                </h3>
                <p className="text-gray-300 mb-4">
                  {searchTerm || filterPlatform !== "all"
                    ? "Essayez de modifier vos critères de recherche"
                    : "Les formations seront bientôt disponibles"
                  }
                </p>
                {(searchTerm || filterPlatform !== "all") && (
                  <Button 
                    onClick={() => {
                      setSearchTerm("");
                      setFilterPlatform("all");
                    }}
                    variant="outline"
                  >
                    Réinitialiser les filtres
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Statistics Summary */}
          {modules.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="gradient-card">
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-primary mb-2">
                    {modules.length}
                  </div>
                  <p className="text-gray-600">Formations disponibles</p>
                </CardContent>
              </Card>
              
              <Card className="gradient-card">
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {progress.filter(p => p.status === 'completed').length}
                  </div>
                  <p className="text-gray-600">Formations terminées</p>
                </CardContent>
              </Card>
              
              <Card className="gradient-card">
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {progress.filter(p => p.status === 'in_progress').length}
                  </div>
                  <p className="text-gray-600">En cours</p>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Quiz Modal */}
      {selectedQuiz && (
        <QuizModal
          quiz={selectedQuiz}
          onClose={() => setSelectedQuiz(null)}
        />
      )}
    </div>
  );
}