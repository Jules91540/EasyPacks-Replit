import { useState } from "react";
import { Heart, Smile, ThumbsUp, MessageCircle, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface MessageWithReactionsProps {
  message: {
    id: number;
    content: string;
    createdAt: string;
    sender?: {
      id: string;
      firstName: string;
      lastName: string;
      profileImageUrl?: string;
    };
  };
  currentUserId?: string;
  onReact?: (messageId: number, emoji: string) => void;
  onMention?: (userId: string) => void;
}

const EMOJI_REACTIONS = [
  { emoji: "❤️", label: "J'aime" },
  { emoji: "😂", label: "Drôle" },
  { emoji: "😮", label: "Surpris" },
  { emoji: "😢", label: "Triste" },
  { emoji: "👍", label: "Pouce en l'air" },
  { emoji: "👎", label: "Pouce en bas" }
];

export function MessageWithReactions({ 
  message, 
  currentUserId, 
  onReact, 
  onMention 
}: MessageWithReactionsProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [reactions, setReactions] = useState<{[emoji: string]: {count: number, users: string[]}}>();

  const isOwnMessage = message.sender?.id === currentUserId;

  const handleReaction = (emoji: string) => {
    if (onReact) {
      onReact(message.id, emoji);
    }
    setShowReactions(false);
  };

  const handleMention = () => {
    if (message.sender?.id && onMention) {
      onMention(message.sender.id);
    }
  };

  // Parse mentions in message content
  const renderMessageContent = (content: string) => {
    const mentionRegex = /@(\w+)/g;
    const parts = content.split(mentionRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is a mention
        return (
          <Badge 
            key={index}
            variant="secondary" 
            className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mx-1"
          >
            @{part}
          </Badge>
        );
      }
      return part;
    });
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-[70%]`}>
        {!isOwnMessage && (
          <Avatar className="w-8 h-8">
            <AvatarImage src={message.sender?.profileImageUrl} />
            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-600 text-white text-xs">
              {message.sender?.firstName?.[0]}{message.sender?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={`relative ${isOwnMessage ? 'mr-2' : 'ml-2'}`}>
          <div 
            className={`p-3 rounded-2xl shadow-sm ${
              isOwnMessage 
                ? 'bg-blue-500 text-white rounded-br-md' 
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-bl-md'
            }`}
          >
            {!isOwnMessage && (
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                {message.sender?.firstName} {message.sender?.lastName}
              </p>
            )}
            
            <p className={`${isOwnMessage ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
              {renderMessageContent(message.content)}
            </p>
            
            <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
              {formatDistanceToNow(new Date(message.createdAt), { 
                addSuffix: true, 
                locale: fr 
              })}
            </p>
          </div>

          {/* Reactions */}
          {reactions && Object.keys(reactions).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(reactions).map(([emoji, data]) => (
                <Badge 
                  key={emoji}
                  variant="outline" 
                  className="text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleReaction(emoji)}
                >
                  {emoji} {data.count}
                </Badge>
              ))}
            </div>
          )}

          {/* Message actions */}
          <div className={`absolute ${isOwnMessage ? 'left-0' : 'right-0'} top-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
            <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-full p-1">
              {/* Reaction button */}
              <DropdownMenu open={showReactions} onOpenChange={setShowReactions}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Smile className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <div className="grid grid-cols-3 gap-1 p-2">
                    {EMOJI_REACTIONS.map(({ emoji, label }) => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => handleReaction(emoji)}
                        title={label}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mention button */}
              {!isOwnMessage && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={handleMention}
                  title="Mentionner"
                >
                  <MessageCircle className="h-3 w-3" />
                </Button>
              )}

              {/* More options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Répondre</DropdownMenuItem>
                  <DropdownMenuItem>Transférer</DropdownMenuItem>
                  {isOwnMessage && (
                    <>
                      <DropdownMenuItem>Modifier</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Supprimer</DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}