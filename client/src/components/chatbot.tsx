import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Lightbulb,
  TrendingUp,
  Target,
  Zap,
  X,
  Minimize2,
  Maximize2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'suggestion' | 'tip';
}

interface ChatbotResponse {
  content: string;
  type: 'text' | 'suggestion' | 'tip';
  suggestions?: string[];
}

// Base de connaissances sur la création de contenu
const CONTENT_KNOWLEDGE = {
  platforms: {
    twitch: {
      tips: [
        "Maintenez un horaire de stream régulier pour fidéliser votre audience",
        "Interagissez constamment avec le chat pour créer de l'engagement",
        "Créez des overlays visuellement attrayants avec vos informations",
        "Utilisez des commandes de chat pour automatiser les interactions"
      ],
      metrics: ["viewers", "followers", "chat activity", "stream duration"],
      bestPractices: [
        "Stream au moins 3 heures pour maximiser la visibilité",
        "Choisissez une catégorie peu saturée au début",
        "Créez du contenu en dehors du stream (TikTok, YouTube)"
      ]
    },
    youtube: {
      tips: [
        "Optimisez vos titres avec des mots-clés recherchés",
        "Créez des miniatures accrocheuses avec des couleurs vives",
        "Publiez régulièrement à la même heure",
        "Engagez votre audience dans les premières 15 secondes"
      ],
      metrics: ["views", "watch time", "CTR", "subscriber growth"],
      bestPractices: [
        "Durée vidéo: 8-12 minutes pour maximiser la monétisation",
        "Utilisez des cartes et écrans de fin",
        "Analysez vos analytics pour comprendre votre audience"
      ]
    },
    instagram: {
      tips: [
        "Postez des stories quotidiennement pour rester visible",
        "Utilisez 3-5 hashtags stratégiques par post",
        "Créez du contenu vertical adapté au mobile",
        "Collaborez avec d'autres créateurs de votre niche"
      ],
      metrics: ["engagement rate", "reach", "story completion", "saves"],
      bestPractices: [
        "Postez entre 1-2 fois par jour maximum",
        "Mixez photos, carrousels et reels",
        "Répondez aux commentaires dans les 2 premières heures"
      ]
    },
    tiktok: {
      tips: [
        "Suivez les tendances musicales et hashtags populaires",
        "Créez du contenu authentique et divertissant",
        "Utilisez des effets visuels pour capter l'attention",
        "Postez aux heures de pic d'activité"
      ],
      metrics: ["completion rate", "shares", "comments", "like ratio"],
      bestPractices: [
        "Durée optimale: 15-30 secondes",
        "Hook dans les 3 premières secondes",
        "Postez 1-3 fois par jour"
      ]
    }
  },
  
  contentTypes: {
    gaming: [
      "Commentez vos décisions de gameplay en temps réel",
      "Créez des moments highlights pour les réseaux sociaux",
      "Partagez vos échecs comme vos succès",
      "Développez votre personnalité de joueur unique"
    ],
    educational: [
      "Structurez votre contenu avec une intro, développement, conclusion",
      "Utilisez des visuels pour simplifier les concepts complexes",
      "Préparez des exemples concrets et relatable",
      "Encouragez les questions et l'interaction"
    ],
    lifestyle: [
      "Montrez votre authenticité et vos imperfections",
      "Créez des routines et habitudes que votre audience peut suivre",
      "Partagez vos apprentissages et évolutions personnelles",
      "Documentez vos expériences du quotidien"
    ]
  },

  monetization: {
    strategies: [
      "Diversifiez vos sources de revenus (sponsors, merch, abonnements)",
      "Construisez une audience fidèle avant de monétiser",
      "Restez transparent sur vos partenariats",
      "Créez des produits en accord avec votre marque personnelle"
    ],
    platforms_revenue: {
      twitch: "Abonnements, bits, donations, sponsors",
      youtube: "AdSense, memberships, Super Chat, sponsors",
      instagram: "Posts sponsorisés, affiliate marketing, produits",
      tiktok: "Creator Fund, live gifts, brand partnerships"
    }
  }
};

