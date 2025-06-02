import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserPlus, UserMinus, Phone, Video, MessageCircle } from "lucide-react";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string;
  level?: number;
  xp?: number;
}

interface UserProfileProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  friends?: User[];
  onAddFriend?: (userId: string) => void;
  onRemoveFriend?: (userId: string) => void;
  onStartCall?: (userId: string) => void;
  onStartVideoCall?: (userId: string) => void;
  onStartMessage?: (userId: string) => void;
}

export function UserProfile({ 
  user, 
  isOpen, 
  onClose, 
  currentUserId, 
  friends = [],
  onAddFriend,
  onRemoveFriend,
  onStartCall,
  onStartVideoCall,
  onStartMessage
}: UserProfileProps) {
  if (!user) return null;

  const isFriend = friends.some(friend => friend.id === user.id);
  const isOwnProfile = currentUserId === user.id;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Profil utilisateur</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="w-24 h-24">
            <AvatarImage src={user.profileImageUrl} alt={`${user.firstName} ${user.lastName}`} />
            <AvatarFallback className="text-xl">
              {user.firstName[0]}{user.lastName[0]}
            </AvatarFallback>
          </Avatar>
          
          <div className="text-center">
            <h3 className="text-xl font-semibold">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-muted-foreground">{user.email}</p>
          </div>

          {user.level && user.xp && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">Niveau {user.level}</Badge>
              <Badge variant="outline">{user.xp} XP</Badge>
            </div>
          )}

          {!isOwnProfile && (
            <div className="flex flex-wrap gap-2 justify-center">
              {isFriend ? (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onRemoveFriend?.(user.id)}
                  >
                    <UserMinus className="w-4 h-4 mr-2" />
                    Retirer ami
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onStartCall?.(user.id)}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Appeler
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onStartVideoCall?.(user.id)}
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Vidéo
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onStartMessage?.(user.id)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => onAddFriend?.(user.id)}
                  size="sm"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Ajouter ami
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}