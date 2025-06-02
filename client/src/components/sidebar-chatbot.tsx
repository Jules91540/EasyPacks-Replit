import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Send,
  Bot,
  User,
  Lightbulb,
  Target,
  TrendingUp,
  Users,
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
  type?: 'text' | 'tip' | 'suggestion' | 'motivation';
}

interface ChatbotResponse {
  content: string;
  type: 'text' | 'tip' | 'suggestion' | 'motivation';
  suggestions?: string[];
}

class IntelligentContentChatbot {
  private static platformTips = {
    twitch: [
      "Créez un planning de streaming régulier pour fidéliser votre audience",
      "Interagissez constamment avec le chat pour maintenir l'engagement",
      "Utilisez des overlays attrayants et des alertes pour les nouveaux followers",
      "Collaborez avec d'autres streamers de votre niche"
    ],
    youtube: [
      "Optimisez vos miniatures avec des couleurs vives et du texte lisible",
      "Publiez vos vidéos à des heures de forte audience",
      "Créez des playlists thématiques pour augmenter le temps de visionnage",
      "Utilisez des tags pertinents et des descriptions détaillées"
    ],
    tiktok: [
      "Utilisez les tendances musicales populaires du moment",
      "Créez des hooks captivants dans les 3 premières secondes",
      "Participez aux challenges et créez les vôtres",
      "Postez régulièrement pour maintenir la visibilité"
    ],
    instagram: [
      "Utilisez un mix de posts, stories et reels pour maximiser la portée",
      "Créez un feed cohérent avec une palette de couleurs",
      "Engagez avec votre communauté via les commentaires et DM",
      "Utilisez les hashtags stratégiquement (pas plus de 30)"
    ]
  };

  private static motivationalMessages = [
    "Chaque créateur de contenu a commencé avec 0 follower. Votre parcours ne fait que commencer ! 🚀",
    "La constance bat la perfection. Continuez à créer, même quand vous ne vous sentez pas inspiré.",
    "Votre voix unique est votre plus grand atout. Ne cherchez pas à copier, mais à innover.",
    "Les échecs sont des leçons déguisées. Analysez, apprenez, et rebondissez plus fort !",
    "Votre audience grandit à chaque contenu que vous partagez. Patience et persévérance."
  ];

  private static analyzeIntent(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('aide') || lowerMessage.includes('help')) return 'help';
    if (lowerMessage.includes('twitch') || lowerMessage.includes('stream')) return 'twitch';
    if (lowerMessage.includes('youtube') || lowerMessage.includes('vidéo')) return 'youtube';
    if (lowerMessage.includes('tiktok') || lowerMessage.includes('viral')) return 'tiktok';
    if (lowerMessage.includes('instagram') || lowerMessage.includes('reel')) return 'instagram';
    if (lowerMessage.includes('motivation') || lowerMessage.includes('découragé')) return 'motivation';
    if (lowerMessage.includes('audience') || lowerMessage.includes('followers')) return 'audience';
    if (lowerMessage.includes('contenu') || lowerMessage.includes('idée')) return 'content';
    if (lowerMessage.includes('analytics') || lowerMessage.includes('stats')) return 'analytics';
    if (lowerMessage.includes('bonjour') || lowerMessage.includes('salut')) return 'greeting';
    
