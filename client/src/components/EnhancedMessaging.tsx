import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  Send, 
  Phone, 
  Video, 
  MoreHorizontal,
  Check,
  CheckCheck
} from "lucide-react";

interface Message {
  id: number;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

interface Conversation {
  id: number;
  participant1Id: string;
  participant2Id: string;
  participant: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    profileImageUrl: string | null;
  };
}

interface EnhancedMessagingProps {
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
}

export default function EnhancedMessaging({ selectedConversation, onSelectConversation }: EnhancedMessagingProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversations = [] } = useQuery({
    queryKey: ["/api/conversations"],
  });

  // Fetch messages for selected conversation
  const { data: messages = [] } = useQuery({
    queryKey: ["/api/messages", selectedConversation?.participant.id],
    enabled: !!selectedConversation,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { receiverId: string; content: string }) => {
      return apiRequest(`/api/messages`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  // Mark messages as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      return apiRequest(`/api/messages/${messageId}/read`, {
        method: "PATCH",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversation && messages.length > 0) {
      const unreadMessages = messages.filter((msg: Message) => 
        !msg.isRead && msg.senderId !== user?.id
      );
      unreadMessages.forEach((msg: Message) => {
        markAsReadMutation.mutate(msg.id);
      });
    }
  }, [selectedConversation, messages, user?.id]);

  // Handle typing indicator
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isTyping) {
      timeout = setTimeout(() => setIsTyping(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [isTyping]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    sendMessageMutation.mutate({
      receiverId: selectedConversation.participant.id,
      content: newMessage.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (!isTyping) {
      setIsTyping(true);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMessageStatus = (message: Message) => {
    if (message.senderId !== user?.id) return null;
    
    if (message.isRead) {
      return <CheckCheck className="w-4 h-4 text-blue-500" />;
    }
    return <Check className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="flex h-full">
      {/* Conversations List */}
      <div className="w-80 border-r border-gray-700 bg-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white">Messages</CardTitle>
        </CardHeader>
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="p-4 space-y-2">
            {conversations.map((conv: Conversation) => {
              const isSelected = selectedConversation?.id === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => onSelectConversation(conv)}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? "bg-blue-600" 
                      : "bg-slate-700 hover:bg-slate-600"
                  }`}
                >
                  <Avatar className="h-12 w-12 mr-3">
                    <AvatarImage src={conv.participant.profileImageUrl || ""} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                      {conv.participant.firstName?.charAt(0) || conv.participant.email?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-white truncate">
                        {conv.participant.firstName && conv.participant.lastName
                          ? `${conv.participant.firstName} ${conv.participant.lastName}`
                          : conv.participant.email}
                      </p>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-400 truncate">
                        Dernière activité
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="border-b border-gray-700 p-4 bg-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={selectedConversation.participant.profileImageUrl || ""} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                      {selectedConversation.participant.firstName?.charAt(0) || 
                       selectedConversation.participant.email?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-white">
                      {selectedConversation.participant.firstName && selectedConversation.participant.lastName
                        ? `${selectedConversation.participant.firstName} ${selectedConversation.participant.lastName}`
                        : selectedConversation.participant.email}
                    </h3>
                    {otherUserTyping && (
                      <p className="text-xs text-blue-400">En train d'écrire...</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message: Message) => {
                  const isOwnMessage = message.senderId === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isOwnMessage
                            ? "bg-blue-600 text-white"
                            : "bg-slate-700 text-white"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className={`flex items-center mt-1 ${
                          isOwnMessage ? "justify-end" : "justify-start"
                        }`}>
                          <span className="text-xs opacity-70">
                            {formatTime(message.createdAt)}
                          </span>
                          {isOwnMessage && (
                            <span className="ml-1">
                              {getMessageStatus(message)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t border-gray-700 p-4 bg-slate-800">
              <div className="flex space-x-3">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Tapez votre message..."
                  className="flex-1 bg-slate-700 border-slate-600 text-white"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-900">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-700 rounded-full flex items-center justify-center">
                <Send className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                Sélectionnez une conversation
              </h3>
              <p className="text-gray-400">
                Choisissez une conversation pour commencer à discuter
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}