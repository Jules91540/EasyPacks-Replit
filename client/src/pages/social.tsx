import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import Navigation from "@/components/ui/navigation";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Send, 
  UserPlus, 
  Users, 
  Search,
  Phone,
  Video,
  MoreHorizontal,
  Check,
  X,
  Bell,
  Mail,
  Plus,
  Globe,
  Lock,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string;
}

interface Post {
  id: number;
  authorId: string;
  content: string;
  imageUrl?: string;
  visibility: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: string;
  author?: User;
  userLiked?: boolean;
}

interface Comment {
  id: number;
  userId: string;
  postId: number;
  content: string;
  createdAt: string;
  user?: User;
}

interface Friendship {
  id: number;
  senderId: string;
  receiverId: string;
  status: string;
  createdAt: string;
  sender?: User;
  receiver?: User;
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
}

interface Notification {
  id: number;
  userId: string;
  type: string;
  title: string;
  content: string;
  relatedUserId?: string;
  relatedPostId?: number;
  isRead: boolean;
  createdAt: string;
  relatedUser?: User;
}

export default function SocialPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("feed");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostVisibility, setNewPostVisibility] = useState("public");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  // Fetch posts
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["/api/posts"],
    enabled: !!user,
  });

  // Fetch friends
  const { data: friends = [] } = useQuery({
    queryKey: ["/api/friends"],
    enabled: !!user,
  });

  // Fetch friend requests
  const { data: friendRequests = [] } = useQuery({
    queryKey: ["/api/friends/requests/pending"],
    enabled: !!user,
  });

  // Fetch conversations
  const { data: conversations = [] } = useQuery({
    queryKey: ["/api/conversations"],
    enabled: !!user,
  });

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications/social"],
    enabled: !!user,
  });

  // Search users
  const { data: searchResults = [] } = useQuery({
    queryKey: ["/api/search/users", { q: searchQuery }],
    enabled: searchQuery.length >= 2,
  });

  // Discover all users
  const { data: allUsers = [] } = useQuery({
    queryKey: ["/api/users/discover"],
    enabled: !!user,
  });

  // Create post mutation
  const createPost = useMutation({
    mutationFn: async (data: { content: string; visibility: string }) => {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setNewPostContent("");
      toast({
        title: "Publication créée",
        description: "Votre publication a été partagée avec succès",
      });
    },
  });

  // Send friend request mutation
  const sendFriendRequest = useMutation({
    mutationFn: async (receiverId: string) => {
      const response = await fetch("/api/friends/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ receiverId }),
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({
        title: "Demande envoyée",
        description: "Votre demande d'ami a été envoyée",
      });
    },
  });

  // Accept friend request mutation
  const acceptFriendRequest = useMutation({
    mutationFn: async (friendshipId: number) => {
      return apiRequest(`/api/friends/accept/${friendshipId}`, {
        method: "PUT",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests/pending"] });
      toast({
        title: "Ami accepté",
        description: "Vous êtes maintenant amis",
      });
    },
  });

  // Reject friend request mutation
  const rejectFriendRequest = useMutation({
    mutationFn: async (friendshipId: number) => {
      return apiRequest(`/api/friends/reject/${friendshipId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests/pending"] });
    },
  });

  // Like post mutation
  const likePost = useMutation({
    mutationFn: async (postId: number) => {
      return apiRequest(`/api/posts/${postId}/like`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (data: { receiverId: string; content: string }) => {
      return apiRequest("/api/messages", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setMessageContent("");
      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé",
      });
    },
  });

  // Initiate call mutation
  const initiateCall = useMutation({
    mutationFn: async (data: { receiverId: string; callType: string }) => {
      return apiRequest("/api/calls", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Appel initié",
        description: "L'appel a été lancé",
      });
    },
  });

  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;
    
    createPost.mutate({
      content: newPostContent,
      visibility: newPostVisibility,
    });
  };

  const handleSendMessage = () => {
    if (!messageContent.trim() || !selectedUser) return;
    
    sendMessage.mutate({
      receiverId: selectedUser.id,
      content: messageContent,
    });
  };

  const PostCard = ({ post }: { post: Post }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={post.author?.profileImageUrl} />
              <AvatarFallback>
                {post.author?.firstName?.[0]}{post.author?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-white">
                {post.author?.firstName} {post.author?.lastName}
              </p>
              <p className="text-sm text-white/70">
                {new Date(post.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {post.visibility === "public" ? (
                <><Globe className="w-3 h-3 mr-1" /> Public</>
              ) : post.visibility === "friends" ? (
                <><Users className="w-3 h-3 mr-1" /> Amis</>
              ) : (
                <><Lock className="w-3 h-3 mr-1" /> Privé</>
              )}
            </Badge>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-white mb-4">{post.content}</p>
        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt="Post image"
            className="w-full rounded-lg mb-4"
          />
        )}
        <div className="flex items-center justify-between pt-4 border-t border-white/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => likePost.mutate(post.id)}
            className={post.userLiked ? "text-red-500" : "text-white/70"}
          >
            <Heart className={`w-4 h-4 mr-2 ${post.userLiked ? "fill-current" : ""}`} />
            {post.likesCount}
          </Button>
          <Button variant="ghost" size="sm" className="text-white/70">
            <MessageCircle className="w-4 h-4 mr-2" />
            {post.commentsCount}
          </Button>
          <Button variant="ghost" size="sm" className="text-white/70">
            <Share2 className="w-4 h-4 mr-2" />
            {post.sharesCount}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Navigation variant="student" />
      
      <main className="flex-1 p-4 md:ml-20 h-screen overflow-hidden">
        <div className="h-full flex flex-col max-h-screen">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">Réseau Social</h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Input
                  placeholder="Rechercher des amis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
              </div>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications
                    {notifications.filter((n: Notification) => !n.isRead).length > 0 && (
                      <Badge className="ml-2 bg-red-500">
                        {notifications.filter((n: Notification) => !n.isRead).length}
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Notifications</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-64">
                    {notifications.map((notification: Notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b ${!notification.isRead ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                      >
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-white/70">{notification.content}</p>
                        <p className="text-xs text-white/50 mt-1">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="feed">Fil d'actualité</TabsTrigger>
              <TabsTrigger value="friends">
                Amis ({friends.length})
              </TabsTrigger>
              <TabsTrigger value="requests">
                Demandes ({friendRequests.length})
              </TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="search">Découvrir</TabsTrigger>
            </TabsList>

            <div className="flex-1 mt-4 overflow-y-auto">
              <TabsContent value="feed" className="h-full space-y-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-full">
                  {/* Create Post */}
                  <div className="lg:col-span-2">
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle>Créer une publication</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Textarea
                          placeholder="Que voulez-vous partager ?"
                          value={newPostContent}
                          onChange={(e) => setNewPostContent(e.target.value)}
                          className="min-h-[100px]"
                        />
                        <div className="flex items-center justify-between">
                          <select
                            value={newPostVisibility}
                            onChange={(e) => setNewPostVisibility(e.target.value)}
                            className="bg-background border border-white/20 rounded px-3 py-2 text-white"
                          >
                            <option value="public">Public</option>
                            <option value="friends">Amis seulement</option>
                            <option value="private">Privé</option>
                          </select>
                          <Button
                            onClick={handleCreatePost}
                            disabled={!newPostContent.trim() || createPost.isPending}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Publier
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Posts Feed */}
                    <ScrollArea className="h-[calc(100vh-400px)]">
                      {postsLoading ? (
                        <div className="text-center py-8">
                          <p className="text-white/70">Chargement des publications...</p>
                        </div>
                      ) : posts.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-white/70">Aucune publication à afficher</p>
                        </div>
                      ) : (
                        posts.map((post: Post) => (
                          <PostCard key={post.id} post={post} />
                        ))
                      )}
                    </ScrollArea>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Users className="w-5 h-5 mr-2" />
                          Amis récents
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {friends.slice(0, 5).map((friend: User) => (
                            <div key={friend.id} className="flex items-center space-x-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={friend.profileImageUrl} />
                                <AvatarFallback>
                                  {friend.firstName?.[0]}{friend.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-white">
                                  {friend.firstName} {friend.lastName}
                                </p>
                              </div>
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedUser(friend);
                                    setActiveTab("messages");
                                  }}
                                >
                                  <Mail className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => initiateCall.mutate({ receiverId: friend.id, callType: "voice" })}
                                >
                                  <Phone className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Activité récente</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {notifications.slice(0, 3).map((notification: Notification) => (
                            <div key={notification.id} className="text-sm">
                              <p className="text-white">{notification.content}</p>
                              <p className="text-white/50 text-xs">
                                {new Date(notification.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="friends" className="h-full overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                  {friends.map((friend: User) => (
                    <Card key={friend.id}>
                      <CardContent className="p-6 text-center">
                        <Avatar className="w-16 h-16 mx-auto mb-4">
                          <AvatarImage src={friend.profileImageUrl} />
                          <AvatarFallback>
                            {friend.firstName?.[0]}{friend.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="font-semibold text-white mb-2">
                          {friend.firstName} {friend.lastName}
                        </h3>
                        <div className="flex justify-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedUser(friend);
                              setActiveTab("messages");
                            }}
                          >
                            <Mail className="w-4 h-4 mr-1" />
                            Message
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => initiateCall.mutate({ receiverId: friend.id, callType: "voice" })}
                          >
                            <Phone className="w-4 h-4 mr-1" />
                            Appeler
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => initiateCall.mutate({ receiverId: friend.id, callType: "video" })}
                          >
                            <Video className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="requests" className="h-full overflow-y-auto">
                <div className="space-y-4 pb-4">
                  {friendRequests.map((request: Friendship) => (
                    <Card key={request.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarImage src={request.sender?.profileImageUrl} />
                              <AvatarFallback>
                                {request.sender?.firstName?.[0]}{request.sender?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-white">
                                {request.sender?.firstName} {request.sender?.lastName}
                              </h3>
                              <p className="text-sm text-white/70">
                                Demande d'ami envoyée le {new Date(request.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => acceptFriendRequest.mutate(request.id)}
                              disabled={acceptFriendRequest.isPending}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Accepter
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectFriendRequest.mutate(request.id)}
                              disabled={rejectFriendRequest.isPending}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Refuser
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {friendRequests.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-white/70">Aucune demande d'ami en attente</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="messages" className="h-full overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[calc(100vh-160px)] pb-4">
                  {/* Conversations list */}
                  <div className="lg:col-span-1">
                    <Card className="h-full flex flex-col">
                      <CardHeader className="flex-shrink-0">
                        <CardTitle>Conversations</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1 overflow-hidden">
                        <ScrollArea className="h-full">
                          {friends.map((friend: User) => (
                            <div
                              key={friend.id}
                              className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-white/10 ${
                                selectedUser?.id === friend.id ? "bg-white/10" : ""
                              }`}
                              onClick={() => setSelectedUser(friend)}
                            >
                              <Avatar>
                                <AvatarImage src={friend.profileImageUrl} />
                                <AvatarFallback>
                                  {friend.firstName?.[0]}{friend.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-medium text-white">
                                  {friend.firstName} {friend.lastName}
                                </p>
                                <p className="text-sm text-white/70">En ligne</p>
                              </div>
                            </div>
                          ))}
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Chat window */}
                  <div className="lg:col-span-2">
                    {selectedUser ? (
                      <Card className="h-full flex flex-col">
                        <CardHeader className="flex-shrink-0 pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={selectedUser.profileImageUrl} />
                                <AvatarFallback>
                                  {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold text-white text-sm">
                                  {selectedUser.firstName} {selectedUser.lastName}
                                </h3>
                                <p className="text-xs text-white/70">En ligne</p>
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => initiateCall.mutate({ receiverId: selectedUser.id, callType: "voice" })}
                              >
                                <Phone className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => initiateCall.mutate({ receiverId: selectedUser.id, callType: "video" })}
                              >
                                <Video className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
                          <ScrollArea className="flex-1 mb-3">
                            <div className="space-y-2">
                              {/* Messages would be loaded here */}
                              <div className="text-center text-white/70 py-4">
                                <p className="text-sm">Démarrez une conversation avec {selectedUser.firstName}</p>
                              </div>
                            </div>
                          </ScrollArea>
                          <div className="flex space-x-2 flex-shrink-0">
                            <Input
                              placeholder="Tapez votre message..."
                              value={messageContent}
                              onChange={(e) => setMessageContent(e.target.value)}
                              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                              className="flex-1 h-9"
                            />
                            <Button
                              onClick={handleSendMessage}
                              disabled={!messageContent.trim() || sendMessage.isPending}
                              size="sm"
                              className="h-9 w-9 p-0"
                            >
                              <Send className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="h-full flex items-center justify-center">
                        <div className="text-center text-white/70">
                          <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Sélectionnez une conversation pour commencer</p>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="search" className="h-full overflow-y-auto">
                <div className="space-y-6 pb-4">
                  {searchQuery.length >= 2 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {searchResults.map((user: User) => (
                        <Card key={user.id}>
                          <CardContent className="p-6 text-center">
                            <Avatar className="w-16 h-16 mx-auto mb-4">
                              <AvatarImage src={user.profileImageUrl} />
                              <AvatarFallback>
                                {user.firstName?.[0]}{user.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <h3 className="font-semibold text-white mb-2">
                              {user.firstName} {user.lastName}
                            </h3>
                            <Button
                              size="sm"
                              onClick={() => sendFriendRequest.mutate(user.id)}
                              disabled={sendFriendRequest.isPending}
                            >
                              <UserPlus className="w-4 h-4 mr-1" />
                              Ajouter
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  {searchQuery.length < 2 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white mb-4">Découvrir des utilisateurs</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {allUsers.map((user: any) => (
                          <Card key={user.id}>
                            <CardContent className="p-6">
                              <div className="text-center mb-4">
                                <Avatar className="w-16 h-16 mx-auto mb-3">
                                  <AvatarImage src={user.profileImageUrl} />
                                  <AvatarFallback>
                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <h3 className="font-semibold text-white mb-1">
                                  {user.firstName} {user.lastName}
                                </h3>
                                <p className="text-sm text-white/70">{user.email}</p>
                              </div>
                              
                              {user.stats && (
                                <div className="space-y-2 mb-4 text-sm">
                                  <div className="flex justify-between items-center">
                                    <span className="text-white/70">Niveau:</span>
                                    <span className="text-blue-400 font-semibold">
                                      {user.stats.level}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-white/70">XP Total:</span>
                                    <span className="text-green-400 font-semibold">
                                      {user.stats.totalXP}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-white/70">Modules:</span>
                                    <span className="text-purple-400 font-semibold">
                                      {user.stats.completedModules}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-white/70">Badges:</span>
                                    <span className="text-yellow-400 font-semibold">
                                      {user.stats.totalBadges}
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              <Button
                                size="sm"
                                className="w-full"
                                onClick={() => sendFriendRequest.mutate(user.id)}
                                disabled={sendFriendRequest.isPending}
                              >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Ajouter comme ami
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      {allUsers.length === 0 && (
                        <div className="text-center py-8">
                          <Users className="w-12 h-12 mx-auto mb-4 opacity-50 text-white" />
                          <p className="text-white/70">Aucun utilisateur disponible pour le moment</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  );
}