import { useState, useEffect } from "react";
import { Phone, PhoneOff, Video, VideoOff, Monitor, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface IncomingCallPopupProps {
  isVisible: boolean;
  caller: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
}

export function IncomingCallPopup({ 
  isVisible, 
  caller, 
  onAccept, 
  onReject, 
  onClose 
}: IncomingCallPopupProps) {
  const [isRinging, setIsRinging] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsRinging(true);
      const interval = setInterval(() => {
        setIsRinging(prev => !prev);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 border-2 border-blue-500 shadow-2xl animate-pulse">
        <CardContent className="p-8">
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-4 right-4 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Caller info */}
          <div className="text-center mb-8">
            <div className="relative mb-4">
              <Avatar className={`w-24 h-24 mx-auto border-4 ${isRinging ? 'border-green-400' : 'border-blue-400'} transition-colors duration-300`}>
                <AvatarImage src={caller.profileImageUrl} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-400 to-purple-600 text-white">
                  {caller.firstName?.[0]}{caller.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <Badge 
                variant="secondary" 
                className={`absolute -top-2 -right-2 ${isRinging ? 'bg-green-500 animate-bounce' : 'bg-blue-500'} text-white`}
              >
                <Phone className="h-3 w-3 mr-1" />
                Appel
              </Badge>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {caller.firstName} {caller.lastName}
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              Appel entrant...
            </p>
            
            {/* Pulsing ring animation */}
            <div className="relative flex justify-center mb-6">
              <div className={`absolute w-32 h-32 rounded-full border-2 border-green-400 animate-ping ${isRinging ? 'opacity-75' : 'opacity-25'}`}></div>
              <div className={`absolute w-24 h-24 rounded-full border-2 border-green-300 animate-ping delay-75 ${isRinging ? 'opacity-50' : 'opacity-0'}`}></div>
              <div className={`absolute w-16 h-16 rounded-full border-2 border-green-200 animate-ping delay-150 ${isRinging ? 'opacity-25' : 'opacity-0'}`}></div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-center space-x-6">
            <Button
              onClick={onReject}
              size="lg"
              variant="destructive"
              className="rounded-full w-16 h-16 p-0 bg-red-500 hover:bg-red-600 border-2 border-red-600 hover:border-red-700 shadow-lg"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
            
            <Button
              onClick={onAccept}
              size="lg"
              className="rounded-full w-16 h-16 p-0 bg-green-500 hover:bg-green-600 border-2 border-green-600 hover:border-green-700 shadow-lg text-white"
            >
              <Phone className="h-6 w-6" />
            </Button>
          </div>

          {/* Call controls preview */}
          <div className="flex justify-center space-x-4 mt-6 opacity-50">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Video className="h-4 w-4 mr-1" />
              Vidéo
            </div>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Monitor className="h-4 w-4 mr-1" />
              Partage d'écran
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}