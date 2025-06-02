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

class IntelligentContentChatbot {
  private static currentTrends = {
    youtube: ["Shorts verticaux", "Lives interactifs", "Collaborations", "Tutorials rapides", "Réactions"],
    twitch: ["Just Chatting", "IRL streams", "Costreams", "Viewers games", "Sub goals"],
    instagram: ["Reels dansés", "Stories Q&A", "IGTV éducatif", "Carrousels tips", "Live shopping"],
    tiktok: ["Transitions créatives", "Challenges", "Duos/réponses", "POV videos", "Life hacks"],
    twitter: ["Threads éducatifs", "Polls interactifs", "Live-tweets", "Memes actuels", "Hot takes"]
  };

  private static videoIdeas = [
    "Réaction à des vidéos virales dans ta niche",
    "Tuto rapide : comment faire X en 60 secondes",
    "Mes 5 erreurs de débutant à éviter",
    "Test de produits/apps/services populaires",
    "Réponse aux commentaires/questions des abonnés",
    "Collaboration avec un autre créateur",
    "Challenge personnel (7 jours, 30 jours)",
    "Avant/après de ton setup/espace de travail",
    "Démystifier les idées reçues sur ton domaine",
    "Contenu behind-the-scenes de ta création",
    "Top/flop des tendances actuelles",
    "Histoire personnelle inspirante",
    "Conseils pour débutants dans ta niche",
    "Analyse de contenu viral : pourquoi ça marche",
    "Live Q&A avec tes abonnés"
  ];

  private static analyzeIntent(message: string): string {
    const msg = message.toLowerCase();
    
    // Salutations et politesse
    if (msg.includes('bonjour') || msg.includes('salut') || msg.includes('hello') || msg.includes('bonsoir') || msg.includes('coucou')) return 'greeting';
    if (msg.includes('ça va') || msg.includes('comment tu vas') || msg.includes('comment ça va') || msg.includes('ca va')) return 'how_are_you';
    if (msg.includes('merci') || msg.includes('thank') || msg.includes('super') || msg.includes('génial')) return 'thanks';
    if (msg.includes('au revoir') || msg.includes('bye') || msg.includes('à bientôt') || msg.includes('salut')) return 'goodbye';
    
    // Motivation et encouragement
    if (msg.includes('motivé') || msg.includes('motivation') || msg.includes('encourage') || msg.includes('démotivé') || msg.includes('découragé')) return 'motivation';
    if (msg.includes('difficile') || msg.includes('dur') || msg.includes('galère') || msg.includes('problème')) return 'support';
    if (msg.includes('fier') || msg.includes('réussi') || msg.includes('content') || msg.includes('heureux')) return 'celebration';
    
    // Questions personnelles sympathiques
    if (msg.includes('comment tu fais') || msg.includes('qui es-tu') || msg.includes('présente-toi')) return 'about_me';
    if (msg.includes('ton nom') || msg.includes('appelles')) return 'name';
    
    // Contenu création
    if (msg.includes('idée') || msg.includes('video') || msg.includes('contenu')) return 'video_ideas';
    if (msg.includes('thumbnail') || msg.includes('miniature')) return 'thumbnails';
    if (msg.includes('viral') || msg.includes('tendance')) return 'viral_tips';
    if (msg.includes('monétisation') || msg.includes('argent')) return 'monetization';
    if (msg.includes('engagement') || msg.includes('interaction')) return 'engagement';
    if (msg.includes('twitch')) return 'twitch_specific';
    if (msg.includes('youtube')) return 'youtube_specific';
    if (msg.includes('instagram') || msg.includes('insta')) return 'instagram_specific';
    if (msg.includes('tiktok')) return 'tiktok_specific';
    if (msg.includes('twitter') || msg.includes('x.com')) return 'twitter_specific';
    if (msg.includes('algorithme')) return 'algorithm';
    if (msg.includes('début') || msg.includes('commenc')) return 'getting_started';
    if (msg.includes('planning') || msg.includes('organis')) return 'content_planning';
    if (msg.includes('collaboration') || msg.includes('partenariat')) return 'collaboration';
    if (msg.includes('analytics') || msg.includes('statistiques')) return 'analytics';
    
    return 'general';
  }