// Système de réponses intelligentes
class ContentChatbot {
  private static analyzeIntent(message: string): string {
    const msg = message.toLowerCase();
    
    if (msg.includes('twitch') || msg.includes('stream')) return 'twitch';
    if (msg.includes('youtube') || msg.includes('vidéo')) return 'youtube';
    if (msg.includes('instagram') || msg.includes('insta') || msg.includes('photo')) return 'instagram';
    if (msg.includes('tiktok') || msg.includes('viral')) return 'tiktok';
    if (msg.includes('monétisation') || msg.includes('argent') || msg.includes('revenus')) return 'monetization';
    if (msg.includes('gaming') || msg.includes('jeu')) return 'gaming';
    if (msg.includes('éducation') || msg.includes('tuto')) return 'educational';
    if (msg.includes('authentique') || msg.includes('personnel')) return 'lifestyle';
    if (msg.includes('audience') || msg.includes('engagement')) return 'audience';
    if (msg.includes('contenu') || msg.includes('créer')) return 'content_creation';
    
    return 'general';
  }

  static generateResponse(message: string, userContext?: any): ChatbotResponse {
    const intent = this.analyzeIntent(message);
    const userName = userContext?.firstName || 'Créateur';
    
    switch (intent) {
      case 'twitch':
        return {
          content: `Excellent choix ${userName} ! Pour Twitch, voici mes conseils prioritaires : ${CONTENT_KNOWLEDGE.platforms.twitch.tips[Math.floor(Math.random() * CONTENT_KNOWLEDGE.platforms.twitch.tips.length)]}`,
          type: 'suggestion',
          suggestions: [
            "Comment améliorer mon engagement sur Twitch ?",
            "Quels overlays utiliser pour débuter ?",
            "Comment gérer les trolls dans le chat ?"
          ]
        };
        
      case 'youtube':
        return {
          content: `Pour réussir sur YouTube, focus sur : ${CONTENT_KNOWLEDGE.platforms.youtube.tips[Math.floor(Math.random() * CONTENT_KNOWLEDGE.platforms.youtube.tips.length)]} N'oubliez pas que la régularité est clé !`,
          type: 'suggestion',
          suggestions: [
            "Comment créer de meilleures miniatures ?",
            "Quelle durée de vidéo recommandez-vous ?",
            "Comment optimiser mes titres pour le SEO ?"
          ]
        };
        
      case 'instagram':
        return {
          content: `Instagram, c'est du visuel avant tout ! ${CONTENT_KNOWLEDGE.platforms.instagram.tips[Math.floor(Math.random() * CONTENT_KNOWLEDGE.platforms.instagram.tips.length)]} Pensez mobile-first !`,
          type: 'tip',
          suggestions: [
            "Quels hashtags utiliser en 2024 ?",
            "Comment créer du contenu pour les stories ?",
            "Stratégie de collaboration sur Instagram ?"
          ]
        };
        
      case 'tiktok':
        return {
          content: `TikTok, c'est la créativité pure ! ${CONTENT_KNOWLEDGE.platforms.tiktok.tips[Math.floor(Math.random() * CONTENT_KNOWLEDGE.platforms.tiktok.tips.length)]} Soyez authentique et suivez les trends !`,
          type: 'suggestion',
          suggestions: [
            "Comment trouver les tendances actuelles ?",
            "Meilleurs moments pour poster sur TikTok ?",
            "Comment créer du contenu viral ?"
          ]
        };
        
      case 'monetization':
        const strategy = CONTENT_KNOWLEDGE.monetization.strategies[Math.floor(Math.random() * CONTENT_KNOWLEDGE.monetization.strategies.length)];
        return {
          content: `Pour la monétisation, voici ma recommandation clé : ${strategy} Commencez par construire une audience engagée !`,
          type: 'suggestion',
          suggestions: [
            "Quand commencer à monétiser ?",
            "Comment négocier avec les marques ?",
            "Idées de produits à créer ?"
          ]
        };
        
      case 'audience':
        return {
          content: `L'engagement, c'est le saint graal ! Concentrez-vous sur la qualité des interactions plutôt que la quantité. Répondez toujours aux commentaires dans les 2 premières heures.`,
          type: 'tip',
          suggestions: [
            "Comment créer du contenu engageant ?",
            "Stratégies pour fidéliser son audience ?",
            "Comment gérer une communauté toxique ?"
          ]
        };
        
      case 'content_creation':
        return {
          content: `La création de contenu, c'est 20% d'inspiration et 80% de transpiration ! Planifiez votre contenu, restez consistent, et n'ayez pas peur d'expérimenter.`,
          type: 'suggestion',
          suggestions: [
            "Comment trouver des idées de contenu ?",
            "Outils recommandés pour créer ?",
            "Comment mesurer le succès de mon contenu ?"
          ]
        };
        
      default:
        const greetingMessages = [
          `Salut ${userName} ! Alors, tu as des idées de vidéos pour aujourd'hui ? 🎬`,
          `Hey ${userName} ! Prêt à créer du contenu incroyable ? Dis-moi tes idées !`,
          `Bonjour ${userName} ! Qu'est-ce qu'on crée aujourd'hui ? J'ai plein de conseils pour toi !`
        ];
        
        return {
          content: greetingMessages[Math.floor(Math.random() * greetingMessages.length)],
          type: 'text',
          suggestions: [
            "J'ai besoin d'idées de vidéos",
            "Comment améliorer mes thumbnails ?",
            "Conseils pour être viral",
            "Stratégies d'engagement"
          ]
        };
    }
  }

