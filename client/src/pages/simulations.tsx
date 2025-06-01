import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { 
  Video, 
  Users, 
  Heart, 
  MessageCircle, 
  Share2, 
  Eye, 
  TrendingUp, 
  Play,
  Pause,
  RotateCcw,
  Settings,
  Mic,
  Camera,
  Monitor,
  Twitch,
  Youtube,
  Instagram,
  Twitter,
  Zap,
  Target,
  Award,
  BarChart3,
  Clock,
  Star,
  Gamepad2,
  Sparkles,
  Trophy,
  Rocket,
  Brain
} from "lucide-react";
import { SiTiktok, SiYoutube, SiTwitch, SiInstagram, SiX } from "react-icons/si";
import Navigation from "@/components/ui/navigation";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SimulationScenario {
  id: string;
  title: string;
  description: string;
  platform: 'twitch' | 'youtube' | 'instagram' | 'tiktok' | 'twitter';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // minutes
  xpReward: number;
  objectives: string[];
  metrics: {
    viewers?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    followers?: number;
    engagement?: number;
  };
}

interface SimulationSession {
  scenario: SimulationScenario;
  currentMetrics: any;
  timeElapsed: number;
  score: number;
  events: Array<{
    id: string;
    type: 'viewer_join' | 'comment' | 'like' | 'share' | 'follow' | 'donation' | 'raid';
    message: string;
    impact: 'positive' | 'negative' | 'neutral';
    timestamp: number;
  }>;
}

const SIMULATION_SCENARIOS: SimulationScenario[] = [
  {
    id: 'twitch-first-stream',
    title: 'Premier Stream Twitch',
    description: 'Démarrez votre premier live et gérez l\'interaction avec les viewers',
    platform: 'twitch',
    difficulty: 'beginner',
    duration: 15,
    xpReward: 100,
    objectives: [
      'Attirer 10 viewers minimum',
      'Répondre à 5 commentaires',
      'Maintenir un engagement positif'
    ],
    metrics: {
      viewers: 0,
      comments: 0,
      likes: 0,
      followers: 0
    }
  },
  {
    id: 'youtube-viral-video',
    title: 'Créer un Contenu Viral YouTube',
    description: 'Optimisez votre contenu pour maximiser les vues et l\'engagement',
    platform: 'youtube',
    difficulty: 'intermediate',
    duration: 20,
    xpReward: 150,
    objectives: [
      'Atteindre 1000 vues',
      'Obtenir 50 likes',
      'Générer 20 commentaires'
    ],
    metrics: {
      viewers: 0,
      likes: 0,
      comments: 0,
      shares: 0
    }
  },
  {
    id: 'instagram-brand-collab',
    title: 'Collaboration Marque Instagram',
    description: 'Négociez et exécutez une collaboration avec une marque',
    platform: 'instagram',
    difficulty: 'advanced',
    duration: 25,
    xpReward: 200,
    objectives: [
      'Maintenir l\'authenticité',
      'Atteindre 500 likes',
      'Générer 2% d\'engagement'
    ],
    metrics: {
      likes: 0,
      comments: 0,
      shares: 0,
      engagement: 0
    }
  },
  {
    id: 'tiktok-trend-challenge',
    title: 'Challenge TikTok Tendance',
    description: 'Participez à un challenge viral et adaptez-le à votre style',
    platform: 'tiktok',
    difficulty: 'intermediate',
    duration: 10,
    xpReward: 120,
    objectives: [
      'Créer du contenu original',
      'Atteindre 100 likes',
      'Être partagé 10 fois'
    ],
    metrics: {
      likes: 0,
      shares: 0,
      comments: 0,
      viewers: 0
    }
  },
  {
    id: 'twitter-community-building',
    title: 'Construction Communauté Twitter',
    description: 'Développez votre présence et engagez votre communauté',
    platform: 'twitter',
    difficulty: 'intermediate',
    duration: 18,
    xpReward: 130,
    objectives: [
      'Publier 5 tweets engageants',
      'Gagner 20 nouveaux followers',
      'Obtenir 50 retweets'
    ],
    metrics: {
      likes: 0,
      shares: 0,
      comments: 0,
      followers: 0
    }
  }
];

