import { useState, useEffect, useRef } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import MentionInput from "@/components/mention-input";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Pin, 
  Lock, 
  Image as ImageIcon,
  Video,
  Send,
  Paperclip,
  Smile,
  Heart,
  MoreVertical
} from "lucide-react";
import Navigation from "@/components/ui/navigation";
import MentionNotificationPopup, { useMentionNotifications } from "@/components/mention-notification";
import MessageReactions from "@/components/message-reactions";

export default function ForumTopicPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [match, params] = useRoute("/forum/topic/:id");
  const [replyContent, setReplyContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Système de mentions
  const { notifications, addNotification, dismissNotification } = useMentionNotifications();
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionSuggestions, setMentionSuggestions] = useState<any[]>([]);

  const topicId = params?.id;

  const { data: topic, isLoading } = useQuery({
    queryKey: [`/api/forum/topics/${topicId}`],
    enabled: !!topicId,
  });

  const { data: replies } = useQuery({
    queryKey: [`/api/forum/topics/${topicId}/replies`],
    enabled: !!topicId,
    refetchInterval: 1000,
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [replies]);

  const createReplyMutation = useMutation({
    mutationFn: async (replyData: { content: string; files?: File[] }) => {
      const formData = new FormData();
      formData.append("content", replyData.content);
      formData.append("topicId", topicId!);
      
      if (replyData.files) {
        replyData.files.forEach((file) => {
          formData.append("files", file);
        });
      }

      const response = await fetch("/api/forum/replies", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la création de la réponse");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/forum/topics/${topicId}/replies`] });
      setReplyContent("");
      setSelectedFiles([]);
      toast({
        title: "Message envoyé !",
        description: "Votre message a été publié avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    
    createReplyMutation.mutate({
      content: replyContent,
      files: selectedFiles,
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navigation />
        <div className="ml-20 flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <p className="text-white/70 mt-4">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-black">
        <Navigation />
        <div className="md:ml-20 flex flex-col items-center justify-center h-screen">
          <h2 className="text-2xl font-bold text-white mb-4">Sujet introuvable</h2>
          <Link href="/forum">
            <Button variant="outline" className="flex items-center gap-2 text-white border-white hover:bg-white hover:text-black">
              <ArrowLeft className="h-4 w-4" />
              Retour au forum
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <div className="md:ml-20 flex flex-col h-screen">
        {/* Chat Header - Instagram Style */}
        <div className="bg-black/30 backdrop-blur-lg border-b border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/forum">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-white/20">
                  <AvatarImage src={topic?.author?.profileImageUrl} />
                  <AvatarFallback className="bg-gradient-to-br from-pink-500 to-violet-500 text-white">
                    {(topic?.author?.firstName || topic?.author?.email)?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-white font-semibold text-lg">{topic?.title}</h1>
                  <p className="text-white/60 text-sm">
                    Par {topic?.author?.firstName || topic?.author?.email?.split('@')[0] || 'Anonyme'} • {topic?.viewCount || 0} vues
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {topic?.isPinned && (
                <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                  <Pin className="h-3 w-3 mr-1" />
                  Épinglé
                </Badge>
              )}
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Container - Chat Style */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Initial Topic Message */}
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-white/20">
              <AvatarImage src={topic?.author?.profileImageUrl} />
              <AvatarFallback className="bg-gradient-to-br from-pink-500 to-violet-500 text-white">
                {(topic?.author?.firstName || topic?.author?.email)?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl rounded-tl-sm p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-white">{topic?.author?.firstName || topic?.author?.email?.split('@')[0] || 'Anonyme'}</span>
                  <span className="text-white/50 text-xs">
                    {new Date(topic?.createdAt).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-white/90 leading-relaxed">{topic?.content}</p>
                
                {/* Topic Attachments */}
                {topic?.attachments && topic.attachments.length > 0 && (
                  <div className="mt-3 grid gap-2">
                    {topic.attachments.map((attachment: any, index: number) => (
                      <div key={index} className="relative rounded-lg overflow-hidden">
                        {attachment.type === 'image' ? (
                          <img
                            src={attachment.url}
                            alt={attachment.filename}
                            className="w-full max-w-sm rounded-lg"
                          />
                        ) : (
                          <video
                            src={attachment.url}
                            controls
                            className="w-full max-w-sm rounded-lg"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Réactions pour le sujet principal */}
                <MessageReactions 
                  messageId={topicId!} 
                  messageType="topic" 
                  className="mt-3" 
                />
              </div>
            </div>
          </div>

          {/* Replies */}
          {replies && replies?.length > 0 && replies.map((reply: any) => {
            const isCurrentUser = reply?.authorId === user?.id;
            return (
              <div key={reply.id} className={`flex gap-3 ${isCurrentUser ? 'justify-end' : ''}`}>
                {!isCurrentUser && (
                  <Avatar className="h-8 w-8 ring-2 ring-white/20">
                    <AvatarImage src={reply?.author?.profileImageUrl} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-sm">
                      {(reply?.author?.firstName || reply?.author?.email)?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`flex-1 max-w-xs ${isCurrentUser ? 'ml-16' : 'mr-16'}`}>
                  <div className={`backdrop-blur-lg rounded-2xl p-3 border ${
                    isCurrentUser 
                      ? 'bg-gradient-to-br from-pink-500/20 to-violet-500/20 border-pink-500/30 rounded-br-sm' 
                      : 'bg-white/10 border-white/20 rounded-tl-sm'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-medium text-sm ${isCurrentUser ? 'text-pink-200' : 'text-white'}`}>
                        {reply?.author?.firstName || reply?.author?.email?.split('@')[0] || 'Anonyme'}
                      </span>
                      <span className="text-white/50 text-xs">
                        {new Date(reply?.createdAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed ${isCurrentUser ? 'text-white' : 'text-white/90'}`}>
                      {reply?.content}
                    </p>
                    
                    {/* Reply Attachments */}
                    {reply?.attachments && reply.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {reply.attachments.map((attachment: any, index: number) => (
                          <div key={index} className="relative rounded-lg overflow-hidden">
                            {attachment.type === 'image' ? (
                              <img
                                src={attachment.url}
                                alt={attachment.filename}
                                className="w-full rounded-lg max-h-48 object-cover"
                              />
                            ) : (
                              <video
                                src={attachment.url}
                                controls
                                className="w-full rounded-lg max-h-48"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Réactions pour chaque réponse */}
                  <MessageReactions 
                    messageId={reply.id.toString()} 
                    messageType="reply" 
                    className="mt-2 px-3" 
                  />
                </div>
                {isCurrentUser && (
                  <Avatar className="h-8 w-8 ring-2 ring-pink-500/50">
                    <AvatarImage src={user?.profileImageUrl} />
                    <AvatarFallback className="bg-gradient-to-br from-pink-500 to-violet-500 text-white text-sm">
                      {user?.firstName?.[0] || 'M'}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}
          
          {/* Auto-scroll target */}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input - Instagram Style */}
        {!topic?.isLocked && (
          <div className="bg-black/30 backdrop-blur-lg border-t border-white/10 p-4">
            <form onSubmit={handleSubmitReply} className="flex items-end gap-3">
              {/* File upload */}
              <div className="flex flex-col gap-2">
                <Input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button type="button" variant="ghost" size="sm" className="h-10 w-10 p-0 text-white/70 hover:text-white hover:bg-white/20">
                    <Paperclip className="h-5 w-5" />
                  </Button>
                </label>
              </div>

              {/* Message input */}
              <div className="flex-1">
                {selectedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedFiles.map((file, index) => (
                      <Badge key={index} className="bg-white/20 text-white border-white/30 flex items-center gap-1">
                        {file.type.startsWith('image/') ? (
                          <ImageIcon className="h-3 w-3" />
                        ) : (
                          <Video className="h-3 w-3" />
                        )}
                        <span className="text-xs">{file.name.substring(0, 20)}...</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="ml-1 text-xs hover:text-red-400"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <MentionInput
                    placeholder="Tapez votre message... (utilisez @ pour mentionner quelqu'un)"
                    value={replyContent}
                    onChange={setReplyContent}
                    className="flex-1 min-h-[44px] max-h-32 resize-none bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 rounded-2xl"
                  />
                  <Button 
                    type="submit" 
                    disabled={!replyContent.trim() || createReplyMutation.isPending}
                    className="h-11 w-11 p-0 bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 rounded-full"
                  >
                    {createReplyMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Emoji button */}
              <Button type="button" variant="ghost" size="sm" className="h-10 w-10 p-0 text-white/70 hover:text-white hover:bg-white/20">
                <Smile className="h-5 w-5" />
              </Button>
            </form>
          </div>
        )}

        {topic?.isLocked && (
          <div className="bg-black/30 backdrop-blur-lg border-t border-white/10 p-4">
            <div className="text-center py-3">
              <Lock className="h-6 w-6 text-white/50 mx-auto mb-2" />
              <p className="text-white/60 text-sm">Ce sujet est verrouillé</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}