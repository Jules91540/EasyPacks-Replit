import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface MentionNotification {
  id: string;
  message: string;
  author: string;
  topicTitle: string;
  timestamp: Date;
  topicId: string;
}

interface MentionNotificationProps {
  notifications: MentionNotification[];
  onDismiss: (id: string) => void;
  onNavigate: (topicId: string) => void;
}

export default function MentionNotificationPopup({ 
  notifications, 
  onDismiss, 
  onNavigate 
}: MentionNotificationProps) {
  const [visibleNotifications, setVisibleNotifications] = useState<MentionNotification[]>([]);

  useEffect(() => {
    // Afficher les nouvelles notifications avec animation
    notifications.forEach((notification, index) => {
      setTimeout(() => {
        setVisibleNotifications(prev => {
          if (!prev.find(n => n.id === notification.id)) {
            return [...prev, notification];
          }
          return prev;
        });
        
        // Auto-dismiss après 10 secondes
        setTimeout(() => {
          handleDismiss(notification.id);
        }, 10000);
      }, index * 500);
    });
  }, [notifications]);

  const handleDismiss = (id: string) => {
    setVisibleNotifications(prev => prev.filter(n => n.id !== id));
    onDismiss(id);
  };

  const handleClick = (notification: MentionNotification) => {
    onNavigate(notification.topicId);
    handleDismiss(notification.id);
  };

  if (visibleNotifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {visibleNotifications.map((notification) => (
        <Card 
          key={notification.id}
          className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 shadow-lg transform transition-all duration-300 ease-out animate-in slide-in-from-right cursor-pointer hover:scale-105"
          onClick={() => handleClick(notification)}
        >
          <CardContent className="p-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-4 w-4 text-yellow-300" />
                <span className="font-semibold text-sm">Vous avez été mentionné</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-white/70 hover:text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss(notification.id);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Par <span className="text-yellow-300">{notification.author}</span>
              </p>
              <p className="text-xs text-white/80">
                Dans "{notification.topicTitle}"
              </p>
              <p className="text-sm mt-2 line-clamp-2">
                {notification.message}
              </p>
              <p className="text-xs text-white/60 mt-2">
                {notification.timestamp.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Hook pour gérer les mentions
export function useMentionNotifications() {
  const [notifications, setNotifications] = useState<MentionNotification[]>([]);

  const addNotification = (notification: Omit<MentionNotification, 'id'>) => {
    const newNotification: MentionNotification = {
      ...notification,
      id: Date.now().toString()
    };
    setNotifications(prev => [...prev, newNotification]);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAll
  };
}