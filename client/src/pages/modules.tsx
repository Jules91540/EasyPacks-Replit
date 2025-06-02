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
          <p className="text-white/80">Chargement des formations...</p>
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
            <h1 className="text-lg font-bold text-white">Formations</h1>
            <div></div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 h-screen overflow-hidden">
          {/* Compact Header */}
          <div className="flex items-center mb-4">
            <div className="bg-primary text-white w-10 h-10 rounded-lg flex items-center justify-center mr-3">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Formations</h1>
              <p className="text-white/80 text-sm">
                {modules.length} formations • {progress.filter(p => p.status === 'completed').length} terminées
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-8 text-sm"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={selectedPlatform === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedPlatform('all')}
                size="sm"
                className="text-xs"
              >
                Toutes
              </Button>
              <Button
                variant={selectedPlatform === 'youtube' ? 'default' : 'outline'}
                onClick={() => setSelectedPlatform('youtube')}
                size="sm"
                className="text-xs"
              >
                <Youtube className="w-3 h-3 mr-1" />
                YT
              </Button>
              <Button
                variant={selectedPlatform === 'tiktok' ? 'default' : 'outline'}
                onClick={() => setSelectedPlatform('tiktok')}
                size="sm"
                className="text-xs"
              >
                <Video className="w-3 h-3 mr-1" />
                TT
              </Button>
              <Button
                variant={selectedPlatform === 'twitch' ? 'default' : 'outline'}
                onClick={() => setSelectedPlatform('twitch')}
                size="sm"
                className="text-xs"
              >
                <Gamepad2 className="w-3 h-3 mr-1" />
                TW
              </Button>
            </div>
          </div>

          {/* Compact Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Card className="gradient-card">
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-primary">{modules.length}</div>
                <p className="text-white/80 text-xs">Disponibles</p>
              </CardContent>
            </Card>
            
            <Card className="gradient-card">
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-green-600">{progress.filter(p => p.status === 'completed').length}</div>
                <p className="text-white/80 text-xs">Terminées</p>
              </CardContent>
            </Card>
            
            <Card className="gradient-card">
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-blue-600">{progress.filter(p => p.status === 'in_progress').length}</div>
                <p className="text-white/80 text-xs">En cours</p>
              </CardContent>
            </Card>
          </div>

          {/* Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-[calc(100vh-280px)] overflow-y-auto">
            {filteredModules.map((module) => {
              const moduleProgress = progress.find(p => p.moduleId === module.id);
              const status = moduleProgress?.status || 'not_started';
              const progressPercent = moduleProgress?.progress || 0;
              
              return (
                <Card key={module.id} className="gradient-card h-fit">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-sm mb-1">{module.title}</h3>
                        <p className="text-white/80 text-xs mb-2 line-clamp-2">{module.description}</p>
                      </div>
                      <Badge variant="outline" className="text-xs ml-2">
                        {module.platform || 'Général'}
                      </Badge>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-white/80">Progression</span>
                        <span className="text-xs text-white">{progressPercent}%</span>
                      </div>
                      <Progress value={progressPercent} className="h-1" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant={
                        status === 'completed' ? 'default' : 
                        status === 'in_progress' ? 'secondary' : 
                        'outline'
                      } className="text-xs">
                        {status === 'completed' ? 'Terminé' :
                         status === 'in_progress' ? 'En cours' :
                         'Nouveau'}
                      </Badge>
                      
                      <Button size="sm" className="text-xs">
                        <Play className="mr-1 h-3 w-3" />
                        {status === 'not_started' ? 'Commencer' : 'Continuer'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredModules.length === 0 && (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Aucune formation trouvée
              </h3>
              <p className="text-white/80 text-sm">
                {searchTerm || selectedPlatform !== 'all' 
                  ? 'Modifiez vos critères de recherche.' 
                  : 'Aucune formation disponible.'}
              </p>
            </div>
          )}
        </main>
      </div>

      {selectedQuiz && (
        <QuizModal
          quiz={selectedQuiz}
          onClose={() => setSelectedQuiz(null)}
        />
      )}
    </div>
  );
}