function SimulationInterface({ session, onAction, onComplete }: {
  session: SimulationSession;
  onAction: (action: string, data?: any) => void;
  onComplete: (score: number) => void;
}) {
  const [isLive, setIsLive] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitch': return <SiTwitch className="h-5 w-5" />;
      case 'youtube': return <SiYoutube className="h-5 w-5" />;
      case 'instagram': return <SiInstagram className="h-5 w-5" />;
      case 'tiktok': return <SiTiktok className="h-5 w-5" />;
      case 'twitter': return <SiX className="h-5 w-5" />;
      default: return <Video className="h-5 w-5" />;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAction = (action: string, data?: any) => {
    setCurrentAction(action);
    onAction(action, data);
    setTimeout(() => setCurrentAction(null), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Platform Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white">
        <div className="flex items-center gap-3">
          {getPlatformIcon(session.scenario.platform)}
          <div>
            <h3 className="font-bold">{session.scenario.title}</h3>
            <p className="text-sm opacity-90">{session.scenario.platform.toUpperCase()} Simulation</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="bg-white/20">
            {formatTime(session.timeElapsed)}
          </Badge>
          <Badge variant="secondary" className="bg-white/20">
            Score: {session.score}
          </Badge>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(session.currentMetrics).map(([key, value]) => (
          <Card key={key}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{value}</div>
              <div className="text-sm text-muted-foreground capitalize">
                {key === 'viewers' ? 'Spectateurs' :
                 key === 'likes' ? 'Likes' :
                 key === 'comments' ? 'Commentaires' :
                 key === 'shares' ? 'Partages' :
                 key === 'followers' ? 'Abonnés' :
                 key === 'engagement' ? 'Engagement %' : key}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Contrôles de Simulation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => handleAction('interact_audience')}
              disabled={currentAction === 'interact_audience'}
              className="h-16 flex-col"
            >
              <MessageCircle className="h-6 w-6 mb-2" />
              Interagir Public
            </Button>
            
            <Button
              onClick={() => handleAction('create_content')}
              disabled={currentAction === 'create_content'}
              variant="outline"
              className="h-16 flex-col"
            >
              <Camera className="h-6 w-6 mb-2" />
              Créer Contenu
            </Button>
            
            <Button
              onClick={() => handleAction('promote_content')}
              disabled={currentAction === 'promote_content'}
              variant="outline"
              className="h-16 flex-col"
            >
              <TrendingUp className="h-6 w-6 mb-2" />
              Promouvoir
            </Button>
            
            <Button
              onClick={() => handleAction('analyze_metrics')}
              disabled={currentAction === 'analyze_metrics'}
              variant="outline"
              className="h-16 flex-col"
            >
              <BarChart3 className="h-6 w-6 mb-2" />
              Analyser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Events Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Activité en Temps Réel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-32">
            <div className="space-y-2">
              {session.events.slice(-5).map((event) => (
                <div
                  key={event.id}
                  className={`p-2 rounded-lg text-sm ${
                    event.impact === 'positive' ? 'bg-green-100 text-green-800' :
                    event.impact === 'negative' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}
                >
                  <span className="font-medium">{event.type.replace('_', ' ').toUpperCase()}:</span> {event.message}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Objectives Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Objectifs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {session.scenario.objectives.map((objective, index) => {
              const progress = Math.min(100, (session.score / session.scenario.objectives.length) * (index + 1));
              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">{objective}</span>
                    <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Complete Button */}
      <Button
        onClick={() => onComplete(session.score)}
        className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
        size="lg"
      >
        <Trophy className="mr-2 h-5 w-5" />
        Terminer la Simulation
      </Button>
    </div>
  );
}

export default function SimulationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedScenario, setSelectedScenario] = useState<SimulationScenario | null>(null);
  const [currentSession, setCurrentSession] = useState<SimulationSession | null>(null);
  const [sessionTimer, setSessionTimer] = useState(0);

  // Fetch simulation history
  const { data: simulationHistory = [] } = useQuery({
    queryKey: ["/api/simulation-usage"],
  });

  // Record simulation usage
  const recordUsage = useMutation({
    mutationFn: async (data: { simulationType: string; score: number; duration: number }) => {
      return await apiRequest("/api/simulation-usage", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/simulation-usage"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  // Start simulation session
  const startSimulation = (scenario: SimulationScenario) => {
    setSelectedScenario(scenario);
    setCurrentSession({
      scenario,
      currentMetrics: { ...scenario.metrics },
      timeElapsed: 0,
      score: 0,
      events: []
    });
    setSessionTimer(0);
  };

  // Handle simulation actions
  const handleSimulationAction = (action: string, data?: any) => {
    if (!currentSession) return;

    const randomEvents = {
      interact_audience: [
        { message: "Un viewer a posé une question intéressante", impact: 'positive' as const },
        { message: "Vous avez répondu avec humour", impact: 'positive' as const },
        { message: "La conversation devient engageante", impact: 'positive' as const }
      ],
      create_content: [
        { message: "Nouveau contenu créé avec succès", impact: 'positive' as const },
        { message: "Le contenu résonne avec l'audience", impact: 'positive' as const },
        { message: "Tendance repérée et exploitée", impact: 'positive' as const }
      ],
      promote_content: [
        { message: "Contenu partagé sur les réseaux", impact: 'positive' as const },
        { message: "Collaboration croisée réussie", impact: 'positive' as const },
        { message: "Hashtags optimisés", impact: 'positive' as const }
      ],
      analyze_metrics: [
        { message: "Données analysées - ajustement stratégique", impact: 'positive' as const },
        { message: "Pic d'engagement identifié", impact: 'positive' as const },
        { message: "Optimisation des horaires de publication", impact: 'positive' as const }
      ]
    };

    const eventPool = randomEvents[action as keyof typeof randomEvents] || [];
    const event = eventPool[Math.floor(Math.random() * eventPool.length)];

    const newSession = { ...currentSession };
    
    // Add event
    newSession.events.push({
      id: Date.now().toString(),
      type: action as any,
      message: event.message,
      impact: event.impact,
      timestamp: Date.now()
    });

    // Update metrics based on action
    const metricsIncrease = {
      interact_audience: { comments: Math.floor(Math.random() * 5) + 1, viewers: Math.floor(Math.random() * 3) + 1 },
      create_content: { likes: Math.floor(Math.random() * 10) + 2, shares: Math.floor(Math.random() * 3) + 1 },
      promote_content: { viewers: Math.floor(Math.random() * 15) + 5, followers: Math.floor(Math.random() * 8) + 2 },
      analyze_metrics: { engagement: Math.floor(Math.random() * 5) + 1 }
    };

    const increases = metricsIncrease[action as keyof typeof metricsIncrease] || {};
    
    Object.entries(increases).forEach(([key, value]) => {
      if (key in newSession.currentMetrics) {
        (newSession.currentMetrics as any)[key] += value;
      }
    });

    // Update score
    newSession.score += Math.floor(Math.random() * 20) + 10;

    setCurrentSession(newSession);

    toast({
      title: "Action réussie !",
      description: event.message,
    });
  };

  // Complete simulation
  const completeSimulation = (finalScore: number) => {
    if (!currentSession) return;

    const duration = sessionTimer;
    recordUsage.mutate({
      simulationType: currentSession.scenario.id,
      score: finalScore,
      duration
    });

    const xpEarned = Math.floor((finalScore / 100) * currentSession.scenario.xpReward);
    
    toast({
      title: "Simulation terminée !",
      description: `Score: ${finalScore}% - Vous avez gagné ${xpEarned} XP !`,
    });

    setCurrentSession(null);
    setSelectedScenario(null);
    setSessionTimer(0);
  };

  // Session timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentSession) {
      interval = setInterval(() => {
        setSessionTimer(prev => prev + 1);
        setCurrentSession(prev => prev ? { ...prev, timeElapsed: prev.timeElapsed + 1 } : null);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentSession]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'twitch': return 'from-purple-500 to-purple-600';
      case 'youtube': return 'from-red-500 to-red-600';
      case 'instagram': return 'from-pink-500 to-purple-500';
      case 'tiktok': return 'from-black to-gray-800';
      case 'twitter': return 'from-blue-400 to-blue-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation variant="student" />
      
      <main className="flex-1 p-6 ml-16 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Gamepad2 className="h-8 w-8 text-primary" />
                Simulations Interactives
              </h1>
              <p className="text-muted-foreground mt-2">
                Pratiquez vos compétences de créateur dans des environnements réalistes
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-full">
                    <Brain className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Simulations Terminées</p>
                    <p className="text-lg font-bold">{simulationHistory.length}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Current Session */}
          {currentSession && (
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-primary" />
                  Session en Cours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SimulationInterface
                  session={currentSession}
                  onAction={handleSimulationAction}
                  onComplete={completeSimulation}
                />
              </CardContent>
            </Card>
          )}

          {/* Simulation Scenarios */}
          {!currentSession && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {SIMULATION_SCENARIOS.map((scenario) => (
                <Card key={scenario.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="p-6">
                    <div className={`w-full h-32 rounded-lg bg-gradient-to-r ${getPlatformColor(scenario.platform)} flex items-center justify-center text-white mb-4`}>
                      <div className="text-center">
                        <div className="text-4xl mb-2">
                          {scenario.platform === 'twitch' && <SiTwitch />}
                          {scenario.platform === 'youtube' && <SiYoutube />}
                          {scenario.platform === 'instagram' && <SiInstagram />}
                          {scenario.platform === 'tiktok' && <SiTiktok />}
                          {scenario.platform === 'twitter' && <SiX />}
                        </div>
                        <div className="text-sm font-medium">
                          {scenario.platform.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg">{scenario.title}</h3>
                        <Badge className={getDifficultyColor(scenario.difficulty)}>
                          {scenario.difficulty}
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground text-sm">
                        {scenario.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {scenario.duration} min
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          +{scenario.xpReward} XP
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Objectifs:</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {scenario.objectives.map((objective, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <Target className="h-3 w-3" />
                              {objective}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <Button
                        onClick={() => startSimulation(scenario)}
                        className="w-full group-hover:bg-primary/90"
                      >
                        <Rocket className="mr-2 h-4 w-4" />
                        Démarrer la Simulation
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Simulation History */}
          {simulationHistory.length > 0 && !currentSession && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Historique des Simulations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {simulationHistory.slice(-5).map((session: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/20 rounded-full">
                          <Gamepad2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{session.simulationType}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(session.completedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">
                          Score: {session.score || 0}%
                        </Badge>
                        <Badge className="bg-green-100 text-green-800">
                          +{session.xpEarned || 0} XP
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}