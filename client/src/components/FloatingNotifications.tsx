import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, MessageSquare, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Notification {
  id: number;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  relatedUser?: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
}

export function FloatingNotifications() {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch social notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications/social"],
    retry: false,
  });

  // Fetch friend requests
  const { data: friendRequests = [] } = useQuery({
    queryKey: ["/api/friends/requests/pending"],
    retry: false,
  });

  // Fetch unread messages count
  const { data: messages = [] } = useQuery({
    queryKey: ["/api/conversations"],
    retry: false,
  });

  const unreadCount = (notifications?.filter?.((n: Notification) => !n.isRead)?.length || 0) + 
                     (friendRequests?.length || 0);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "friend_request":
        return <UserPlus className="w-4 h-4 text-blue-400" />;
      case "message":
        return <MessageSquare className="w-4 h-4 text-green-400" />;
      default:
        return <Bell className="w-4 h-4 text-white" />;
    }
  };

  if (unreadCount === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating notification button */}
      <Button
        size="lg"
        className="rounded-full w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2 bg-red-500 text-white min-w-6 h-6 flex items-center justify-center text-xs">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notifications panel */}
      {isOpen && (
        <Card className="absolute bottom-16 right-0 w-80 max-h-96 bg-gray-900/95 backdrop-blur-sm border-gray-700 shadow-xl">
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="font-semibold text-white">Notifications</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {/* Friend requests */}
              {friendRequests?.map?.((request: any) => (
                <div
                  key={`friend-${request.id}`}
                  className="p-4 border-b border-gray-700/50 hover:bg-gray-800/50"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={request.sender?.profileImageUrl} />
                      <AvatarFallback className="text-xs">
                        {request.sender?.firstName?.[0]}{request.sender?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <UserPlus className="w-4 h-4 text-blue-400" />
                        <p className="text-sm font-medium text-white">Demande d'ami</p>
                      </div>
                      <p className="text-xs text-white/70">
                        {request.sender?.firstName} {request.sender?.lastName}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Social notifications */}
              {notifications?.map?.((notification: Notification) => (
                <div
                  key={`notif-${notification.id}`}
                  className={`p-4 border-b border-gray-700/50 hover:bg-gray-800/50 ${
                    !notification.isRead ? "bg-blue-900/20" : ""
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {notification.title}
                      </p>
                      <p className="text-xs text-white/70 mt-1">
                        {notification.content}
                      </p>
                      <p className="text-xs text-white/50 mt-2">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    )}
                  </div>
                </div>
              ))}

              {notifications?.length === 0 && friendRequests?.length === 0 && (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50 text-white" />
                  <p className="text-white/70">Aucune notification</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}