  static getRandomTip(): string {
    const allTips = [
      ...CONTENT_KNOWLEDGE.platforms.twitch.tips,
      ...CONTENT_KNOWLEDGE.platforms.youtube.tips,
      ...CONTENT_KNOWLEDGE.platforms.instagram.tips,
      ...CONTENT_KNOWLEDGE.platforms.tiktok.tips,
      "La constance bat la perfection - publiez régulièrement même si ce n'est pas parfait",
      "Analysez vos métriques chaque semaine pour comprendre ce qui fonctionne",
      "Collaborez avec d'autres créateurs de votre niche pour grandir ensemble",
      "Créez du contenu 'evergreen' qui restera pertinent dans le temps"
    ];
    
    return allTips[Math.floor(Math.random() * allTips.length)];
  }
}

interface ChatbotProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Chatbot({ isOpen, onToggle }: ChatbotProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Message d'accueil
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeResponse = ContentChatbot.generateResponse("", user);
      setMessages([{
        id: '1',
        content: welcomeResponse.content,
        sender: 'bot',
        timestamp: new Date(),
        type: welcomeResponse.type
      }]);
    }
  }, [isOpen, user]);

  // Scroll automatique vers le bas
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);

    // Simulation de délai de réponse
    setTimeout(() => {
      const response = ContentChatbot.generateResponse(input, user);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        sender: 'bot',
        timestamp: new Date(),
        type: response.type
      };

      setMessages(prev => [...prev, botMessage]);
    }, 500);

    setInput("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const sendRandomTip = () => {
    const tip = ContentChatbot.getRandomTip();
    const tipMessage: Message = {
      id: Date.now().toString(),
      content: `💡 Conseil du jour : ${tip}`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'tip'
    };
    setMessages(prev => [...prev, tipMessage]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={`w-96 shadow-2xl border-2 border-primary/20 ${isMinimized ? 'h-16' : 'h-[600px]'} transition-all duration-300`}>
        <CardHeader className="p-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Assistant IA Créateur</CardTitle>
                <p className="text-sm opacity-90">Expert en création de contenu</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-white/20 p-1 h-auto"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="text-white hover:bg-white/20 p-1 h-auto"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-[540px]">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.sender === 'bot' && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary text-white">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`max-w-[75%] ${message.sender === 'user' ? 'order-last' : ''}`}>
                      <div
                        className={`p-3 rounded-lg ${
                          message.sender === 'user'
                            ? 'bg-primary text-white'
                            : message.type === 'tip'
                            ? 'bg-amber-50 border border-amber-200'
                            : message.type === 'suggestion'
                            ? 'bg-blue-50 border border-blue-200'
                            : 'bg-gray-100'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        {message.type && message.type !== 'text' && (
                          <Badge 
                            variant="secondary" 
                            className={`mt-2 text-xs ${
                              message.type === 'tip' ? 'bg-amber-100' : 'bg-blue-100'
                            }`}
                          >
                            {message.type === 'tip' ? <Lightbulb className="h-3 w-3 mr-1" /> : <Target className="h-3 w-3 mr-1" />}
                            {message.type === 'tip' ? 'Conseil' : 'Suggestion'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>

                    {message.sender === 'user' && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-secondary">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Quick Actions */}
            <div className="p-3 border-t">
              <div className="flex gap-2 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={sendRandomTip}
                  className="text-xs"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Conseil Rapide
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick("Comment améliorer mon engagement ?")}
                  className="text-xs"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Engagement
                </Button>
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Demandez conseil à votre assistant IA..."
                  className="text-sm"
                />
                <Button onClick={sendMessage} size="sm">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// Bouton flottant pour ouvrir le chatbot
export function ChatbotToggle({ onClick, isOpen }: { onClick: () => void; isOpen: boolean }) {
  if (isOpen) return null;

  return (
    <Button
      onClick={onClick}
      className="fixed bottom-4 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-2xl"
      size="lg"
    >
      <MessageCircle className="h-6 w-6" />
    </Button>
  );
}