    return 'general';
  }

  static generateResponse(message: string, userContext?: any): ChatbotResponse {
    const intent = this.analyzeIntent(message);
    
    switch (intent) {
      case 'greeting':
        return {
          content: `Salut ! 👋 Je suis ton assistant IA spécialisé dans la création de contenu. Je suis là pour t'aider à développer ta présence sur toutes les plateformes. Comment puis-je t'aider aujourd'hui ?`,
          type: 'text',
          suggestions: ['Conseils pour YouTube', 'Stratégie TikTok', 'Croissance audience', 'Motivation créateur']
        };

      case 'help':
        return {
          content: `Je peux t'aider avec :\n\n🎯 **Stratégies spécifiques** pour chaque plateforme\n📈 **Conseils de croissance** d'audience\n💡 **Idées de contenu** créatives\n📊 **Analyse de performance**\n🔥 **Motivation** et conseils mindset\n\nPose-moi une question spécifique !`,
          type: 'text',
          suggestions: ['Conseils Twitch', 'Optimiser YouTube', 'Viral TikTok', 'Stratégie Instagram']
        };

      case 'twitch':
        const twitchTip = this.platformTips.twitch[Math.floor(Math.random() * this.platformTips.twitch.length)];
        return {
          content: `🎮 **Conseil Twitch :**\n${twitchTip}\n\n**Bonus :** Crée des émotes personnalisées pour renforcer l'identité de ta chaîne et encourage les subscriptions !`,
          type: 'tip',
          suggestions: ['Plus de conseils Twitch', 'Engagement chat', 'Overlay design', 'Planning stream']
        };

      case 'youtube':
        const youtubeTip = this.platformTips.youtube[Math.floor(Math.random() * this.platformTips.youtube.length)];
        return {
          content: `📺 **Stratégie YouTube :**\n${youtubeTip}\n\n**Pro tip :** L'algorithme YouTube favorise les vidéos qui gardent les spectateurs sur la plateforme. Créez du contenu qui incite à regarder d'autres vidéos !`,
          type: 'tip',
          suggestions: ['SEO YouTube', 'Miniatures efficaces', 'Monetisation', 'Analytics YouTube']
        };

      case 'tiktok':
        const tiktokTip = this.platformTips.tiktok[Math.floor(Math.random() * this.platformTips.tiktok.length)];
        return {
          content: `🎵 **Hack TikTok :**\n${tiktokTip}\n\n**Astuce secrète :** Analysez les tendances dans votre niche 2-3 jours avant qu'elles explosent pour être parmi les premiers à les adopter !`,
          type: 'tip',
          suggestions: ['Trends TikTok', 'Hooks efficaces', 'Challenges viraux', 'Timing posts']
        };

      case 'instagram':
        const instagramTip = this.platformTips.instagram[Math.floor(Math.random() * this.platformTips.instagram.length)];
        return {
          content: `📸 **Stratégie Instagram :**\n${instagramTip}\n\n**Growth hack :** Utilisez les stories pour tester vos idées de contenu avant de les transformer en posts permanents !`,
          type: 'tip',
          suggestions: ['Stories efficaces', 'Reels viraux', 'Hashtags stratégie', 'Collaborations']
        };

      case 'motivation':
        const motivationMsg = this.motivationalMessages[Math.floor(Math.random() * this.motivationalMessages.length)];
        return {
          content: `💪 **Message de motivation :**\n\n${motivationMsg}\n\nRappele-toi : Chaque créateur que tu admires a eu des moments de doute. La différence ? Ils ont continué. Tu peux le faire aussi ! 🌟`,
          type: 'motivation',
          suggestions: ['Plus de motivation', 'Gérer le burnout', 'Mindset créateur', 'Objectifs réalistes']
        };

      case 'audience':
        return {
          content: `👥 **Stratégies de croissance d'audience :**\n\n1. **Constance** - Postez régulièrement\n2. **Engagement** - Répondez à tous les commentaires\n3. **Valeur** - Créez du contenu utile ou divertissant\n4. **Collaboration** - Travaillez avec d'autres créateurs\n5. **Analyse** - Étudiez vos statistiques\n\nQuelle plateforme t'intéresse le plus ?`,
          type: 'suggestion',
          suggestions: ['Engagement strategies', 'Collaborations', 'Content planning', 'Analytics décryptées']
        };

      case 'content':
        return {
          content: `💡 **Générateur d'idées de contenu :**\n\n🎯 **Formats populaires :**\n• Tutoriels pas-à-pas\n• Behind the scenes\n• Q&A avec votre audience\n• Réactions à des tendances\n• Collaborations créatives\n\n**Astuce :** Gardez un carnet d'idées et notez tout ce qui vous inspire au quotidien !`,
          type: 'suggestion',
          suggestions: ['Idées TikTok', 'Concepts YouTube', 'Contenu Instagram', 'Formats Twitch']
        };

      case 'analytics':
        return {
          content: `📊 **Décryptage Analytics :**\n\n🔍 **Métriques importantes :**\n• Taux d'engagement (likes/vues)\n• Temps de visionnage moyen\n• Croissance des followers\n• Meilleurs moments de publication\n\n**Pro tip :** Ne vous focalisez pas que sur les followers. L'engagement est plus important que la taille !`,
          type: 'text',
          suggestions: ['Métriques importantes', 'Optimiser reach', 'A/B testing', 'ROI contenu']
        };

      default:
        return {
          content: `Je comprends votre question ! En tant qu'assistant IA spécialisé en création de contenu, je peux vous aider avec des conseils personnalisés. Pouvez-vous me donner plus de détails sur ce qui vous préoccupe ? Quelle plateforme vous intéresse le plus ?`,
          type: 'text',
          suggestions: ['Conseils généraux', 'Choisir une plateforme', 'Stratégie débutant', 'Motivation créateur']
        };
    }
  }

  static getRandomTip(): string {
    const allTips = [...this.platformTips.twitch, ...this.platformTips.youtube, ...this.platformTips.tiktok, ...this.platformTips.instagram];
    return allTips[Math.floor(Math.random() * allTips.length)];
  }
}

