import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  MessageSquare, 
  Eye, 
  Clock, 
  ArrowLeft, 
  Pin, 
  Lock, 
  User,
  Image as ImageIcon,
  Video,
  Send,
  Paperclip
} from "lucide-react";
import Navigation from "@/components/ui/navigation";

export default function ForumTopicPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [match, params] = useRoute("/forum/topic/:id");
  const [replyContent, setReplyContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const topicId = params?.id;

  const { data: topic, isLoading } = useQuery({
    queryKey: [`/api/forum/topics/${topicId}`],
    enabled: !!topicId,
  });

  const { data: replies } = useQuery({
    queryKey: [`/api/forum/topics/${topicId}/replies`],
    enabled: !!topicId,
  });

  const createReplyMutation = useMutation({
    mutationFn: async (replyData: { content: string; files?: File[] }) => {
      const formData = new FormData();
      formData.append("content", replyData.content);
      formData.append("topicId", topicId!);
      
      if (replyData.files) {
        replyData.files.forEach((file, index) => {
          formData.append(`files`, file);
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
      toast({
        title: "Réponse ajoutée !",
        description: "Votre réponse a été publiée avec succès.",
      });
      setReplyContent("");
      setSelectedFiles([]);
      queryClient.invalidateQueries({ queryKey: ["/api/forum/topics", topicId, "replies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/forum/topics", topicId] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la réponse",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB max
      
      if (!isImage && !isVideo) {
        toast({
          title: "Format non supporté",
          description: "Seuls les images et vidéos sont autorisées",
          variant: "destructive",
        });
        return false;
      }
      
      if (!isValidSize) {
        toast({
          title: "Fichier trop volumineux",
          description: "Taille maximale autorisée : 50MB",
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReply = () => {
    if (!replyContent.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez écrire un message",
        variant: "destructive",
      });
      return;
    }
    
    createReplyMutation.mutate({ 
      content: replyContent, 
      files: selectedFiles.length > 0 ? selectedFiles : undefined 
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex overflow-hidden">
        <Navigation variant="student" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement du sujet...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="h-screen bg-background flex overflow-hidden">
        <Navigation variant="student" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Sujet introuvable</h2>
            <Link href="/forum">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au forum
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <Navigation variant="student" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-background border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/forum">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour au forum
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">{topic.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>Par {topic.author?.firstName || 'Utilisateur'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(topic.createdAt)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="h-3 w-3" />
                    <span>{topic.viewCount || 0} vues</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="h-3 w-3" />
                    <span>{replies?.length || 0} réponses</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {topic.isPinned && (
                <Badge variant="secondary">
                  <Pin className="h-3 w-3 mr-1" />
                  Épinglé
                </Badge>
              )}
              {topic.isLocked && (
                <Badge variant="destructive">
                  <Lock className="h-3 w-3 mr-1" />
                  Verrouillé
                </Badge>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Original Post */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={topic.author?.profileImageUrl} />
                    <AvatarFallback>
                      {topic.author?.firstName?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{topic.author?.firstName || 'Utilisateur'}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(topic.createdAt)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <p className="whitespace-pre-wrap">{topic.content}</p>
                </div>
              </CardContent>
            </Card>

            {/* Replies */}
            {replies && replies.length > 0 && (
              <div className="space-y-4">
                <Separator />
                <h3 className="text-lg font-semibold">Réponses ({replies.length})</h3>
                
                {replies.map((reply: any, index: number) => (
                  <Card key={reply.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={reply.author?.profileImageUrl} />
                            <AvatarFallback>
                              {reply.author?.firstName?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{reply.author?.firstName || 'Utilisateur'}</p>
                            <p className="text-sm text-muted-foreground">{formatDate(reply.createdAt)}</p>
                          </div>
                        </div>
                        <Badge variant="outline">#{index + 1}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <p className="whitespace-pre-wrap">{reply.content}</p>
                      </div>
                      
                      {/* Media attachments */}
                      {reply.attachments && reply.attachments.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          {reply.attachments.map((attachment: any, i: number) => (
                            <div key={i} className="relative">
                              {attachment.type === 'image' ? (
                                <img 
                                  src={attachment.url} 
                                  alt="Pièce jointe"
                                  className="w-full h-32 object-cover rounded border"
                                />
                              ) : attachment.type === 'video' ? (
                                <video 
                                  src={attachment.url} 
                                  controls
                                  className="w-full h-32 object-cover rounded border"
                                />
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Reply Form */}
            {!topic.isLocked && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ajouter une réponse</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Écrivez votre réponse..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="min-h-[120px]"
                  />
                  
                  {/* File attachments */}
                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Pièces jointes :</p>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="relative border rounded p-2">
                            <div className="flex items-center space-x-2">
                              {file.type.startsWith('image/') ? (
                                <ImageIcon className="h-4 w-4" />
                              ) : (
                                <Video className="h-4 w-4" />
                              )}
                              <span className="text-sm truncate">{file.name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                                className="ml-auto h-6 w-6 p-0"
                              >
                                ×
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload">
                        <Button variant="outline" size="sm" asChild>
                          <span>
                            <Paperclip className="h-4 w-4 mr-2" />
                            Ajouter des fichiers
                          </span>
                        </Button>
                      </label>
                    </div>
                    
                    <Button 
                      onClick={handleSubmitReply}
                      disabled={createReplyMutation.isPending || !replyContent.trim()}
                      className="gradient-primary text-white"
                    >
                      {createReplyMutation.isPending ? (
                        "Envoi en cours..."
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Répondre
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {topic.isLocked && (
              <Card>
                <CardContent className="text-center py-8">
                  <Lock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Ce sujet est verrouillé et n'accepte plus de nouvelles réponses.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}