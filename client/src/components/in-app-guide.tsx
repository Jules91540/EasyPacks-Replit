import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HelpCircle, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Play, 
  Users, 
  Trophy, 
  MessageCircle,
  Search,
  Home,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface GuideStep {
  id: string;
  title: string;
  description: string;
  content: string;
  icon: any;
  category: 'getting_started' | 'navigation' | 'features' | 'tips';
  keywords: string[];
}

interface InAppGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InAppGuide({ isOpen, onClose }: InAppGuideProps) {
  const [currentCategory, setCurrentCategory] = useState<string>('getting_started');
  const [currentStep, setCurrentStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSteps, setFilteredSteps] = useState<GuideStep[]>([]);
  const [visitedSteps, setVisitedSteps] = useState<Set<string>>(new Set());
  const [completedCategories, setCompletedCategories] = useState<Set<string>>(new Set());

  const guideSteps: GuideStep[] = [
    // Getting Started
    {
      id: 'welcome',
      title: 'Bienvenue dans Easy Packs',
      description: 'Découvrez votre centre de formation pour créateurs de contenu',
      content: 'Easy Packs est votre centre de formation complet pour devenir un créateur de contenu professionnel. Explorez nos modules spécialisés pour chaque plateforme sociale et rejoignez notre communauté active.',
      icon: Home,
      category: 'getting_started',
      keywords: ['bienvenue', 'introduction', 'démarrage', 'présentation']
    },
    {
      id: 'first_steps',
      title: 'Premiers pas',
      description: 'Comment commencer votre apprentissage',
      content: 'Commencez par explorer la section "Modules" pour découvrir les formations disponibles. Consultez votre tableau de bord pour suivre vos progrès et n\'hésitez pas à utiliser le chatbot IA pour obtenir de l\'aide.',
      icon: Play,
      category: 'getting_started',
      keywords: ['premiers pas', 'commencer', 'démarrer', 'début']
    },
    
    // Navigation
    {
      id: 'dashboard',
      title: 'Tableau de bord',
      description: 'Votre hub central d\'apprentissage',
      content: 'Le tableau de bord vous donne un aperçu complet de vos progrès, vos badges récents, et vos modules en cours. C\'est votre point de départ pour naviguer dans la plateforme.',
      icon: Home,
      category: 'navigation',
      keywords: ['tableau de bord', 'dashboard', 'accueil', 'hub']
    },
    {
      id: 'modules',
      title: 'Modules de formation',
      description: 'Accédez à vos cours spécialisés',
      content: 'Dans la section Modules, trouvez des formations spécialisées pour chaque plateforme : Twitch, YouTube, Instagram, TikTok et X. Chaque module contient des leçons progressives et des quiz d\'évaluation.',
      icon: BookOpen,
      category: 'navigation',
      keywords: ['modules', 'cours', 'formation', 'leçons', 'apprentissage']
    },
    {
      id: 'forum',
      title: 'Forum communautaire',
      description: 'Échangez avec d\'autres créateurs',
      content: 'Le forum utilise une interface moderne inspirée d\'Instagram. Créez des sujets, participez aux discussions, partagez vos expériences et recevez des conseils de la communauté.',
      icon: Users,
      category: 'navigation',
      keywords: ['forum', 'communauté', 'discussion', 'échange', 'social']
    },
    {
      id: 'progress',
      title: 'Suivi des progrès',
      description: 'Visualisez votre évolution',
      content: 'La page Progrès vous montre votre avancement détaillé dans chaque module, vos scores aux quiz, et votre niveau général. Suivez vos statistiques et identifiez les domaines à améliorer.',
      icon: Target,
      category: 'navigation',
      keywords: ['progrès', 'avancement', 'statistiques', 'évolution']
    },
    
    // Features
    {
      id: 'xp_system',
      title: 'Système XP et niveaux',
      description: 'Gagnez des points d\'expérience',
      content: 'Complétez des modules, réussissez des quiz et participez au forum pour gagner de l\'XP. Montez de niveau pour débloquer du contenu exclusif et des privilèges spéciaux.',
      icon: Trophy,
      category: 'features',
      keywords: ['xp', 'expérience', 'niveau', 'points', 'récompenses']
    },
    {
      id: 'badges',
      title: 'Badges et récompenses',
      description: 'Collectionnez vos accomplissements',
      content: 'Débloquez des badges en atteignant des objectifs spécifiques : terminer un module, obtenir un score parfait, aider d\'autres membres. Chaque badge témoigne de votre expertise.',
      icon: Trophy,
      category: 'features',
      keywords: ['badges', 'récompenses', 'accomplissements', 'objectifs']
    },
    {
      id: 'ai_chatbot',
      title: 'Assistant IA',
      description: 'Votre guide personnel intelligent',
      content: 'Le chatbot IA est disponible 24h/24 pour répondre à vos questions, vous donner des conseils personnalisés et vous motiver. Cliquez sur l\'icône de chat flottante pour l\'utiliser.',
      icon: MessageCircle,
      category: 'features',
      keywords: ['chatbot', 'ia', 'assistant', 'aide', 'conseil']
    },
    
    // Tips
    {
      id: 'study_tips',
      title: 'Conseils d\'apprentissage',
      description: 'Optimisez votre formation',
      content: 'Planifiez des sessions d\'étude régulières, prenez des notes pendant les modules, pratiquez avec les simulations, et n\'hésitez pas à revoir le contenu plusieurs fois.',
      icon: BookOpen,
      category: 'tips',
      keywords: ['conseils', 'apprentissage', 'étude', 'optimisation', 'méthode']
    },
    {
      id: 'community_tips',
      title: 'Participer à la communauté',
      description: 'Maximisez vos interactions',
      content: 'Soyez actif sur le forum, posez des questions, partagez vos créations, aidez les autres membres. Plus vous participez, plus vous apprenez et progressez rapidement.',
      icon: Users,
      category: 'tips',
      keywords: ['communauté', 'participation', 'interaction', 'partage', 'entraide']
    }
  ];

