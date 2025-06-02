import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft, BookOpen, Users, Trophy, MessageCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  icon: any;
  features: string[];
}

export default function WelcomeTutorial({ isOpen, onClose, userName }: WelcomeTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps: TutorialStep[] = [
    {
      id: 1,
      title: "Bienvenue sur Easy Packs !",
      description: `Salut ${userName} ! Nous sommes ravis de t'accueillir dans ta nouvelle plateforme de formation pour créateurs de contenu.`,
      icon: Play,
      features: [
        "Formation complète sur toutes les plateformes",
        "Communauté active et bienveillante", 
        "Outils d'apprentissage gamifiés",
        "Support personnalisé"
      ]
    },
    {
      id: 2,
      title: "Modules de Formation",
      description: "Découvre nos modules spécialisés pour chaque plateforme sociale.",
      icon: BookOpen,
      features: [
        "Twitch : Streaming et interaction live",
        "YouTube : Création et montage vidéo",
        "Instagram : Photos et stories créatives",
        "TikTok : Tendances et contenu viral",
        "X (Twitter) : Engagement et influence"
      ]
    },
    {
      id: 3,
      title: "Forum Communautaire", 
      description: "Échange avec d'autres créateurs dans notre forum style Instagram.",
      icon: Users,
      features: [
        "Messages en temps réel",
        "Partage d'expériences",
        "Conseils entre créateurs",
        "Notifications instantanées",
        "Réactions et interactions"
      ]
    },
    {
      id: 4,
      title: "Assistant IA Intelligent",
      description: "Notre chatbot IA t'accompagne à chaque étape de ton apprentissage.",
      icon: MessageCircle,
      features: [
        "Conseils personnalisés",
        "Réponses instantanées",
        "Simulations d'audience",
        "Motivation quotidienne",
        "Disponible 24h/24"
      ]
    },
    {
      id: 5,
      title: "Système de Récompenses",
      description: "Gagne des XP, monte de niveau et débloque des badges.",
      icon: Trophy,
      features: [
        "Points d'expérience (XP)",
        "Niveaux et progressions",
        "Badges de réussite",
        "Classements communautaires",
        "Récompenses exclusives"
      ]
    }
  ];

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const finishTutorial = () => {
    onClose();
    // Marquer le tutoriel comme terminé dans localStorage
    localStorage.setItem('welcomeTutorialCompleted', 'true');
  };

  if (!isOpen) return null;

  const step = tutorialSteps[currentStep];
  const Icon = step.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-2xl mx-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl shadow-2xl border border-purple-500/20"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-600 rounded-lg">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{step.title}</h2>
                <p className="text-purple-200 text-sm">
                  Étape {currentStep + 1} sur {tutorialSteps.length}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={finishTutorial}
              className="text-purple-200 hover:text-white hover:bg-purple-600/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6">
            <motion.div
              key={currentStep}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-purple-100 text-lg mb-6 leading-relaxed">
                {step.description}
              </p>

              <div className="space-y-3">
                <h3 className="text-white font-semibold mb-3">Fonctionnalités principales :</h3>
                {step.features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-3"
                  >
                    <div className="w-2 h-2 bg-purple-400 rounded-full" />
                    <span className="text-purple-100">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Progress Bar */}
          <div className="px-6 pb-2">
            <div className="w-full bg-slate-700 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-purple-500/20">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="text-purple-200 hover:text-white hover:bg-purple-600/20 disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Précédent
            </Button>

            <div className="flex space-x-1">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep ? 'bg-purple-400' : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>

            {currentStep < tutorialSteps.length - 1 ? (
              <Button
                onClick={nextStep}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Suivant
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={finishTutorial}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                Commencer l'aventure !
                <Play className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}