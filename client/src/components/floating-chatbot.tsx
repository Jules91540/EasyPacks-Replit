import { useState, useEffect } from "react";
import { Bot, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatbotResponse {
  content: string;
  suggestions?: string[];
}

// Intelligence artificielle simple pour les conseils de création de contenu
class ContentChatbot {
  private static responses = {
    youtube: [
      "Pour YouTube, concentrez-vous sur des titres accrocheurs et des miniatures visuellement attrayantes !",
      "Les 15 premières secondes sont cruciales sur YouTube - captez l'attention immédiatement !",
      "Utilisez des mots-clés pertinents dans vos titres et descriptions pour améliorer votre référencement.",
    ],
    twitch: [
      "Sur Twitch, l'interaction avec le chat est essentielle - répondez aux messages régulièrement !",
      "Créez une routine de stream pour que votre audience sache quand vous trouver.",
      "Les overlays et alertes rendent vos streams plus professionnels et engageants.",
    ],
    instagram: [
      "Les Stories Instagram sont parfaites pour montrer les coulisses de votre création !",
      "Utilisez des hashtags pertinents mais évitez d'en mettre trop (10-15 maximum).",
      "La cohérence visuelle de votre feed Instagram aide à construire votre marque personnelle.",
    ],
    tiktok: [
      "Sur TikTok, suivez les tendances mais ajoutez votre touche personnelle !",
      "Les premiers 3 secondes déterminent si les gens vont regarder votre vidéo jusqu'au bout.",
      "Expérimentez avec les effets et la musique populaire pour augmenter votre portée.",
    ],
    general: [
      "La consistance est la clé du succès sur toutes les plateformes !",
      "Analysez vos métriques pour comprendre ce qui fonctionne le mieux.",
      "Interagissez avec votre communauté - répondez aux commentaires et messages !",
      "Planifiez votre contenu à l'avance pour maintenir un rythme régulier.",
      "Collaborez avec d'autres créateurs pour élargir votre audience.",
    ]
  };

  static generateResponse(message: string): ChatbotResponse {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('youtube')) {
      return {
        content: this.responses.youtube[Math.floor(Math.random() * this.responses.youtube.length)],
        suggestions: ["Conseils pour les miniatures", "Comment optimiser mes titres ?"]
      };
    }
    
    if (lowerMessage.includes('twitch')) {
      return {
        content: this.responses.twitch[Math.floor(Math.random() * this.responses.twitch.length)],
        suggestions: ["Améliorer l'interaction chat", "Conseils pour les overlays"]
      };
    }
    
    if (lowerMessage.includes('instagram')) {
      return {
        content: this.responses.instagram[Math.floor(Math.random() * this.responses.instagram.length)],
        suggestions: ["Stratégie Stories", "Conseils hashtags"]
      };
    }
    
    if (lowerMessage.includes('tiktok')) {
      return {
        content: this.responses.tiktok[Math.floor(Math.random() * this.responses.tiktok.length)],
        suggestions: ["Suivre les tendances", "Optimiser l'engagement"]
      };
    }
    
    // Réponse générale
    return {
      content: this.responses.general[Math.floor(Math.random() * this.responses.general.length)],
      suggestions: ["Conseils généraux", "Analyser mes performances", "Stratégies d'engagement"]
    };
  }
}

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Message de bienvenue
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: "welcome",
        content: "Salut ! Je suis ton assistant IA pour la création de contenu. Comment puis-je t'aider aujourd'hui ?",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulation de délai de réponse
    setTimeout(() => {
      const response = ContentChatbot.generateResponse(inputValue);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  if (!isOpen) {
    return (
      <div className="fixed left-2 bottom-6 z-50 ml-16">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-12 w-12 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-white/20"
          size="icon"
        >
          <Bot className="h-5 w-5 text-white" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed left-2 bottom-6 z-50 ml-16">
      <Card className="w-80 h-96 bg-slate-900/95 backdrop-blur-lg border-violet-500/30 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-violet-500/30">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gradient-to-r from-violet-600 to-purple-600 text-white">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-white text-sm">Assistant IA</h3>
              <p className="text-xs text-violet-300">Conseils création</p>
            </div>
          </div>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4 h-64">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs p-3 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-br-sm'
                      : 'bg-white/10 text-white rounded-tl-sm border border-white/20'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs mt-1 opacity-60">
                    {message.timestamp.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/10 p-3 rounded-2xl rounded-tl-sm border border-white/20">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-violet-500/30">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Tapez votre question..."
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-violet-400"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Suggestions rapides */}
          <div className="flex flex-wrap gap-1 mt-2">
            {["YouTube", "Twitch", "Instagram", "TikTok"].map((platform) => (
              <Button
                key={platform}
                onClick={() => handleSuggestionClick(`Conseils pour ${platform}`)}
                variant="outline"
                size="sm"
                className="text-xs h-6 px-2 bg-transparent border-violet-500/30 text-violet-300 hover:bg-violet-500/20 hover:text-white"
              >
                {platform}
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}