  const categories = [
    { id: 'getting_started', name: 'Premiers pas', icon: Play },
    { id: 'navigation', name: 'Navigation', icon: Home },
    { id: 'features', name: 'Fonctionnalités', icon: Trophy },
    { id: 'tips', name: 'Conseils', icon: Target }
  ];

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSteps(guideSteps.filter(step => step.category === currentCategory));
    } else {
      setFilteredSteps(
        guideSteps.filter(step =>
          step.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          step.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          step.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      );
    }
    setCurrentStep(0);
  }, [currentCategory, searchQuery]);

  // Marquer la step actuelle comme visitée
  useEffect(() => {
    if (filteredSteps[currentStep]) {
      const stepId = filteredSteps[currentStep].id;
      setVisitedSteps(prev => new Set([...Array.from(prev), stepId]));
      
      // Vérifier si toutes les étapes de la catégorie ont été visitées
      const categorySteps = guideSteps.filter(step => step.category === currentCategory);
      const allVisited = categorySteps.every(step => visitedSteps.has(step.id) || step.id === stepId);
      
      if (allVisited) {
        setCompletedCategories(prev => new Set([...Array.from(prev), currentCategory]));
      }
    }
  }, [currentStep, filteredSteps, currentCategory]);

  // Fonction pour vérifier si une catégorie peut être accédée
  const canAccessCategory = (categoryId: string) => {
    const categoryOrder = ['getting_started', 'navigation', 'features', 'tips'];
    const currentIndex = categoryOrder.indexOf(categoryId);
    const currentCategoryIndex = categoryOrder.indexOf(currentCategory);
    
    // Si on est en mode recherche, tout est accessible
    if (searchQuery.trim() !== '') return true;
    
    // La première catégorie est toujours accessible
    if (currentIndex === 0) return true;
    
    // Les autres catégories ne sont accessibles que si la précédente est complétée
    for (let i = 0; i < currentIndex; i++) {
      if (!completedCategories.has(categoryOrder[i])) {
        return false;
      }
    }
    
    return true;
  };

  const nextStep = () => {
    if (currentStep < filteredSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  const currentStepData = filteredSteps[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-5xl max-h-[90vh] mx-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl shadow-2xl border border-purple-500/20 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-600 rounded-lg">
                <HelpCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Guide d'utilisation</h2>
                <p className="text-purple-200 text-sm">Apprenez à utiliser Easy Packs efficacement</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-purple-200 hover:text-white hover:bg-purple-600/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex h-[calc(90vh-140px)]">
            {/* Sidebar */}
            <div className="w-1/3 border-r border-purple-500/20 p-4 overflow-y-auto">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-300" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800 border-purple-500/30 text-white placeholder:text-purple-300"
                />
              </div>

              {/* Categories */}
              {searchQuery.trim() === '' && (
                <div className="space-y-2 mb-4">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    const isAccessible = canAccessCategory(category.id);
                    const isCompleted = completedCategories.has(category.id);
                    
                    return (
                      <button
                        key={category.id}
                        onClick={() => isAccessible && setCurrentCategory(category.id)}
                        disabled={!isAccessible}
                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                          currentCategory === category.id
                            ? 'bg-purple-600 text-white'
                            : isAccessible
                            ? 'bg-slate-800/50 text-purple-200 hover:bg-slate-700'
                            : 'bg-slate-800/20 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {isCompleted && (
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          )}
                          {!isAccessible && (
                            <div className="w-4 h-4 bg-slate-600 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Steps List */}
              <div className="space-y-2">
                {filteredSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <button
                      key={step.id}
                      onClick={() => setCurrentStep(index)}
                      className={`w-full flex items-start space-x-3 p-3 rounded-lg transition-colors text-left ${
                        currentStep === index
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-800/30 text-purple-200 hover:bg-slate-700/50'
                      }`}
                    >
                      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-sm">{step.title}</div>
                        <div className="text-xs opacity-75">{step.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-8 overflow-y-auto">
              {currentStepData ? (
                <motion.div
                  key={currentStep}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-4xl"
                >
                  <div className="flex items-start space-x-4 mb-8">
                    <div className="p-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg">
                      <currentStepData.icon className="w-10 h-10 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-3xl font-bold text-white mb-2">{currentStepData.title}</h3>
                      <p className="text-purple-200 text-lg">{currentStepData.description}</p>
                    </div>
                  </div>

                  <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-purple-500/10">
                    <p className="text-purple-100 text-lg leading-relaxed mb-6">
                      {currentStepData.content}
                    </p>
                    
                    {/* Ajout d'une liste de conseils spécifiques selon la catégorie */}
                    {currentStepData.category === 'tips' && (
                      <div className="bg-purple-900/30 rounded-lg p-4 border-l-4 border-purple-400">
                        <h4 className="text-purple-200 font-semibold mb-2">💡 Conseil supplémentaire :</h4>
                        <p className="text-purple-100 text-sm">
                          {currentStepData.id === 'study_tips' 
                            ? "Créez un planning d'étude personnalisé et respectez-le. La régularité est la clé du succès !"
                            : "Engagez-vous authentiquement avec la communauté. Vos contributions sincères seront valorisées !"
                          }
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Navigation améliorée */}
                  <div className="flex items-center justify-between mt-10 pt-6 border-t border-purple-500/20">
                    <Button
                      variant="ghost"
                      onClick={prevStep}
                      disabled={currentStep === 0}
                      className="text-purple-200 hover:text-white hover:bg-purple-600/20 disabled:opacity-50 px-6 py-3"
                    >
                      <ChevronLeft className="w-5 h-5 mr-2" />
                      Précédent
                    </Button>

                    <div className="flex items-center space-x-2">
                      <span className="text-purple-300 text-sm font-medium">
                        {currentStep + 1} / {filteredSteps.length}
                      </span>
                      <div className="flex space-x-1">
                        {filteredSteps.map((_, index) => (
                          <div
                            key={index}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index === currentStep ? 'bg-purple-400' : 'bg-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      onClick={nextStep}
                      disabled={currentStep === filteredSteps.length - 1}
                      className="text-purple-200 hover:text-white hover:bg-purple-600/20 disabled:opacity-50 px-6 py-3"
                    >
                      Suivant
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-purple-300 bg-slate-800/30 rounded-xl p-8">
                    <Search className="w-20 h-20 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">Aucun résultat trouvé</h3>
                    <p>Aucun guide ne correspond à "{searchQuery}"</p>
                    <p className="text-sm mt-2 opacity-75">Essayez avec d'autres mots-clés</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Bouton flottant pour ouvrir le guide
export function GuideButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      size="sm"
      className="fixed bottom-20 right-4 z-40 bg-purple-600 hover:bg-purple-700 text-white shadow-lg rounded-full p-3"
    >
      <HelpCircle className="w-5 h-5" />
    </Button>
  );
}