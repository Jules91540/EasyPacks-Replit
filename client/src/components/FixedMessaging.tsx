import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Phone, Video, Smile, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function FixedMessaging() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Available emoji reactions
  const availableEmojis = ['❤️', '😂', '😢', '😡', '👍', '👎', '😮', '🎉'];

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
      ? ['/api/messages', { 
          participant1Id: selectedConversation.participant1Id, 
          participant2Id: selectedConversation.participant2Id 
        }]
      : ['no-conversation'],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const params = new URLSearchParams({
        participant1Id: selectedConversation.participant1Id,
        participant2Id: selectedConversation.participant2Id
      });
      const response = await fetch(`/api/messages?${params}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    enabled: !!selectedConversation,
    refetchInterval: 1000,
  });

  // Function to scroll to bottom with better positioning
  const scrollToBottom = (force = false) => {
    if (messagesEndRef.current) {
      const scrollContainer = messagesEndRef.current.closest('.overflow-auto') || messagesEndRef.current.parentElement?.parentElement;
      if (scrollContainer && (force || isUserNearBottom(scrollContainer))) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: "smooth",
          block: "end",
          inline: "nearest"
        });
      }
    }
  };

  // Check if user is near the bottom of the chat
  const isUserNearBottom = (container: Element) => {
    const threshold = 150; // pixels from bottom
    return container.scrollTop + container.clientHeight >= container.scrollHeight - threshold;
  };

  // Auto-scroll when messages change (only if we're near the bottom)
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    if (selectedConversation) {
      setTimeout(() => {
        scrollToBottom(true); // Force scroll when changing conversation
      }, 200);
    }
  }, [selectedConversation]);

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
      // Scroll to bottom after sending message
      setTimeout(() => {
        scrollToBottom(true); // Force scroll when sending message
      }, 200);
    },
  });

  // Message reaction mutations
  const addReactionMutation = useMutation({
    mutationFn: async (data: { messageId: number; emoji: string }) => {
      return apiRequest('/api/messages/reactions', 'POST', data);
    },
    onSuccess: () => {
      if (selectedConversation) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/messages', selectedConversation.participant1Id, selectedConversation.participant2Id] 
        });
      }
    },
  });

  const removeReactionMutation = useMutation({
    mutationFn: async (data: { messageId: number; emoji: string }) => {
      return apiRequest(`/api/messages/${data.messageId}/reactions/${data.emoji}`, 'DELETE');
    },
    onSuccess: () => {
      if (selectedConversation) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/messages', selectedConversation.participant1Id, selectedConversation.participant2Id] 
        });
      }
    },
  });

  const handleReaction = (messageId: number, emoji: string) => {
    if (!user) return;
    
    const message = messages?.find(m => m.id === messageId);
    if (!message) return;

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions?.find(r => r.userId === user.id && r.emoji === emoji);
    
    if (existingReaction) {
      removeReactionMutation.mutate({ messageId, emoji });
    } else {
      addReactionMutation.mutate({ messageId, emoji });
    }
    
    setShowEmojiPicker(null);
  };

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

  const startConversationWithFriend = (friend: any) => {
    // Check if conversation already exists
    const existingConv = conversations?.find((conv: any) => 
      (conv.participant1Id === user?.id && conv.participant2Id === friend.id) ||
      (conv.participant2Id === user?.id && conv.participant1Id === friend.id)
    );
    
    if (existingConv) {
      setSelectedConversation(existingConv);
      return;
    }
    
    const tempConversation = {
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
          {conversations && Array.isArray(conversations) && conversations.map((conv: any, convIndex: number) => (
            <div
              key={`conversation-${conv.id}-${convIndex}`}
              onClick={() => setSelectedConversation(conv)}
              className={`flex items-center p-3 cursor-pointer hover:bg-gray-700 ${
                selectedConversation?.id === conv.id ? 'bg-gray-700' : ''
              }`}
            >
              <Avatar className="w-12 h-12 mr-3">
                <AvatarImage src={conv.participant?.profileImageUrl} />
                <AvatarFallback className="bg-blue-600 text-white">
                  {conv.participant?.firstName?.[0] || '?'}{conv.participant?.lastName?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-white">
                    {conv.participant?.firstName || 'Utilisateur'} {conv.participant?.lastName || ''}
                  </h3>
                  <span className="text-xs text-gray-400">
                    {conv.lastMessageAt ? formatTime(conv.lastMessageAt) : ''}
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
              !conversations || !Array.isArray(conversations) || !conversations.some((conv: any) => 
                conv.participant?.id === friend.id
              )
            )
            .map((friend: any, friendIndex: number) => (
              <div
                key={`available-friend-${friend.id}-${friendIndex}`}
                onClick={() => startConversationWithFriend(friend)}
                className="flex items-center p-3 cursor-pointer hover:bg-gray-700"
              >
                <Avatar className="w-12 h-12 mr-3">
                  <AvatarImage src={friend.profileImageUrl} />
                  <AvatarFallback className="bg-green-600 text-white">
                    {friend.firstName?.[0] || '?'}{friend.lastName?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-medium text-white">
                    {friend.firstName || 'Utilisateur'} {friend.lastName || ''}
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
                    {selectedConversation.participant?.firstName?.[0] || '?'}{selectedConversation.participant?.lastName?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-white font-semibold">
                    {selectedConversation.participant?.firstName || 'Utilisateur'} {selectedConversation.participant?.lastName || ''}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {selectedConversation.lastMessageAt && messages && Array.isArray(messages) && messages.length > 0 ? 
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
                  messages.map((message: any, messageIndex: number) => {
                    const isOwnMessage = message.senderId === user?.id;
                    
                    return (
                      <div
                        key={`message-${message.id}-${messageIndex}`}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}
                      >
                        <div className="relative">
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

                          {/* Reaction button */}
                          <div className={`absolute top-1 ${isOwnMessage ? '-left-8' : '-right-8'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-6 h-6 p-0 bg-gray-600 hover:bg-gray-500 rounded-full"
                              onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                            >
                              <Smile className="w-3 h-3" />
                            </Button>
                          </div>

                          {/* Emoji picker */}
                          {showEmojiPicker === message.id && (
                            <div className={`absolute top-8 ${isOwnMessage ? 'right-0' : 'left-0'} bg-gray-800 border border-gray-600 rounded-lg p-2 flex flex-wrap gap-1 z-10 shadow-lg`}>
                              {availableEmojis.map((emoji) => (
                                <Button
                                  key={emoji}
                                  variant="ghost"
                                  size="sm"
                                  className="w-8 h-8 p-0 hover:bg-gray-700"
                                  onClick={() => handleReaction(message.id, emoji)}
                                >
                                  {emoji}
                                </Button>
                              ))}
                            </div>
                          )}

                          {/* Display reactions */}
                          {message.reactions && message.reactions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {/* Group reactions by emoji */}
                              {Object.entries(
                                message.reactions.reduce((acc: any, reaction: any) => {
                                  if (!acc[reaction.emoji]) {
                                    acc[reaction.emoji] = { count: 0, users: [], hasUserReacted: false };
                                  }
                                  acc[reaction.emoji].count++;
                                  acc[reaction.emoji].users.push(reaction.userId);
                                  if (reaction.userId === user?.id) {
                                    acc[reaction.emoji].hasUserReacted = true;
                                  }
                                  return acc;
                                }, {})
                              ).map(([emoji, data]: any) => (
                                <Button
                                  key={emoji}
                                  variant="ghost"
                                  size="sm"
                                  className={`h-6 px-2 text-xs rounded-full ${
                                    data.hasUserReacted 
                                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                  }`}
                                  onClick={() => handleReaction(message.id, emoji)}
                                >
                                  {emoji} {data.count}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">Aucun message encore. Commencez la conversation !</p>
                  </div>
                )}
                {/* Element for auto-scroll */}
                <div ref={messagesEndRef} />
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