  static generateResponse(message: string, userContext?: any): ChatbotResponse {
    const intent = this.analyzeIntent(message);
    const userName = userContext?.firstName || userContext?.email?.split('@')[0] || 'créateur';
    
    switch (intent) {
      case 'greeting':
        const greetings = [
          `Salut ${userName} ! 🌟 Je suis ravi de te voir ! Alors, prêt à créer du contenu de fou aujourd'hui ?`,
          `Coucou ${userName} ! 😄 Quelle belle journée pour faire exploser les compteurs ! Comment ça va ?`,
          `Hey ${userName} ! 🚀 J'espère que tu vas bien ! Tu as des projets créatifs en tête ?`,
          `Bonjour ${userName} ! ✨ Super de te retrouver ! On va faire quoi d'incroyable ensemble ?`
        ];
        return {
          content: greetings[Math.floor(Math.random() * greetings.length)],
          type: 'text',
          suggestions: [
            "Ça va super bien !",
            "J'ai besoin d'idées de vidéos",
            "Comment motiver mon audience ?",
            "Quelles sont les tendances ?"
          ]
        };

      case 'how_are_you':
        const howAreYouResponses = [
          `Moi ça va au top ${userName} ! 🔥 Je suis plein d'énergie et d'idées pour t'aider ! Et toi comment tu te sens ?`,
          `Je pète la forme ${userName} ! 💪 Toujours motivé à 100% pour t'accompagner ! Raconte-moi ta journée !`,
          `Ça roule ma poule ${userName} ! 😎 Je suis là, prêt à booster ta créativité ! Toi ça va ?`,
          `Je suis au max de ma forme ${userName} ! ⚡ Hyper motivé pour t'aider à cartonner ! Et de ton côté ?`
        ];
        return {
          content: howAreYouResponses[Math.floor(Math.random() * howAreYouResponses.length)],
          type: 'text',
          suggestions: [
            "Ça va bien merci !",
            "Un peu fatigué aujourd'hui",
            "Super motivé !",
            "J'ai des questions"
          ]
        };

      case 'thanks':
        const thanksResponses = [
          `Avec plaisir ${userName} ! 🤗 C'est ça l'esprit ! Tu vas cartonner j'en suis sûr !`,
          `De rien ${userName} ! 😊 Je suis là pour ça ! Continue comme ça, tu es sur la bonne voie !`,
          `Mais non voyons ${userName} ! 💕 C'est normal ! Je crois en toi à fond !`,
          `Tout le plaisir est pour moi ${userName} ! 🌟 Ensemble on va faire des miracles !`
        ];
        return {
          content: thanksResponses[Math.floor(Math.random() * thanksResponses.length)],
          type: 'text',
          suggestions: [
            "Tu es le meilleur !",
            "Donne-moi d'autres conseils",
            "Comment progresser encore ?",
            "Merci pour ta motivation !"
          ]
        };

      case 'goodbye':
        const goodbyes = [
          `À bientôt ${userName} ! 👋 N'oublie pas : tu as tout pour réussir ! Reviens quand tu veux !`,
          `Salut ${userName} ! 🌈 Continue à créer du contenu incroyable ! Je serai là quand tu auras besoin !`,
          `À plus ${userName} ! ✨ Tu vas déchirer ! J'ai hâte de voir tes prochaines créations !`,
          `Ciao ${userName} ! 🚀 Garde cette motivation ! Tu es un créateur extraordinaire !`
        ];
        return {
          content: goodbyes[Math.floor(Math.random() * goodbyes.length)],
          type: 'text'
        };

      case 'motivation':
        const motivationalResponses = [
          `Écoute-moi bien ${userName} ! 💪 Tu as un talent unique ! Chaque créateur de succès a eu des moments de doute. Ce qui compte c'est de CONTINUER ! Tu es plus fort que tu ne le penses !`,
          `Hey ${userName} ! 🔥 Je vais te dire un secret : TOUS les grands créateurs ont voulu abandonner un jour ! Mais regarde où ils sont maintenant ! Tu as la même flamme en toi !`,
          `${userName}, tu sais quoi ? 🌟 Chaque vue, chaque like, chaque commentaire que tu obtiens, c'est parce que tu MÉRITES d'être vu ! Continue, le monde a besoin de ton contenu !`,
          `Motivation mode ON ${userName} ! ⚡ Rappelle-toi pourquoi tu as commencé ! Cette passion en toi, elle est réelle ! Un jour tu regarderas en arrière et tu seras FIER du chemin parcouru !`
        ];
        return {
          content: motivationalResponses[Math.floor(Math.random() * motivationalResponses.length)],
          type: 'tip',
          suggestions: [
            "Comment garder la motivation ?",
            "Conseils pour les mauvais jours",
            "Comment célébrer mes réussites ?",
            "Merci pour ces mots !"
          ]
        };

      case 'support':
        const supportResponses = [
          `Je te comprends ${userName} 🤗 C'est normal d'avoir des moments difficiles ! Mais tu sais quoi ? Chaque problème est une opportunité d'apprendre ! Tu n'es pas seul, je suis là pour t'aider !`,
          `Hey ${userName} ! 💙 Les moments difficiles font partie du voyage ! Même les plus grands créateurs galèrent parfois ! L'important c'est de ne pas baisser les bras ! Dis-moi ce qui te pose problème !`,
          `${userName}, écoute-moi ! 🌈 Après la pluie vient le beau temps ! Ces difficultés vont te rendre plus fort ! Chaque obstacle surmonté est une victoire ! Allez, on va trouver des solutions ensemble !`,
          `Courage ${userName} ! 💪 Les difficultés c'est temporaire, mais ton talent c'est pour la vie ! Prends une pause si tu en as besoin, mais reviens toujours ! Je crois en toi !`
        ];
        return {
          content: supportResponses[Math.floor(Math.random() * supportResponses.length)],
          type: 'tip',
          suggestions: [
            "Comment surmonter les blocages ?",
            "Techniques pour rester positif",
            "J'ai besoin d'aide concrète",
            "Merci pour ton soutien"
          ]
        };

      case 'celebration':
        const celebrationResponses = [
          `OUAAAAAIS ${userName} ! 🎉🎉🎉 Je suis trop fier de toi ! Tu vois que tu peux le faire ! C'est juste le début, tu vas aller encore plus loin !`,
          `BRAVO ${userName} ! 🏆 Tu es en feu ! Cette réussite c'est grâce à ton travail et ta persévérance ! Savoure ce moment, tu le mérites !`,
          `INCREDIBLE ${userName} ! ✨ Je le savais que tu allais y arriver ! Tu as prouvé que tu es un VRAI créateur ! Continue sur cette lancée !`,
          `YES YES YES ${userName} ! 🚀 Tu viens de prouver que rien ne peut t'arrêter ! Cette énergie positive, garde-la ! Tu es unstoppable !`
        ];
        return {
          content: celebrationResponses[Math.floor(Math.random() * celebrationResponses.length)],
          type: 'suggestion',
          suggestions: [
            "Comment capitaliser sur ce succès ?",
            "Prochaine étape à franchir ?",
            "Merci pour ta joie !",
            "Comment reproduire ce succès ?"
          ]
        };

      case 'about_me':
        return {
          content: `Salut ${userName} ! 😄 Moi c'est ton assistant IA spécialisé en création de contenu ! Je suis là 24h/24 pour t'aider à devenir le créateur que tu rêves d'être !\n\n💡 J'ai une base de connaissances ÉNORME sur YouTube, Twitch, Instagram, TikTok...\n🔥 Je connais toutes les tendances 2024\n💪 Je suis hyper motivant (c'est ma spécialité !)\n🎯 Mon but : t'aider à créer du contenu qui cartonne !\n\nJe suis toujours de bonne humeur et prêt à t'encourager ! Alors, qu'est-ce qu'on crée ensemble ?`,
          type: 'text',
          suggestions: [
            "Tu es vraiment sympa !",
            "Aide-moi avec YouTube",
            "Donne-moi des idées",
            "Comment tu fais pour être si motivant ?"
          ]
        };

      case 'name':
        return {
          content: `Tu peux m'appeler ton Coach IA ${userName} ! 😎 Ou juste "Coach" si tu veux ! L'important c'est qu'on soit potes et qu'on crée du contenu de folie ensemble !\n\nMoi ce qui me rend heureux c'est de voir mes créateurs réussir ! Chaque fois que tu progresses, moi aussi je suis content ! On forme une équipe de choc ! 🚀`,
          type: 'text',
          suggestions: [
            "Salut Coach !",
            "Tu es mon coach préféré",
            "Aide-moi à progresser",
            "On va cartonner ensemble !"
          ]
        };

      case 'video_ideas':
        const randomIdeas = this.videoIdeas
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        
        return {
          content: `Excellente question ${userName} ! Voici 3 idées de vidéos tendance pour toi :\n\n${randomIdeas.map((idea, i) => `${i + 1}. ${idea}`).join('\n')}\n\nCes formats marchent très bien en ce moment car ils créent de l'engagement et sont faciles à consommer !`,
          type: 'suggestion',
          suggestions: [
            "Comment rendre ces idées plus personnelles ?",
            "Quels outils pour créer facilement ?",
            "Comment optimiser pour l'algorithme ?",
            "Conseils pour les thumbnails"
          ]
        };

      case 'thumbnails':
        return {
          content: `Pour des thumbnails qui convertissent ${userName} :\n\n🎯 **Contraste élevé** : Utilise des couleurs vives qui ressortent\n👀 **Visage expressif** : Expressions exagérées (surprise, joie, choc)\n📝 **Texte lisible** : Police bold, max 4-6 mots\n🔥 **Éléments visuels** : Flèches, cercles, emojis pour attirer l'œil\n⚡ **Test A/B** : Crée 2-3 versions et regarde laquelle performe\n\nOutils gratuits : Canva, GIMP, ou Photopea !`,
          type: 'tip',
          suggestions: [
            "Exemples de thumbnails qui marchent",
            "Erreurs à éviter absolument",
            "Templates gratuits à utiliser"
          ]
        };

      case 'viral_tips':
        return {
          content: `Les secrets du contenu viral ${userName} :\n\n⏰ **Timing parfait** : Poste quand ton audience est active\n🎣 **Hook puissant** : Les 3 premières secondes sont cruciales\n🔄 **Call-to-action clair** : "Partage si tu es d'accord", "Dis-moi en commentaire"\n📈 **Surf sur les tendances** : Utilise les hashtags et sons populaires\n💡 **Valeur ajoutée** : Apprends, divertis ou émeus ton audience\n🎭 **Authenticité** : Reste toi-même, c'est ça qui connecte vraiment`,
          type: 'tip',
          suggestions: [
            "Comment identifier les tendances ?",
            "Mesurer l'engagement facilement",
            "Optimiser pour chaque plateforme"
          ]
        };

      case 'monetization':
        return {
          content: `Stratégies de monétisation ${userName} :\n\n💰 **Sponsorships** : Partenariats avec des marques (dès 1K abonnés)\n🛍️ **Affiliation** : Recommande des produits que tu utilises vraiment\n📚 **Produits digitaux** : Formations, ebooks, presets\n☕ **Donations** : Tipeee, Ko-fi, Streamlabs\n🎓 **Coaching/Consulting** : Monétise ton expertise\n🔐 **Contenu premium** : Abonnements, contenus exclusifs\n\nCommence petit et diversifie tes revenus !`,
          type: 'suggestion',
          suggestions: [
            "Comment fixer ses tarifs ?",
            "Négocier avec les marques",
            "Créer des produits digitaux"
          ]
        };

      case 'engagement':
        return {
          content: `Booster ton engagement ${userName} :\n\n💬 **Réponds rapidement** : Les premières heures sont cruciales\n❓ **Pose des questions** : "Et toi, tu ferais quoi ?" "Ton avis ?"\n🎮 **Crée de l'interaction** : Sondages, quiz, défis\n📖 **Raconte des histoires** : Les gens adorent les anecdotes personnelles\n🔔 **Utilise les notifications** : Stories, lives, posts en temps réel\n🤝 **Engage avec d'autres** : Commente, partage, collabore`,
          type: 'tip',
          suggestions: [
            "Idées de stories interactives",
            "Organiser des concours",
            "Créer une communauté forte"
          ]
        };

      case 'youtube_specific':
        const ytTrends = this.currentTrends.youtube;
        return {
          content: `YouTube en 2024 ${userName} :\n\n🔥 **Tendances actuelles** : ${ytTrends.join(', ')}\n⏱️ **Shorts vs Long** : Mix les deux formats\n🎬 **Miniatures** : 1280x720px, visages expressifs\n📊 **Analytics** : Watch time > vues totales\n🔍 **SEO** : Titre, description, tags optimisés\n📅 **Régularité** : Mieux vaut 1 vidéo/semaine que 7 puis rien`,
          type: 'suggestion',
          suggestions: [
            "Optimiser pour les Shorts",
            "Améliorer la rétention",
            "Stratégie de mots-clés"
          ]
        };

      case 'twitch_specific':
        const twitchTrends = this.currentTrends.twitch;
        return {
          content: `Twitch strategy ${userName} :\n\n🎮 **Catégories hot** : ${twitchTrends.join(', ')}\n⏰ **Horaires fixes** : Crée une habitude chez tes viewers\n💬 **Chat actif** : Lis et réponds constamment\n🎯 **Sub goals** : Objectifs visuels et atteignables\n🔔 **Notifications** : Discord, Twitter pour annoncer tes lives\n🎭 **Personnalité** : Ton énergie fait tout la différence`,
          type: 'tip',
          suggestions: [
            "Setup streaming optimal",
            "Modération du chat",
            "Grandir sa communauté"
          ]
        };

      case 'instagram_specific':
        const igTrends = this.currentTrends.instagram;
        return {
          content: `Instagram 2024 ${userName} :\n\n📱 **Reels first** : ${igTrends.join(', ')}\n📸 **Feed cohérent** : Palette de couleurs uniforme\n📚 **Stories daily** : Polls, questions, behind-the-scenes\n🔗 **Bio optimisée** : Lien en bio vers tes autres contenus\n⏰ **Meilleurs moments** : 11h-13h et 19h-21h\n#️⃣ **Hashtags mix** : Populaires + niche + personnels`,
          type: 'suggestion',
          suggestions: [
            "Créer des Reels tendance",
            "Stories qui convertissent",
            "Stratégie hashtags 2024"
          ]
        };

      case 'tiktok_specific':
        const ttTrends = this.currentTrends.tiktok;
        return {
          content: `TikTok mastery ${userName} :\n\n🎵 **Audio trending** : ${ttTrends.join(', ')}\n⏱️ **15-30 secondes** : Format optimal pour l'engagement\n🎬 **Vertical native** : Filme directement en vertical\n🔥 **Premier plan** : Action dès la première seconde\n📱 **Trends surfing** : Adapte les tendances à ta niche\n🌍 **Timing global** : L'algorithme est international`,
          type: 'tip',
          suggestions: [
            "Identifier les sons tendance",
            "Édition rapide et efficace",
            "Comprendre l'algorithme TikTok"
          ]
        };

      case 'algorithm':
        return {
          content: `Décoder les algorithmes ${userName} :\n\n📈 **Engagement rate** : Likes, commentaires, partages dans les premières heures\n⏰ **Watch time** : Combien de temps les gens regardent\n🔄 **Retention** : Est-ce qu'ils regardent jusqu'à la fin ?\n👥 **Audience similarity** : L'algo trouve des profils similaires\n📅 **Consistance** : Poste régulièrement, même timing\n🎯 **Niche authority** : Reste dans ton domaine d'expertise`,
          type: 'suggestion',
          suggestions: [
            "Améliorer le watch time",
            "Créer des hooks efficaces",
            "Analyser ses performances"
          ]
        };

      case 'getting_started':
        return {
          content: `Guide débutant ${userName} :\n\n1️⃣ **Choisis ta niche** : Ce que tu adores + ce que tu maîtrises\n2️⃣ **Équipement minimal** : Smartphone + éclairage naturel\n3️⃣ **Premières vidéos** : Présente-toi, partage tes passions\n4️⃣ **Régularité** : Mieux vaut 1 post/semaine constant\n5️⃣ **Étudie la concurrence** : Inspire-toi sans copier\n6️⃣ **Patience** : Les premiers 1000 abonnés sont les plus durs !`,
          type: 'tip',
          suggestions: [
            "Comment choisir sa niche ?",
            "Setup débutant pas cher",
            "Éviter les erreurs communes"
          ]
        };

      case 'content_planning':
        return {
          content: `Planning de contenu ${userName} :\n\n📅 **Calendrier éditorial** : Planifie 2 semaines à l'avance\n🎯 **Mix de contenus** : 70% valeur, 20% personnel, 10% promo\n📝 **Batch creation** : Crée plusieurs contenus en une session\n📊 **Analytics hebdo** : Qu'est-ce qui a marché ?\n🔄 **Repurpose** : 1 idée = 5 formats différents\n⏰ **Timing optimal** : Poste quand ton audience est active`,
          type: 'suggestion',
          suggestions: [
            "Outils de planification gratuits",
            "Créer un calendrier éditorial",
            "Recycler ses contenus efficacement"
          ]
        };

      default:
        const greetingMessages = [
          `Hey ${userName} ! 🚀 Alors, tu as des idées de vidéos pour aujourd'hui ? J'ai plein d'inspiration à partager avec toi !`,
          `Salut mon créateur préféré ${userName} ! ✨ Prêt à faire exploser les compteurs ? Qu'est-ce qu'on crée ensemble ?`,
          `Coucou ${userName} ! 🔥 J'espère que tu vas bien ! Tu sais quoi ? Je sens que tu vas faire quelque chose d'incroyable aujourd'hui !`,
          `Bonjour ${userName} ! 🌟 Super de te retrouver ! Alors, on fait quoi d'extraordinaire ? J'ai hâte de t'aider !`
        ];
        
        return {
          content: greetingMessages[Math.floor(Math.random() * greetingMessages.length)],
          type: 'text',
          suggestions: [
            "Ça va super bien !",
            "J'ai besoin d'idées créatives",
            "Comment motiver mon audience ?",
            "Quelles sont les tendances actuelles ?"
          ]
        };
    }
  }

