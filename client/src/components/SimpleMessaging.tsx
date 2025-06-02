import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Phone, Video } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string;
}

interface Message {
  id: number;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  sender?: User;
}

interface Conversation {
  id: number;
  participant1Id: string;
  participant2Id: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  participant?: User;
}

export default function SimpleMessaging() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");

  // Fetch conversations
  const { data: conversations = [] } = useQuery({
    queryKey: ['/api/conversations'],
    refetchInterval: 2000,
  });

  // Fetch friends
  const { data: friends = [] } = useQuery({
    queryKey: ['/api/friends'],
  });

  // Fetch messages for selected conversation
  const { data: messages = [] } = useQuery({
    queryKey: selectedConversation 
      ? ['/api/messages', selectedConversation.participant1Id, selectedConversation.participant2Id]
      : ['no-conversation'],
    enabled: !!selectedConversation,
    refetchInterval: 1000,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { receiverId: string; content: string }) => {
      return apiRequest('/api/messages', 'POST', data);
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      if (selectedConversation) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/messages', selectedConversation.participant1Id, selectedConversation.participant2Id] 
        });
      }
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;
    
    const receiverId = selectedConversation.participant1Id === user.id 
      ? selectedConversation.participant2Id 
      : selectedConversation.participant1Id;

    sendMessageMutation.mutate({
      receiverId,
      content: newMessage.trim(),
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const startConversationWithFriend = (friend: User) => {
    // Create a temporary conversation object
    const tempConversation: Conversation = {
      id: 0,
      participant1Id: user?.id || "",
      participant2Id: friend.id,
      lastMessage: "",
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
      participant: friend,
    };
    setSelectedConversation(tempConversation);
  };

  return (
    <div className="flex h-[600px] bg-gray-900 rounded-lg overflow-hidden">
      {/* Sidebar - Conversations */}
      <div className="w-1/3 bg-gray-800 border-r border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Messages</h2>
        </div>
        
        <ScrollArea className="h-full">
          {/* Existing conversations */}
          {conversations && Array.isArray(conversations) && conversations.map((conv: any) => (
            <div
              key={`conv-${conv.id}`}
              onClick={() => setSelectedConversation(conv)}
              className={`flex items-center p-3 cursor-pointer hover:bg-gray-700 ${
                selectedConversation?.id === conv.id ? 'bg-gray-700' : ''
              }`}
            >
              <Avatar className="w-12 h-12 mr-3">
                <AvatarImage src={conv.participant?.profileImageUrl} />
                <AvatarFallback className="bg-blue-600 text-white">
                  {conv.participant?.firstName?.[0]}{conv.participant?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-white">
                    {conv.participant?.firstName} {conv.participant?.lastName}
                  </h3>
                  <span className="text-xs text-gray-400">
                    {formatTime(conv.lastMessageAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-400 truncate">
                  {conv.lastMessage || "Nouvelle conversation"}
                </p>
              </div>
            </div>
          ))}
          
          {/* Friends without conversations */}
          {friends && Array.isArray(friends) && friends
            .filter((friend: any) => 
              !conversations || !conversations.some((conv: any) => 
                conv.participant?.id === friend.id
              )
            )
            .map((friend: any) => (
              <div
                key={`friend-${friend.id}`}
                onClick={() => startConversationWithFriend(friend)}
                className="flex items-center p-3 cursor-pointer hover:bg-gray-700"
              >
                <Avatar className="w-12 h-12 mr-3">
                  <AvatarImage src={friend.profileImageUrl} />
                  <AvatarFallback className="bg-green-600 text-white">
                    {friend.firstName?.[0]}{friend.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-medium text-white">
                    {friend.firstName} {friend.lastName}
                  </h3>
                  <p className="text-sm text-green-400">Démarrer une conversation</p>
                </div>
              </div>
            ))}
        </ScrollArea>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat header */}
            <div className="p-4 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center">
                <Avatar className="w-10 h-10 mr-3">
                  <AvatarImage src={selectedConversation.participant?.profileImageUrl} />
                  <AvatarFallback className="bg-blue-600 text-white">
                    {selectedConversation.participant?.firstName?.[0]}{selectedConversation.participant?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-white font-semibold">
                    {selectedConversation.participant?.firstName} {selectedConversation.participant?.lastName}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {selectedConversation.lastMessageAt && messages.length > 0 ? 
                      `Dernier message: ${formatTime(selectedConversation.lastMessageAt)}` : 
                      'En ligne'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" className="text-white">
                  <Phone className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-white">
                  <Video className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Messages area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages && Array.isArray(messages) && messages.length > 0 ? (
                  messages.map((message: any) => {
                    const isOwnMessage = message.senderId === user?.id;
                    
                    return (
                      <div
                        key={`msg-${message.id}`}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isOwnMessage
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 text-white'
                          }`}
                        >
                          <p>{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            isOwnMessage ? 'text-blue-200' : 'text-gray-400'
                          }`}>
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">Aucun message encore. Commencez la conversation !</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Message input */}
            <div className="p-4 bg-gray-800 border-t border-gray-700">
              <div className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez votre message..."
                  className="flex-1 bg-gray-700 border-gray-600 text-white"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
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
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">
                Sélectionnez une conversation
              </h3>
              <p className="text-gray-400">
                Choisissez une conversation existante ou commencez-en une nouvelle
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}