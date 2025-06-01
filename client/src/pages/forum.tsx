import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Eye, Clock, Plus, Pin, Lock, User } from "lucide-react";
import Navigation from "@/components/ui/navigation";

export default function ForumPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["/api/forum/categories"],
  });

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex overflow-hidden">
        <Navigation variant="student" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg text-muted-foreground">Chargement du forum...</p>
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
            <div>
              <h1 className="text-2xl font-bold text-foreground">Forum des Créateurs</h1>
              <p className="text-muted-foreground">Échangez avec la communauté d'apprentis créateurs</p>
            </div>
            <Button className="gradient-primary text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau sujet
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            {/* Forum Categories */}
            <div className="grid gap-6">
              {categories.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucune catégorie disponible</h3>
                    <p className="text-muted-foreground">
                      Le forum sera bientôt disponible avec des catégories pour discuter de vos projets créatifs.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                categories.map((category: any) => (
                  <Card key={category.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          ></div>
                          <div>
                            <CardTitle className="text-lg">{category.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{category.description}</p>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {category.topicsCount || 0} sujets
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      {category.latestTopics && category.latestTopics.length > 0 ? (
                        <div className="space-y-3">
                          {category.latestTopics.slice(0, 3).map((topic: any) => (
                            <Link key={topic.id} href={`/forum/topic/${topic.id}`}>
                              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                <div className="flex items-center space-x-3">
                                  {topic.isPinned && <Pin className="h-4 w-4 text-primary" />}
                                  {topic.isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                                  <div>
                                    <h4 className="font-medium text-sm">{topic.title}</h4>
                                    <p className="text-xs text-muted-foreground">
                                      Par {topic.author?.firstName || 'Anonyme'} • {topic.repliesCount || 0} réponses
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                  <Eye className="h-3 w-3" />
                                  <span>{topic.viewCount || 0}</span>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Aucun sujet dans cette catégorie</p>
                          <Button variant="outline" size="sm" className="mt-2">
                            Créer le premier sujet
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Forum Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Statistiques du Forum</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">0</div>
                    <div className="text-sm text-muted-foreground">Sujets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-sm text-muted-foreground">Messages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <div className="text-sm text-muted-foreground">Membres actifs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">0</div>
                    <div className="text-sm text-muted-foreground">Vues</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Community Guidelines */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Règles de la Communauté</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Respectez les autres membres de la communauté</p>
                  <p>• Restez dans le sujet des discussions</p>
                  <p>• Partagez vos connaissances et aidez les autres</p>
                  <p>• Évitez le spam et les contenus inappropriés</p>
                  <p>• Utilisez des titres descriptifs pour vos sujets</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}