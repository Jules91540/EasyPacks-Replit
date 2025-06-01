import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/ui/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SimulationModal from "@/components/simulation-modal";
import { 
  Video, 
  Palette, 
  Calendar, 
  BarChart3, 
  Camera, 
  Megaphone,
  Star,
  Zap
} from "lucide-react";

export default function SimulationsPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSimulation, setSelectedSimulation] = useState<string | null>(null);

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

  const handleSimulation = (type: string) => {
    setSelectedSimulation(type);
    simulationMutation.mutate(type);
  };

  const simulations = [
    {
      id: 'thumbnail_creator',
      name: 'Créateur de Miniatures',
      description: 'Générez des miniatures YouTube attractives avec des outils de design intuitifs',
      icon: Palette,
      color: 'simulation-thumbnail',
      category: 'Design',
      difficulty: 'Débutant',
      duration: '10-15 min',
      features: [
        'Templates professionnels',
        'Éditeur de texte avancé',
        'Bibliothèque d\'images',
        'Export haute qualité'
      ]
    },
    {
      id: 'post_scheduler',
      name: 'Planificateur de Posts',
      description: 'Organisez et programmez vos publications sur toutes les plateformes sociales',
      icon: Calendar,
      color: 'simulation-scheduler',
      category: 'Organisation',
      difficulty: 'Intermédiaire',
      duration: '15-20 min',
      features: [
        'Calendrier multi-plateformes',
        'Optimisation des heures',
        'Aperçu des publications',
        'Analytics intégrées'
      ]
    },
    {
      id: 'performance_analyzer',
      name: 'Analyseur de Performance',
      description: 'Analysez vos métriques et optimisez votre stratégie de contenu',
      icon: BarChart3,
      color: 'simulation-analyzer',
      category: 'Analytics',
      difficulty: 'Avancé',
      duration: '20-30 min',
      features: [
        'Métriques détaillées',
        'Rapports personnalisés',
        'Recommandations IA',
        'Comparaisons concurrents'
      ]
    },
    {
      id: 'content_ideas',
      name: 'Générateur d\'Idées',
      description: 'Découvrez des idées de contenu basées sur les tendances actuelles',
      icon: Zap,
      color: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      category: 'Créativité',
      difficulty: 'Débutant',
      duration: '5-10 min',
      features: [
        'Tendances en temps réel',
        'Suggestions personnalisées',
        'Hashtags optimisés',
        'Planning de contenu'
      ]
    },
    {
      id: 'livestream_setup',
      name: 'Assistant Live Stream',
      description: 'Configurez votre setup de streaming avec des recommandations personnalisées',
      icon: Video,
      color: 'bg-gradient-to-r from-pink-500 to-red-500',
      category: 'Streaming',
      difficulty: 'Intermédiaire',
      duration: '25-35 min',
      features: [
        'Configuration matérielle',
        'Paramètres logiciels',
        'Qualité optimale',
        'Tests de performance'
      ]
    },
    {
      id: 'brand_builder',
      name: 'Constructeur de Marque',
      description: 'Développez votre identité visuelle et votre stratégie de marque',
      icon: Megaphone,
      color: 'bg-gradient-to-r from-indigo-500 to-purple-500',
      category: 'Branding',
      difficulty: 'Avancé',
      duration: '30-45 min',
      features: [
        'Palette de couleurs',
        'Guide de style',
        'Voice & tone',
        'Stratégie marketing'
      ]
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des simulations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Navigation Sidebar */}
      <Navigation variant="student" />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <Navigation variant="student" />
            <h1 className="text-lg font-bold text-gray-800">Simulations</h1>
            <div></div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="bg-primary text-white w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                <Video className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 heading-french">Simulations Interactives</h1>
                <p className="text-gray-600 subtitle-french">
                  Pratiquez avec des outils réels de création de contenu
                </p>
              </div>
            </div>

            {/* Info Banner */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 text-primary w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Star className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                      Gagnez de l'XP en pratiquant !
                    </h3>
                    <p className="text-blue-800 text-sm">
                      Chaque simulation utilisée vous rapporte <strong>50 XP</strong>. 
                      Explorez nos outils interactifs pour perfectionner vos compétences de créateur de contenu.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Simulations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {simulations.map((simulation) => {
              const Icon = simulation.icon;
              
              return (
                <Card key={simulation.id} className="gradient-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`${simulation.color} text-white w-12 h-12 rounded-lg flex items-center justify-center`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="text-right">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          {simulation.category}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 heading-french">
                      {simulation.name}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 subtitle-french">
                      {simulation.description}
                    </p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Difficulté: {simulation.difficulty}</span>
                        <span>Durée: {simulation.duration}</span>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Fonctionnalités:</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {simulation.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <div className="w-1 h-1 bg-primary rounded-full mr-2"></div>
                            {feature}
                          </li>
                        ))}
                        {simulation.features.length > 3 && (
                          <li className="text-primary">+ {simulation.features.length - 3} autres...</li>
                        )}
                      </ul>
                    </div>
                    
                    <Button
                      onClick={() => handleSimulation(simulation.id)}
                      disabled={simulationMutation.isPending}
                      className="w-full bg-primary text-white hover:bg-blue-700 transition-colors"
                    >
                      {simulationMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Lancement...
                        </>
                      ) : (
                        <>
                          <Icon className="mr-2 h-4 w-4" />
                          Lancer la simulation
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Tips Section */}
          <Card className="gradient-card mt-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 heading-french">
                Conseils pour Maximiser votre Apprentissage
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 text-primary w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-sm font-bold">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Explorez toutes les fonctionnalités</p>
                      <p className="text-sm text-gray-600">Prenez le temps de découvrir chaque outil disponible</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="bg-green-100 text-green-600 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-sm font-bold">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Pratiquez régulièrement</p>
                      <p className="text-sm text-gray-600">La pratique constante améliore vos compétences</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="bg-purple-100 text-purple-600 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-sm font-bold">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Expérimentez librement</p>
                      <p className="text-sm text-gray-600">N'hésitez pas à tester différentes approches</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-sm font-bold">4</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Appliquez vos apprentissages</p>
                      <p className="text-sm text-gray-600">Utilisez ce que vous apprenez dans vos vrais projets</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

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