  static getRandomTip(): string {
    const tips = [
      "💡 Poste quand ton audience est active : utilise tes analytics !",
      "🎯 Un bon hook : pose une question intrigante dans les 3 premières secondes",
      "📱 Réponds à tes commentaires rapidement, l'algorithme adore ça !",
      "🔥 Utilise les trending hashtags, mais reste dans ta niche",
      "⚡ Crée des stories quotidiennes : c'est gratuit et ça booste ta visibilité",
      "🎬 Film plusieurs contenus en une fois : batch creation = efficacité",
      "💬 Engage avec d'autres créateurs : la communauté aide à grandir",
      "📊 Test A/B tes thumbnails : petits changements, gros impact !",
      "🎵 Sur TikTok, utilise les sons tendance dans tes premières heures",
      "📝 Écris des descriptions engageantes : pose des questions à ton audience"
    ];
    
    return tips[Math.floor(Math.random() * tips.length)];
  }
}

interface ChatbotProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function IntelligentChatbot({ isOpen, onToggle }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Message d'accueil automatique
      const welcomeResponse = IntelligentContentChatbot.generateResponse("", user);
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        content: welcomeResponse.content,
        sender: 'bot',
        timestamp: new Date(),
        type: welcomeResponse.type
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, user]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Générer la réponse du bot
    setTimeout(() => {
      const botResponse = IntelligentContentChatbot.generateResponse(inputMessage, user);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: botResponse.content,
        sender: 'bot',
        timestamp: new Date(),
        type: botResponse.type
      };
      setMessages(prev => [...prev, botMessage]);
    }, 800);

    setInputMessage("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    handleSendMessage();
  };

  const addRandomTip = () => {
    const tipMessage: Message = {
      id: Date.now().toString(),
      content: IntelligentContentChatbot.getRandomTip(),
      sender: 'bot',
      timestamp: new Date(),
      type: 'tip'
    };
    setMessages(prev => [...prev, tipMessage]);
  };

  if (!isOpen) return null;

  return (
    <Card className="w-96 h-[600px] shadow-2xl border-2 border-blue-200 bg-white">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <Bot className="h-6 w-6" />
            Assistant IA Créateur
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="flex flex-col h-[520px] p-0">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.sender === 'bot' && (
                    <Avatar className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-500">
                      <AvatarFallback className="text-white text-xs">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white ml-auto'
                        : message.type === 'tip'
                        ? 'bg-amber-500/20 border-2 border-amber-500/30 text-foreground'
                        : message.type === 'suggestion'
                        ? 'bg-green-500/20 border-2 border-green-500/30 text-foreground'
                        : 'bg-muted border border-border text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {message.type === 'tip' && <Lightbulb className="h-4 w-4 text-amber-600" />}
                      {message.type === 'suggestion' && <Target className="h-4 w-4 text-green-600" />}
                      {message.sender === 'bot' && !message.type && <Zap className="h-4 w-4 text-blue-600" />}
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-line font-medium">
                      {message.content}
                    </p>
                  </div>

                  {message.sender === 'user' && (
                    <Avatar className="h-8 w-8 bg-blue-600">
                      <AvatarFallback className="text-white text-xs">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Quick Actions */}
          <div className="p-3 border-t border-border bg-background">
            <div className="flex gap-2 mb-3">
              <Button
                onClick={addRandomTip}
                size="sm"
                variant="outline"
                className="text-xs bg-amber-500/20 border-amber-500/30 text-amber-400 hover:bg-amber-500/30"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                Tip du jour
              </Button>
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-border bg-background">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Demande-moi des conseils..."
                className="flex-1 border-2 border-border focus:border-primary bg-background text-foreground"
              />
              <Button 
                onClick={handleSendMessage}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export function ChatbotToggle({ onClick, isOpen }: { onClick: () => void; isOpen: boolean }) {
  if (isOpen) return null;
  
  return (
    <Button
      onClick={onClick}
      className="h-16 w-16 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-4 border-white"
    >
      <MessageCircle className="h-7 w-7" />
    </Button>
  );
}