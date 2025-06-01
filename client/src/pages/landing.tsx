import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Star, Users, BookOpen } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-4 shadow-2xl">
        <CardContent className="pt-8 pb-8 px-8">
          <div className="text-center mb-8">
            <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 heading-french">
              Créateur Academy
            </h1>
            <p className="text-gray-600 mt-2 subtitle-french">
              Votre formation complète pour devenir créateur de contenu
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <div className="bg-green-100 text-green-600 w-8 h-8 rounded-full flex items-center justify-center">
                <BookOpen className="h-4 w-4" />
              </div>
              <span>Modules de formation sur Twitch, YouTube, Instagram, TikTok et X</span>
            </div>
            
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <div className="bg-purple-100 text-purple-600 w-8 h-8 rounded-full flex items-center justify-center">
                <Star className="h-4 w-4" />
              </div>
              <span>Système de gamification avec XP et niveaux</span>
            </div>
            
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <div className="bg-blue-100 text-primary w-8 h-8 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
              <span>Quiz interactifs et simulations pratiques</span>
            </div>
          </div>

          <Button 
            onClick={handleLogin} 
            className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Se connecter avec Replit
          </Button>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Plateforme sécurisée d'apprentissage en ligne
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
