import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Play, Lock, PlayCircle, Clock, Download } from "lucide-react";
import { Module } from "@shared/schema";

interface ModuleCardProps {
  module: Module;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  onStartQuiz?: (quiz: any) => void;
}

export default function ModuleCard({ module, status, progress, onStartQuiz }: ModuleCardProps) {
  const getStatusInfo = () => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle,
          badge: { text: 'Terminé', variant: 'default' as const, className: 'bg-green-100 text-green-700' },
          button: { text: 'Revoir', variant: 'outline' as const }
        };
      case 'in_progress':
        return {
          icon: Play,
          badge: { text: 'En cours', variant: 'default' as const, className: 'bg-blue-100 text-blue-700' },
          button: { text: 'Continuer', variant: 'default' as const }
        };
      default:
        return {
          icon: Lock,
          badge: { text: 'Verrouillé', variant: 'secondary' as const, className: 'bg-gray-100 text-gray-600' },
          button: { text: 'Verrouillé', variant: 'secondary' as const, disabled: true }
        };
    }
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  const handleButtonClick = () => {
    if (status === 'not_started' || status === 'in_progress') {
      // Start quiz if available
      if (onStartQuiz) {
        // Mock quiz data - in real app this would fetch the actual quiz
        const mockQuiz = {
          id: 1,
          title: `Quiz : ${module.title}`,
          questions: [
            {
              id: 1,
              question: "Quelle est la résolution recommandée pour le streaming ?",
              options: ["720p", "1080p", "4K", "480p"],
              correct: 1
            }
          ]
        };
        onStartQuiz(mockQuiz);
      }
    }
  };

  return (
    <Card className="gradient-card module-card">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-3">
              <div className={`${statusInfo.badge.className} w-8 h-8 rounded-full flex items-center justify-center mr-3`}>
                <Icon className="h-4 w-4" />
              </div>
              <Badge className={statusInfo.badge.className}>
                {statusInfo.badge.text}
              </Badge>
            </div>
            
            <h4 className="text-lg font-semibold text-gray-800 mb-2 heading-french">
              {module.title}
            </h4>
            <p className="text-gray-600 text-sm mb-4 subtitle-french">
              {module.description}
            </p>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
              {module.videoUrl && (
                <span className="flex items-center">
                  <PlayCircle className="mr-1 h-4 w-4" /> 1 vidéo
                </span>
              )}
              <span className="flex items-center">
                <Clock className="mr-1 h-4 w-4" /> 2h 30min
              </span>
              {module.downloadFiles && module.downloadFiles.length > 0 && (
                <span className="flex items-center">
                  <Download className="mr-1 h-4 w-4" /> {module.downloadFiles.length} fichiers
                </span>
              )}
            </div>
            
            {status === 'in_progress' && (
              <div className="mb-3">
                <div className="bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">{progress}% terminé</p>
              </div>
            )}
          </div>
          
          <Button
            onClick={handleButtonClick}
            variant={statusInfo.button.variant}
            disabled={statusInfo.button.disabled}
            className="ml-4"
          >
            {statusInfo.button.text}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
