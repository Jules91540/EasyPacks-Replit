import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navigation from "@/components/ui/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Save, X, BookOpen, Target, Award, Clock } from "lucide-react";

interface Module {
  id: number;
  title: string;
  description: string;
  content: string;
  difficulty: string;
  platform: string;
  duration: number;
  xpReward: number;
  order: number;
  isPublished: boolean;
}

interface ModuleForm {
  title: string;
  description: string;
  content: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  platform: 'twitch' | 'youtube' | 'instagram' | 'tiktok' | 'twitter';
  duration: number;
  xpReward: number;
  order: number;
  isPublished: boolean;
}

export default function AdminModulesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [moduleForm, setModuleForm] = useState<ModuleForm>({
    title: '',
    description: '',
    content: '',
    difficulty: 'beginner',
    platform: 'twitch',
    duration: 30,
    xpReward: 100,
    order: 1,
    isPublished: false
  });

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ["/api/admin/modules"],
  });

  const createModuleMutation = useMutation({
    mutationFn: async (moduleData: ModuleForm) => {
      const response = await fetch("/api/admin/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(moduleData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create module');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Module créé",
        description: "Le module a été créé avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/modules"] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le module",
        variant: "destructive",
      });
    },
  });

  const updateModuleMutation = useMutation({
    mutationFn: async ({ id, moduleData }: { id: number; moduleData: Partial<ModuleForm> }) => {
      const response = await fetch(`/api/admin/modules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(moduleData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update module');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Module mis à jour",
        description: "Le module a été modifié avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/modules"] });
      setIsEditDialogOpen(false);
      setEditingModule(null);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le module",
        variant: "destructive",
      });
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/modules/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete module');
      }
      
      return response.status === 204 ? null : response.json();
    },
    onSuccess: () => {
      toast({
        title: "Module supprimé",
        description: "Le module a été supprimé avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/modules"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le module",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setModuleForm({
      title: '',
      description: '',
      content: '',
      difficulty: 'beginner',
      platform: 'twitch',
      duration: 30,
      xpReward: 100,
      order: 1,
      isPublished: false
    });
  };

  const openEditDialog = (module: Module) => {
    setEditingModule(module);
    setModuleForm({
      title: module.title,
      description: module.description,
      content: module.content,
      difficulty: module.difficulty as ModuleForm['difficulty'],
      platform: module.platform as ModuleForm['platform'],
      duration: module.duration,
      xpReward: module.xpReward,
      order: module.order,
      isPublished: module.isPublished
    });
    setIsEditDialogOpen(true);
  };

  const handleCreateModule = () => {
    createModuleMutation.mutate(moduleForm);
  };

  const handleUpdateModule = () => {
    if (editingModule) {
      updateModuleMutation.mutate({ id: editingModule.id, moduleData: moduleForm });
    }
  };

  const handleDeleteModule = (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce module ?')) {
      deleteModuleMutation.mutate(id);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'twitch': return 'bg-purple-500';
      case 'youtube': return 'bg-red-500';
      case 'instagram': return 'bg-pink-500';
      case 'tiktok': return 'bg-black';
      case 'twitter': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex overflow-hidden">
        <Navigation variant="admin" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg text-muted-foreground">Chargement des modules...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <Navigation variant="admin" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-background border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Gestion des Modules</h1>
              <p className="text-muted-foreground">Créez et gérez les formations de votre plateforme</p>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Module
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Créer un nouveau module</DialogTitle>
                </DialogHeader>
                <ModuleFormContent 
                  moduleForm={moduleForm}
                  setModuleForm={setModuleForm}
                  onSave={handleCreateModule}
                  onCancel={() => setIsCreateDialogOpen(false)}
                  isLoading={createModuleMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            {modules.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun module créé</h3>
                  <p className="text-muted-foreground mb-4">
                    Commencez par créer votre premier module de formation.
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer le premier module
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {modules.map((module: Module) => (
                  <Card key={module.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-lg">{module.title}</CardTitle>
                            <Badge 
                              className={`text-white ${getDifficultyColor(module.difficulty)}`}
                            >
                              {module.difficulty}
                            </Badge>
                            <Badge 
                              className={`text-white ${getPlatformColor(module.platform)}`}
                            >
                              {module.platform}
                            </Badge>
                            {module.isPublished ? (
                              <Badge variant="default">Publié</Badge>
                            ) : (
                              <Badge variant="secondary">Brouillon</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{module.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditDialog(module)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteModule(module.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{module.duration} min</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          <span>{module.xpReward} XP</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span>Ordre: {module.order}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier le module</DialogTitle>
            </DialogHeader>
            <ModuleFormContent 
              moduleForm={moduleForm}
              setModuleForm={setModuleForm}
              onSave={handleUpdateModule}
              onCancel={() => setIsEditDialogOpen(false)}
              isLoading={updateModuleMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function ModuleFormContent({ 
  moduleForm, 
  setModuleForm, 
  onSave, 
  onCancel, 
  isLoading 
}: {
  moduleForm: ModuleForm;
  setModuleForm: (form: ModuleForm) => void;
  onSave: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Titre du module</Label>
          <Input
            id="title"
            value={moduleForm.title}
            onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
            placeholder="Ex: Introduction au streaming"
          />
        </div>
        <div>
          <Label htmlFor="platform">Plateforme</Label>
          <Select 
            value={moduleForm.platform} 
            onValueChange={(value) => setModuleForm({ ...moduleForm, platform: value as ModuleForm['platform'] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="twitch">Twitch</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="twitter">Twitter/X</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={moduleForm.description}
          onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
          placeholder="Description courte du module..."
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="content">Contenu du module</Label>
        <Textarea
          id="content"
          value={moduleForm.content}
          onChange={(e) => setModuleForm({ ...moduleForm, content: e.target.value })}
          placeholder="Contenu détaillé du module en markdown..."
          rows={6}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="difficulty">Difficulté</Label>
          <Select 
            value={moduleForm.difficulty} 
            onValueChange={(value) => setModuleForm({ ...moduleForm, difficulty: value as ModuleForm['difficulty'] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Débutant</SelectItem>
              <SelectItem value="intermediate">Intermédiaire</SelectItem>
              <SelectItem value="advanced">Avancé</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="duration">Durée (minutes)</Label>
          <Input
            id="duration"
            type="number"
            value={moduleForm.duration}
            onChange={(e) => setModuleForm({ ...moduleForm, duration: parseInt(e.target.value) || 0 })}
            min="1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="xpReward">Récompense XP</Label>
          <Input
            id="xpReward"
            type="number"
            value={moduleForm.xpReward}
            onChange={(e) => setModuleForm({ ...moduleForm, xpReward: parseInt(e.target.value) || 0 })}
            min="0"
          />
        </div>
        <div>
          <Label htmlFor="order">Ordre d'affichage</Label>
          <Input
            id="order"
            type="number"
            value={moduleForm.order}
            onChange={(e) => setModuleForm({ ...moduleForm, order: parseInt(e.target.value) || 1 })}
            min="1"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isPublished"
          checked={moduleForm.isPublished}
          onChange={(e) => setModuleForm({ ...moduleForm, isPublished: e.target.checked })}
          className="rounded border-gray-300"
        />
        <Label htmlFor="isPublished">Publier le module</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Annuler
        </Button>
        <Button onClick={onSave} disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>
    </div>
  );
}