import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { 
  Send, 
  Search, 
  Phone, 
  Video, 
  Info, 
  Smile, 
  Image, 
  Paperclip, 
  MoreHorizontal,
  Reply,
  Forward,
  Copy,
  Trash2,
  Heart,
  Check,
  CheckCheck,
  Circle,
  X,
  MessageCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

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
  messageType: string;
  isRead: boolean;
  createdAt: string;
  sender?: User;
  reactions?: { emoji: string; userId: string }[];
  replyTo?: Message;
}

interface Conversation {
  id: number;
  participant1Id: string;
  participant2Id: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  participant?: User;
  messages?: Message[];
}

export default function InstagramMessaging() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageOptions, setShowMessageOptions] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversations = [], refetch: refetchConversations } = useQuery({
    queryKey: ["/api/conversations"],
    enabled: !!user,
    refetchInterval: 2000,
  });

  // Fetch messages for selected conversation
  const { data: currentMessages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/conversations", selectedConversation?.id, "messages"],
    queryFn: async () => {
      if (!selectedConversation) return [];
      
      // If it's a new conversation (id === 0), return empty array
      if (selectedConversation.id === 0) return [];
      
      const response = await fetch(`/api/conversations/${selectedConversation.id}/messages`);
      if (!response.ok) {
        console.error(`Failed to fetch messages: ${response.status}`);
        return [];
      }
      const messages = await response.json();
      console.log(`Messages récupérés pour conversation ${selectedConversation.id}:`, messages);
      return messages;
    },
    enabled: !!user && !!selectedConversation && selectedConversation.id > 0,
    refetchInterval: 2000,
  });

  // Fetch friends for new conversations
  const { data: friends = [] } = useQuery({
    queryKey: ["/api/friends"],
    enabled: !!user,
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (data: { receiverId: string; content: string; messageType?: string; replyToId?: number }) => {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    onSuccess: () => {
      // Rafraîchir les conversations et les messages
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      if (selectedConversation && selectedConversation.id > 0) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/conversations", selectedConversation.id, "messages"] 
        });
      }
      setMessageContent("");
      setReplyingTo(null);
      // Attendre un peu avant de faire défiler pour laisser le temps aux données de se mettre à jour
      setTimeout(scrollToBottom, 100);
    },
    onError: (error) => {
      console.error("Erreur envoi message:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  // React to message mutation
  const reactToMessage = useMutation({
    mutationFn: async (data: { messageId: number; emoji: string }) => {
      const response = await fetch("/api/messages/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      if (selectedConversation) {
        queryClient.refetchQueries({ 
          queryKey: ["/api/conversations", selectedConversation.participant?.id] 
        });
      }
    },
  });

  // Delete message mutation
  const deleteMessage = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      if (selectedConversation) {
        queryClient.refetchQueries({ 
          queryKey: ["/api/conversations", selectedConversation.participant?.id] 
        });
      }
      setShowMessageOptions(false);
      toast({ title: "Message supprimé" });
    },
  });

  // Mark as read mutation
  const markAsRead = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: "PUT",
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const handleSendMessage = () => {
    if (!messageContent.trim() || !selectedConversation) return;
    
    sendMessage.mutate({
      receiverId: selectedConversation.participant?.id || "",
      content: messageContent,
      messageType: "text",
      replyToId: replyingTo?.id,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('receiverId', selectedConversation.participant?.id || "");

    try {
      const response = await fetch("/api/messages/upload", {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
        if (selectedConversation) {
          queryClient.refetchQueries({ 
            queryKey: ["/api/conversations", selectedConversation.participant?.id] 
          });
        }
        toast({ title: "Fichier envoyé" });
      }
    } catch (error) {
      toast({ title: "Erreur lors de l'envoi", variant: "destructive" });
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `il y a ${diffInMinutes}min`;
    if (diffInMinutes < 1440) return `il y a ${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString();
  };

  const getMessageStatus = (message: Message) => {
    if (message.senderId !== user?.id) return null;
    
    if (message.isRead) {
      return <CheckCheck className="w-3 h-3 text-blue-500" />;
    }
    return <Check className="w-3 h-3 text-gray-400" />;
  };

  const filteredConversations = conversations.filter((conv: any) =>
    conv.participant?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.participant?.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add friends who don't have conversations yet
  const friendsWithoutConversations = friends.filter((friend: any) => 
    !conversations.find((conv: any) => 
      conv.participant?.id === friend.id
    )
  );

  const emojis = ["❤️", "😂", "😮", "😢", "😡", "👍", "👎", "🔥"];

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar - Liste des conversations */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-white">Messages</h1>
            <Button variant="ghost" size="sm" className="text-white">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher des conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Conversations list */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {/* Existing conversations */}
            {filteredConversations.map((conversation: any) => (
              <div
                key={`conversation-${conversation.id}`}
                onClick={() => setSelectedConversation(conversation)}
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedConversation?.id === conversation.id
                    ? "bg-blue-600"
                    : "hover:bg-gray-700"
                }`}
              >
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={conversation.participant?.profileImageUrl} />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {conversation.participant?.firstName?.[0]}{conversation.participant?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online status */}
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                </div>
                
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-white font-semibold truncate">
                      {conversation.participant?.firstName} {conversation.participant?.lastName}
                    </p>
                    <span className="text-xs text-gray-400">
                      {formatMessageTime(conversation.lastMessageAt)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-gray-400 text-sm truncate">
                      {conversation.lastMessage}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <Badge className="bg-blue-600 text-white ml-2">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Friends without conversations */}
            {friendsWithoutConversations.map((friend: any) => (
              <div
                key={`friend-${friend.id}`}
                onClick={() => {
                  // Create a mock conversation for this friend
                  const mockConversation = {
                    id: 0,
                    participant1Id: user?.id || "",
                    participant2Id: friend.id,
                    lastMessage: "",
                    lastMessageAt: new Date().toISOString(),
                    unreadCount: 0,
                    participant: friend,
                    messages: []
                  };
                  setSelectedConversation(mockConversation);
                }}
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-700`}
              >
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={friend.profileImageUrl} />
                    <AvatarFallback className="bg-green-600 text-white">
                      {friend.firstName?.[0]}{friend.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online status */}
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                </div>
                
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-white font-semibold truncate">
                      {friend.firstName} {friend.lastName}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-gray-400 text-sm truncate">
                      Commencer une conversation
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredConversations.length === 0 && friendsWithoutConversations.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400">Aucune conversation trouvée</p>
              </div>
            )}
          </div>
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
                  <p className="text-green-400 text-sm">En ligne</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" className="text-white">
                  <Phone className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-white">
                  <Video className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-white">
                  <Info className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Messages area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-gray-400">Chargement des messages...</span>
                  </div>
                ) : currentMessages && currentMessages.length > 0 ? (
                  currentMessages.map((message: Message) => {
                    const isOwnMessage = message.senderId === user?.id;
                    
                    return (
                    <div
                      key={`message-${message.id}`}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md`}>
                        {/* Reply indicator */}
                        {message.replyTo && (
                          <div className="mb-1 p-2 bg-gray-700 rounded-lg text-xs text-gray-400">
                            <Reply className="w-3 h-3 inline mr-1" />
                            Réponse à: {message.replyTo.content}
                          </div>
                        )}
                        
                        <div
                          className={`relative group ${
                            isOwnMessage
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 text-white'
                          } rounded-2xl px-4 py-2`}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setSelectedMessage(message);
                            setShowMessageOptions(true);
                          }}
                        >
                          {/* Message content */}
                          {message.messageType === 'image' ? (
                            <img 
                              src={message.content} 
                              alt="Image" 
                              className="max-w-full rounded-lg"
                            />
                          ) : (
                            <p className="break-words">{message.content}</p>
                          )}
                          
                          {/* Message info */}
                          <div className={`flex items-center justify-between mt-1 text-xs ${
                            isOwnMessage ? 'text-blue-100' : 'text-gray-400'
                          }`}>
                            <span>{formatMessageTime(message.createdAt)}</span>
                            {getMessageStatus(message)}
                          </div>
                          
                          {/* Reactions */}
                          {message.reactions && message.reactions.length > 0 && (
                            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                              {message.reactions.map((reaction, index) => (
                                <span key={index} className="bg-gray-800 rounded-full px-1 text-xs">
                                  {reaction.emoji}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {/* Quick reactions (on hover) */}
                          <div className="absolute -top-8 right-0 hidden group-hover:flex space-x-1 bg-gray-800 rounded-full p-1">
                            {emojis.slice(0, 6).map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => reactToMessage.mutate({ messageId: message.id, emoji })}
                                className="hover:bg-gray-700 rounded-full p-1 text-sm"
                              >
                                {emoji}
                              </button>
                            ))}
                            <button
                              onClick={() => setReplyingTo(message)}
                              className="hover:bg-gray-700 rounded-full p-1"
                            >
                              <Reply className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">Pas encore de messages</p>
                      <p className="text-gray-500 text-sm">Envoyez un message pour commencer la conversation</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Reply preview */}
            {replyingTo && (
              <div className="px-4 py-2 bg-gray-700 border-l-4 border-blue-500 flex items-center justify-between">
                <div className="flex items-center">
                  <Reply className="w-4 h-4 mr-2 text-blue-400" />
                  <span className="text-sm text-gray-300">
                    Réponse à: {replyingTo.content.substring(0, 50)}...
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(null)}
                  className="text-gray-400"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Message input */}
            <div className="p-4 bg-gray-800 border-t border-gray-700">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFileUpload}
                  className="text-gray-400"
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFileUpload}
                  className="text-gray-400"
                >
                  <Image className="w-5 h-5" />
                </Button>
                
                <div className="flex-1 relative">
                  <Input
                    placeholder="Écrivez un message..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    <Smile className="w-4 h-4" />
                  </Button>
                </div>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageContent.trim() || sendMessage.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Emoji picker */}
              {showEmojiPicker && (
                <div className="mt-2 p-2 bg-gray-700 rounded-lg">
                  <div className="grid grid-cols-8 gap-2">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          setMessageContent(prev => prev + emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="p-2 hover:bg-gray-600 rounded text-lg"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Vos Messages</h3>
              <p className="text-gray-400">Envoyez des messages privés à vos amis</p>
            </div>
          </div>
        )}
      </div>

      {/* Message options dialog */}
      <Dialog open={showMessageOptions} onOpenChange={setShowMessageOptions}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Options du message</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-white"
              onClick={() => setReplyingTo(selectedMessage)}
            >
              <Reply className="w-4 h-4 mr-2" />
              Répondre
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-white"
              onClick={() => {
                if (selectedMessage) {
                  navigator.clipboard.writeText(selectedMessage.content);
                  toast({ title: "Message copié" });
                }
                setShowMessageOptions(false);
              }}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copier
            </Button>
            {selectedMessage?.senderId === user?.id && (
              <Button
                variant="ghost"
                className="w-full justify-start text-red-400"
                onClick={() => {
                  if (selectedMessage) {
                    deleteMessage.mutate(selectedMessage.id);
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,.pdf,.doc,.docx"
        onChange={onFileSelected}
        className="hidden"
      />
    </div>
  );
}