interface SidebarChatbotProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function SidebarChatbot({ isOpen, onToggle }: SidebarChatbotProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Message de bienvenue initial
      const welcomeMessage: Message = {
        id: 'welcome',
        content: `Salut ${user?.firstName || 'créateur'} ! 🎉\n\nJe suis ton assistant IA personnel pour la création de contenu. Je suis là pour t'aider à développer ta présence sur toutes les plateformes avec des conseils personnalisés, des stratégies éprouvées, et des doses de motivation !\n\nComment puis-je t'aider aujourd'hui ?`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, user?.firstName]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    // Simuler un délai de réponse
    setTimeout(() => {
      const botResponse = IntelligentContentChatbot.generateResponse(inputValue, user);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: botResponse.content,
        sender: 'bot',
        timestamp: new Date(),
        type: botResponse.type
      };

      setMessages(prev => [...prev, botMessage]);
    }, 1000);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    handleSendMessage();
  };

  const getMessageIcon = (type?: string) => {
    switch (type) {
      case 'tip': return <Lightbulb className="h-4 w-4 text-yellow-400" />;
      case 'suggestion': return <Target className="h-4 w-4 text-blue-400" />;
      case 'motivation': return <TrendingUp className="h-4 w-4 text-green-400" />;
      default: return <Bot className="h-4 w-4 text-blue-400" />;
    }
  };

  const getMessageBadge = (type?: string) => {
    switch (type) {
      case 'tip': return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Conseil</Badge>;
      case 'suggestion': return <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">Stratégie</Badge>;
      case 'motivation': return <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">Motivation</Badge>;
      default: return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed right-4 bottom-4 w-96 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 transition-all duration-300 ${isMinimized ? 'h-16' : 'h-[600px]'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
          </div>
          <div>
            <h3 className="font-semibold text-white">Assistant IA</h3>
            <p className="text-xs text-white/60">Spécialiste création de contenu</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <ScrollArea className="h-[480px] p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.sender === 'bot' && (
                    <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                      {getMessageIcon(message.type)}
                    </div>
                  )}
                  
                  <div className={`max-w-[280px] ${message.sender === 'user' ? 'order-2' : ''}`}>
                    {message.sender === 'bot' && message.type && message.type !== 'text' && (
                      <div className="mb-2">
                        {getMessageBadge(message.type)}
                      </div>
                    )}
                    
                    <div className={`rounded-2xl px-4 py-3 ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white ml-auto'
                        : 'bg-white/10 text-white'
                    } ${message.sender === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                      <div className={`text-xs mt-2 ${message.sender === 'user' ? 'text-blue-100' : 'text-white/50'}`}>
                        {message.timestamp.toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>

                  {message.sender === 'user' && (
                    <div className="h-8 w-8 bg-gradient-to-br from-pink-500 to-violet-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              {/* Suggestions rapides */}
              {messages.length > 0 && messages[messages.length - 1].sender === 'bot' && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {['💡 Conseil du jour', '🚀 Boost audience', '📈 Analytics', '🎯 Stratégie'].map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          <Separator className="bg-white/10" />

          {/* Input */}
          <div className="p-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Pose-moi une question..."
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-blue-500/50 focus:bg-white/15 transition-all text-sm"
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-0 rounded-xl px-4 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function ChatbotToggle({ onClick, isOpen }: { onClick: () => void; isOpen: boolean }) {
  return (
    <Button
      onClick={onClick}
      className={`fixed bottom-4 right-4 h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg border-0 z-40 transition-all duration-300 ${isOpen ? 'scale-95 opacity-75' : 'scale-100 hover:scale-105'}`}
    >
      <MessageCircle className="h-6 w-6" />
    </Button>
  );
}