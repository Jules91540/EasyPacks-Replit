import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/ui/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Edit2, Save, X, Award, BarChart3, Calendar, Trophy, Camera, Upload, Key, Mail, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  
  // Modal states
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  
  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Email preferences
  const [emailPreferences, setEmailPreferences] = useState({
    marketing: false,
    notifications: true,
    weeklyDigest: true
  });
  
  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisible: true,
    showBadges: true,
    showProgress: false
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Non autorisé",
        description: "Vous devez être connecté. Redirection...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setEditForm({
        firstName: (user as any).firstName || '',
        lastName: (user as any).lastName || '',
        email: (user as any).email || ''
      });
    }
  }, [user]);

  // Fetch additional user data
  const { data: progress = [] } = useQuery({
    queryKey: ["/api/progress"],
    enabled: isAuthenticated,
  });

  const { data: quizAttempts = [] } = useQuery({
    queryKey: ["/api/quiz-attempts"],
    enabled: isAuthenticated,
  });

  const { data: userBadges = [] } = useQuery({
    queryKey: ["/api/user-badges"],
    enabled: isAuthenticated,
  });

  // Calculate user statistics
  const completedModules = (progress as any[]).filter(p => p.status === 'completed').length;
  const totalQuizAttempts = (quizAttempts as any[]).length;
  const passedQuizzes = (quizAttempts as any[]).filter(attempt => attempt.passed).length;
  const averageScore = totalQuizAttempts > 0 
    ? Math.round((quizAttempts as any[]).reduce((sum, attempt) => sum + attempt.score, 0) / totalQuizAttempts)
    : 0;

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      setEditForm({
        firstName: (user as any).firstName || '',
        lastName: (user as any).lastName || '',
        email: (user as any).email || ''
      });
    }
  };

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string }) => {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées avec succès",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil",
        variant: "destructive",
      });
    },
  });

  // Photo upload mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await fetch('/api/profile/upload-photo', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Photo mise à jour",
        description: "Votre photo de profil a été mise à jour",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      let errorMessage = "Impossible de mettre à jour la photo";
      
      // Parse error message from server response
      if (error.message) {
        if (error.message.includes('trop volumineux')) {
          errorMessage = "Le fichier est trop volumineux. Taille maximum: 20MB";
        } else if (error.message.includes('image')) {
          errorMessage = "Seuls les fichiers image sont autorisés";
        }
      }
      
      toast({
        title: "Erreur d'upload",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await fetch("/api/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Échec du changement de mot de passe');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Mot de passe modifié",
        description: "Votre mot de passe a été mis à jour avec succès",
      });
      setPasswordModalOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de changer le mot de passe",
        variant: "destructive",
      });
    },
  });

  // Email preferences mutation
  const updateEmailPreferencesMutation = useMutation({
    mutationFn: async (data: typeof emailPreferences) => {
      const response = await fetch("/api/email-preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Échec de la mise à jour des préférences email');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Préférences sauvegardées",
        description: "Vos préférences email ont été mises à jour",
      });
      setEmailModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder les préférences",
        variant: "destructive",
      });
    },
  });

  // Privacy settings mutation
  const updatePrivacySettingsMutation = useMutation({
    mutationFn: async (data: typeof privacySettings) => {
      const response = await fetch("/api/privacy-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Échec de la mise à jour des paramètres de confidentialité');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Paramètres sauvegardés",
        description: "Vos paramètres de confidentialité ont été mis à jour",
      });
      setPrivacyModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder les paramètres",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate({
      firstName: editForm.firstName,
      lastName: editForm.lastName,
    });
  };

  const handlePasswordChange = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  const handleEmailPreferencesUpdate = () => {
    updateEmailPreferencesMutation.mutate(emailPreferences);
  };

  const handlePrivacySettingsUpdate = () => {
    updatePrivacySettingsMutation.mutate(privacySettings);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadPhotoMutation.mutate(file);
    }
  };

  const getLevelName = (level: number) => {
    if (level === 1) return 'Débutant';
    if (level === 2) return 'Novice';
    if (level === 3) return 'Intermédiaire';
    if (level === 4) return 'Avancé';
    return 'Expert';
  };

  const getNextLevelXP = (level: number) => {
    return Math.pow(level, 2) * 100;
  };

  const getCurrentLevelXP = (level: number) => {
    return Math.pow(level - 1, 2) * 100;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  const currentLevel = (user as any)?.level || 1;
  const currentXP = (user as any)?.xp || 0;
  const nextLevelXP = getNextLevelXP(currentLevel);
  const currentLevelXP = getCurrentLevelXP(currentLevel);
  const xpInCurrentLevel = currentXP - currentLevelXP;
  const xpNeededForCurrentLevel = nextLevelXP - currentLevelXP;

  // Determine navigation variant based on user role
  const navigationVariant = (user as any)?.role === 'admin' ? 'admin' : 'student';

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Sidebar */}
      <Navigation variant={navigationVariant} />
      
      {/* Main Content with left margin for desktop sidebar */}
      <div className="md:ml-20 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden bg-background shadow-sm border-b border-border p-4">
          <div className="flex items-center justify-between">
            <Navigation variant={navigationVariant} />
            <h1 className="text-lg font-bold text-white">Mon Profil</h1>
            <div></div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 overflow-y-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="bg-primary text-white w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white heading-french">Mon Profil</h1>
                  <p className="text-gray-300 subtitle-french">
                    Gérez vos informations personnelles et consultez vos statistiques
                  </p>
                </div>
              </div>
              
              {!isEditing && (
                <Button onClick={handleEdit} variant="outline">
                  <Edit2 className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Information */}
            <div className="lg:col-span-1">
              <Card className="gradient-blue-card">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="relative inline-block">
                      {(user as any)?.profileImageUrl ? (
                        <img 
                          src={(user as any).profileImageUrl} 
                          alt="Photo de profil" 
                          className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold">
                          {((user as any)?.firstName?.[0] || 'U').toUpperCase()}
                        </div>
                      )}
                      
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/80 transition-colors shadow-lg"
                        disabled={uploadPhotoMutation.isPending}
                      >
                        {uploadPhotoMutation.isPending ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                      </button>
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </div>
                    
                    <div className="mt-4">
                      <Badge className="level-badge text-white px-3 py-1">
                        Niveau {currentLevel} - {getLevelName(currentLevel)}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {isEditing ? (
                      <>
                        <div>
                          <Label htmlFor="firstName" className="text-sm font-medium text-white">
                            Prénom
                          </Label>
                          <Input
                            id="firstName"
                            value={editForm.firstName}
                            onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="lastName" className="text-sm font-medium text-white">
                            Nom
                          </Label>
                          <Input
                            id="lastName"
                            value={editForm.lastName}
                            onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="email" className="text-sm font-medium text-white">
                            Email
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                            className="mt-1"
                          />
                        </div>

                        <div className="flex space-x-3 pt-4">
                          <Button onClick={handleSave} className="flex-1">
                            <Save className="mr-2 h-4 w-4" />
                            Sauvegarder
                          </Button>
                          <Button onClick={handleCancel} variant="outline" className="flex-1">
                            <X className="mr-2 h-4 w-4" />
                            Annuler
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Nom complet</p>
                          <p className="text-gray-900">
                            {(user as any)?.firstName || ''} {(user as any)?.lastName || ''}
                          </p>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700">Email</p>
                          <p className="text-gray-900">{(user as any)?.email || 'Non renseigné'}</p>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700">Membre depuis</p>
                          <p className="text-gray-900">
                            {(user as any)?.createdAt 
                              ? new Date((user as any).createdAt).toLocaleDateString('fr-FR')
                              : 'Récemment'
                            }
                          </p>
                        </div>
                        
                        <div className="pt-4">
                          <Button onClick={() => setIsEditing(true)} className="w-full">
                            <Edit2 className="mr-2 h-4 w-4" />
                            Modifier le Profil
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* XP Progress */}
              <Card className="gradient-card mt-6">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 heading-french">
                    Progression XP
                  </h3>
                  
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-primary">{currentXP} XP</div>
                    <p className="text-sm text-gray-600">
                      {Math.max(xpNeededForCurrentLevel - xpInCurrentLevel, 0)} XP pour le niveau {currentLevel + 1}
                    </p>
                  </div>
                  
                  <div className="bg-gray-200 rounded-full h-3 mb-4">
                    <div 
                      className="xp-progress h-3 rounded-full transition-all duration-1000" 
                      style={{ width: `${Math.min((xpInCurrentLevel / xpNeededForCurrentLevel) * 100, 100)}%` }}
                    ></div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center text-sm">
                    <div>
                      <p className="font-medium text-gray-800">Niveau Actuel</p>
                      <p className="text-primary">{currentLevel}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Prochain Niveau</p>
                      <p className="text-primary">{currentLevel + 1}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Statistics and Activity */}
            <div className="lg:col-span-2 space-y-8">
              {/* Statistics Overview */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6 heading-french">
                  Statistiques d'Activité
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <Card className="gradient-card">
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="bg-green-100 text-green-600 w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                          <Trophy className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-800">{completedModules}</p>
                          <p className="text-gray-600 text-sm">Modules terminés</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="gradient-card">
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="bg-blue-100 text-primary w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                          <BarChart3 className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-800">{averageScore}%</p>
                          <p className="text-gray-600 text-sm">Score moyen aux quiz</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="gradient-card">
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="bg-purple-100 text-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                          <Award className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-800">{Array.isArray(userBadges) ? userBadges.length : 0}</p>
                          <p className="text-gray-600 text-sm">Badges obtenus</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="gradient-card">
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="bg-orange-100 text-orange-600 w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                          <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-800">{passedQuizzes}</p>
                          <p className="text-gray-600 text-sm">Quiz réussis</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Recent Activity */}
              <Card className="gradient-card">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 heading-french">
                    Activité Récente
                  </h3>
                  
                  {totalQuizAttempts > 0 || completedModules > 0 ? (
                    <div className="space-y-4">
                      {completedModules > 0 && (
                        <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                          <div className="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center">
                            <Trophy className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">
                              {completedModules} module{completedModules > 1 ? 's' : ''} terminé{completedModules > 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-gray-600">Félicitations pour votre progression !</p>
                          </div>
                        </div>
                      )}
                      
                      {passedQuizzes > 0 && (
                        <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                          <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center">
                            <BarChart3 className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">
                              {passedQuizzes} quiz réussi{passedQuizzes > 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-gray-600">Score moyen: {averageScore}%</p>
                          </div>
                        </div>
                      )}
                      
                      {Array.isArray(userBadges) && userBadges.length > 0 && (
                        <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                          <div className="bg-yellow-500 text-white w-8 h-8 rounded-full flex items-center justify-center">
                            <Award className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">
                              {userBadges.length} badge{userBadges.length > 1 ? 's' : ''} obtenu{userBadges.length > 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-gray-600">Continuez vos efforts !</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Aucune activité récente</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Commencez un module pour voir votre activité ici
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Account Settings */}
              <Card className="gradient-card">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 heading-french">
                    Paramètres du Compte
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-card border rounded-lg">
                      <div>
                        <p className="font-medium text-card-foreground flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Notifications par email
                        </p>
                        <p className="text-sm text-muted-foreground">Recevez des mises à jour sur votre progression</p>
                      </div>
                      <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Configurer
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Préférences Email</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="marketing">Emails marketing</Label>
                              <Switch
                                id="marketing"
                                checked={emailPreferences.marketing}
                                onCheckedChange={(checked) => 
                                  setEmailPreferences(prev => ({ ...prev, marketing: checked }))
                                }
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="notifications">Notifications</Label>
                              <Switch
                                id="notifications"
                                checked={emailPreferences.notifications}
                                onCheckedChange={(checked) => 
                                  setEmailPreferences(prev => ({ ...prev, notifications: checked }))
                                }
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="weekly">Résumé hebdomadaire</Label>
                              <Switch
                                id="weekly"
                                checked={emailPreferences.weeklyDigest}
                                onCheckedChange={(checked) => 
                                  setEmailPreferences(prev => ({ ...prev, weeklyDigest: checked }))
                                }
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setEmailModalOpen(false)}>
                              Annuler
                            </Button>
                            <Button onClick={handleEmailPreferencesUpdate} disabled={updateEmailPreferencesMutation.isPending}>
                              {updateEmailPreferencesMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-card border rounded-lg">
                      <div>
                        <p className="font-medium text-card-foreground flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Confidentialité
                        </p>
                        <p className="text-sm text-muted-foreground">Gérez vos préférences de confidentialité</p>
                      </div>
                      <Dialog open={privacyModalOpen} onOpenChange={setPrivacyModalOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Modifier
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Paramètres de Confidentialité</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="profile-visible">Profil visible</Label>
                              <Switch
                                id="profile-visible"
                                checked={privacySettings.profileVisible}
                                onCheckedChange={(checked) => 
                                  setPrivacySettings(prev => ({ ...prev, profileVisible: checked }))
                                }
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="show-badges">Afficher les badges</Label>
                              <Switch
                                id="show-badges"
                                checked={privacySettings.showBadges}
                                onCheckedChange={(checked) => 
                                  setPrivacySettings(prev => ({ ...prev, showBadges: checked }))
                                }
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="show-progress">Afficher les progrès</Label>
                              <Switch
                                id="show-progress"
                                checked={privacySettings.showProgress}
                                onCheckedChange={(checked) => 
                                  setPrivacySettings(prev => ({ ...prev, showProgress: checked }))
                                }
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setPrivacyModalOpen(false)}>
                              Annuler
                            </Button>
                            <Button onClick={handlePrivacySettingsUpdate} disabled={updatePrivacySettingsMutation.isPending}>
                              {updatePrivacySettingsMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-card border rounded-lg">
                      <div>
                        <p className="font-medium text-card-foreground flex items-center gap-2">
                          <Key className="h-4 w-4" />
                          Mot de passe
                        </p>
                        <p className="text-sm text-muted-foreground">Modifiez votre mot de passe</p>
                      </div>
                      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Changer
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Changer le Mot de Passe</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="current-password">Mot de passe actuel</Label>
                              <Input
                                id="current-password"
                                type="password"
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="new-password">Nouveau mot de passe</Label>
                              <Input
                                id="new-password"
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                              <Input
                                id="confirm-password"
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setPasswordModalOpen(false)}>
                              Annuler
                            </Button>
                            <Button onClick={handlePasswordChange} disabled={changePasswordMutation.isPending}>
                              {changePasswordMutation.isPending ? "Modification..." : "Modifier"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}