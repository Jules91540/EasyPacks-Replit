import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AutoRefresh } from "@/components/AutoRefresh";
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
import { IncomingCallPopup } from "@/components/IncomingCallPopup";
import { MessageWithReactions } from "@/components/MessageWithReactions";
import { UserProfile } from "@/components/UserProfile";
import FixedMessaging from "@/components/FixedMessaging";
import EnhancedMessaging from "@/components/EnhancedMessaging";
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
  Monitor,
  MoreHorizontal,
  Check,
  X,
  Bell,
  Mail,
  Plus,
  Globe,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
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
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  
  // Call states
  const [incomingCall, setIncomingCall] = useState<{
    visible: boolean;
    caller?: User;
    callId?: number;
  }>({ visible: false });
  const [activeCall, setActiveCall] = useState<{
    active: boolean;
    participant?: User;
    isScreenSharing: boolean;
    isMuted: boolean;
    isVideoOn: boolean;
  }>({ active: false, isScreenSharing: false, isMuted: false, isVideoOn: true });
  
  // User profile modal
  const [selectedProfile, setSelectedProfile] = useState<User | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);

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

  // Fetch messages for selected conversation
  const { data: currentMessages = [] } = useQuery({
    queryKey: ["/api/conversations", selectedUser?.id],
    enabled: !!user && !!selectedUser,
    refetchInterval: 2000, // Refresh every 2 seconds for real-time updates
  });

  // Helper function to get conversation messages
  const getConversationMessages = (userId: string) => {
    // Use current messages if this is the selected user, otherwise get from conversations
    if (selectedUser?.id === userId && currentMessages.length > 0) {
      return currentMessages;
    }
    const conversation = conversations?.find((conv: any) => 
      conv.participant1Id === userId || conv.participant2Id === userId
    );
    return conversation?.messages || [];
  };

  // Helper function to check if user is already a friend or has pending request
  const getUserFriendshipStatus = (userId: string) => {
    // Check if already a friend
    const isFriend = friends?.some((friend: any) => friend.id === userId);
    if (isFriend) return 'friend';
    
    // Check if request is pending (sent by current user)
    const sentRequest = friendRequests?.some((req: any) => 
      req.receiverId === userId && req.status === 'pending'
    );
    if (sentRequest) return 'pending';
    
    return 'none';
  };

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
      const response = await fetch(`/api/friends/accept/${friendshipId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
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
      const response = await fetch(`/api/friends/reject/${friendshipId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests/pending"] });
    },
  });

  // Like post mutation
  const likePost = useMutation({
    mutationFn: async (postId: number) => {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (data: { receiverId: string; content: string }) => {
      const response = await fetch("/api/messages", {
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
      // Invalidate both conversations and the specific conversation
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      if (selectedUser) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/conversations", selectedUser.id] 
        });
      }
      // Force immediate refetch of current conversation
      queryClient.refetchQueries({ 
        queryKey: ["/api/conversations", selectedUser?.id] 
      });
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
      const response = await fetch("/api/calls", {
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
      toast({
        title: "Appel initié",
        description: "L'appel a été lancé",
      });
    },
  });

  // Remove friend mutation
  const removeFriend = useMutation({
    mutationFn: async (friendId: string) => {
      const response = await fetch(`/api/friends/remove/${friendId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({
        title: "Ami retiré",
        description: "L'ami a été retiré de votre liste",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message.includes("already exists") ? "Cette amitié n'existe plus" : "Impossible de retirer cet ami",
        variant: "destructive",
      });
    },
  });

  // Mark all notifications as read mutation
  const markAllNotificationsRead = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/social"] });
    },
  });

  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;
    
    createPost.mutate({
      content: newPostContent,
      visibility: newPostVisibility,
    });
  };

  // Handle user profile clicks
  const handleUserClick = (clickedUser: User) => {
    setSelectedProfile(clickedUser);
    setShowUserProfile(true);
  };

  // Handle screen sharing toggle
  const toggleScreenShare = async () => {
    if (!activeCall.active) return;
    
    try {
      if (!activeCall.isScreenSharing) {
        // Start screen sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        setActiveCall(prev => ({ ...prev, isScreenSharing: true }));
        toast({
          title: "Partage d'écran activé",
          description: "Votre écran est maintenant partagé",
        });
      } else {
        // Stop screen sharing
        setActiveCall(prev => ({ ...prev, isScreenSharing: false }));
        toast({
          title: "Partage d'écran désactivé",
          description: "Le partage d'écran a été arrêté",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de partager l'écran",
        variant: "destructive",
      });
    }
  };

  // Handle call functions
  const handleStartCall = (userId: string) => {
    initiateCall.mutate({ receiverId: userId, callType: "audio" });
    setActiveCall({
      active: true,
      participant: allUsers?.find((u: User) => u.id === userId),
      isScreenSharing: false,
      isMuted: false,
      isVideoOn: false
    });
  };

  const handleStartVideoCall = (userId: string) => {
    initiateCall.mutate({ receiverId: userId, callType: "video" });
    setActiveCall({
      active: true,
      participant: allUsers?.find((u: User) => u.id === userId),
      isScreenSharing: false,
      isMuted: false,
      isVideoOn: true
    });
  };

  const handleStartMessage = (userId: string) => {
    setSelectedConversation(userId);
    setActiveTab("messages");
  };

  // Handle incoming call
  const handleAcceptCall = () => {
    setActiveCall({
      active: true,
      participant: incomingCall.caller,
      isScreenSharing: false,
      isMuted: false,
      isVideoOn: true
    });
    setIncomingCall({ visible: false });
  };

  const handleRejectCall = () => {
    setIncomingCall({ visible: false });
  };

  const handleEndCall = () => {
    setActiveCall({ active: false, isScreenSharing: false, isMuted: false, isVideoOn: true });
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
    <div className="flex min-h-screen bg-background">
      <AutoRefresh enabled={true} interval={1000} />
      <Navigation variant="student" />
      
      <main className="flex-1 p-4 md:ml-20 min-h-screen">
        <div className="flex flex-col h-full">
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
              <TabsTrigger value="requests" className="relative">
                Demandes ({friendRequests.length})
                {friendRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {friendRequests.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="search">Découvrir</TabsTrigger>
            </TabsList>

            <div className="flex-1 mt-4 overflow-y-auto max-h-[calc(100vh-200px)]">
              <TabsContent value="feed" className="space-y-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                          {friends.slice(0, 5).map((friend: User, index: number) => (
                            <div key={`dashboard-friend-${friend.id}-${index}`} className="flex items-center space-x-3">
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

              <TabsContent value="friends" className="overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                  {friends.map((friend: User, index: number) => (
                    <Card key={`friends-tab-${friend.id}-${index}`}>
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

              <TabsContent value="messages" className="h-full overflow-hidden">
                <div className="h-[calc(100vh-160px)]">
                  <FixedMessaging />
                </div>
              </TabsContent>

              <TabsContent value="search" className="overflow-y-auto">
                <div className="space-y-6 pb-16">
                  {searchQuery.length >= 2 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {searchResults.map((user: User) => (
                        <Card key={`search-result-${user.id}`}>
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
                        {allUsers.map((user: any, index: number) => (
                          <Card key={`discover-user-${user.id}-${index}`}>
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

      {/* User Profile Modal */}
      <UserProfile
        user={selectedProfile}
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        currentUserId={user?.id}
        friends={friends as User[]}
        onAddFriend={(userId) => sendFriendRequest.mutate({ receiverId: userId })}
        onRemoveFriend={(userId) => removeFriend.mutate(userId)}
        onStartCall={handleStartCall}
        onStartVideoCall={handleStartVideoCall}
        onStartMessage={handleStartMessage}
      />

      {/* Incoming Call Popup */}
      <IncomingCallPopup
        isVisible={incomingCall.visible}
        caller={incomingCall.caller!}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
        onClose={() => setIncomingCall({ visible: false })}
      />

      {/* Active Call Interface */}
      {activeCall.active && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <Avatar className="w-20 h-20 mx-auto mb-4">
                <AvatarImage src={activeCall.participant?.profileImageUrl} />
                <AvatarFallback className="text-2xl">
                  {activeCall.participant?.firstName[0]}{activeCall.participant?.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold text-white">
                {activeCall.participant?.firstName} {activeCall.participant?.lastName}
              </h3>
              <p className="text-gray-400">
                {activeCall.isVideoOn ? "Appel vidéo" : "Appel audio"} en cours
              </p>
              {activeCall.isScreenSharing && (
                <p className="text-blue-400 text-sm mt-2">Partage d'écran actif</p>
              )}
            </div>

            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveCall(prev => ({ ...prev, isMuted: !prev.isMuted }))}
                className={activeCall.isMuted ? "bg-red-600 text-white" : ""}
              >
                {activeCall.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              
              {activeCall.isVideoOn && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleScreenShare}
                  className={activeCall.isScreenSharing ? "bg-blue-600 text-white" : ""}
                >
                  <Monitor className="w-4 h-4" />
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveCall(prev => ({ ...prev, isVideoOn: !prev.isVideoOn }))}
                className={!activeCall.isVideoOn ? "bg-red-600 text-white" : ""}
              >
                {activeCall.isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={handleEndCall}
              >
                <PhoneOff className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}