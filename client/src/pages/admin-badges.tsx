import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import Navigation from "@/components/ui/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Save, X, Award, Users, Trophy } from "lucide-react";

interface BadgeType {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  criteria: string;
  xpRequired: number;
  isActive: boolean;
}

interface BadgeForm {
  name: string;
  description: string;
  icon: string;
  color: string;
  criteria: string;
  xpRequired: number;
  isActive: boolean;
}

const badgeIcons = [
  '🏆', '🥇', '🥈', '🥉', '⭐', '🌟', '💎', '👑', 
  '🎯', '🚀', '💪', '🔥', '⚡', '🎖️', '🏅', '🎗️'
];

const badgeColors = [
  { name: 'Or', value: '#FFD700' },
  { name: 'Argent', value: '#C0C0C0' },
  { name: 'Bronze', value: '#CD7F32' },
  { name: 'Bleu', value: '#3B82F6' },
  { name: 'Vert', value: '#10B981' },
  { name: 'Rouge', value: '#EF4444' },
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Rose', value: '#EC4899' },
];

export default function AdminBadgesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<BadgeType | null>(null);
  const [badgeForm, setBadgeForm] = useState<BadgeForm>({
    name: '',
    description: '',
    icon: '🏆',
    color: '#FFD700',
    criteria: '',
    xpRequired: 100,
    isActive: true
  });

  const { data: badges = [], isLoading } = useQuery({
    queryKey: ["/api/admin/badges"],
  });

  const createBadgeMutation = useMutation({
    mutationFn: async (badgeData: BadgeForm) => {
      const response = await fetch("/api/admin/badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(badgeData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create badge');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Badge créé",
        description: "Le badge a été créé avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/badges"] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le badge",
        variant: "destructive",
      });
    },
  });

  const updateBadgeMutation = useMutation({
    mutationFn: async ({ id, badgeData }: { id: number; badgeData: Partial<BadgeForm> }) => {
      const response = await fetch(`/api/admin/badges/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(badgeData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update badge');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Badge mis à jour",
        description: "Le badge a été modifié avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/badges"] });
      setIsEditDialogOpen(false);
      setEditingBadge(null);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le badge",
        variant: "destructive",
      });
    },
  });

  const deleteBadgeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/badges/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete badge');
      }
      
      return response.status === 204 ? null : response.json();
    },
    onSuccess: () => {
      toast({
        title: "Badge supprimé",
        description: "Le badge a été supprimé avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/badges"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le badge",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setBadgeForm({
      name: '',
      description: '',
      icon: '🏆',
      color: '#FFD700',
      criteria: '',
      xpRequired: 100,
      isActive: true
    });
  };

  const openEditDialog = (badge: BadgeType) => {
    setEditingBadge(badge);
    setBadgeForm({
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      color: badge.color,
      criteria: badge.criteria,
      xpRequired: badge.xpRequired,
      isActive: badge.isActive
    });
    setIsEditDialogOpen(true);
  };

  const handleCreateBadge = () => {
    createBadgeMutation.mutate(badgeForm);
  };

  const handleUpdateBadge = () => {
    if (editingBadge) {
      updateBadgeMutation.mutate({ id: editingBadge.id, badgeData: badgeForm });
    }
  };

  const handleDeleteBadge = (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce badge ?')) {
      deleteBadgeMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex overflow-hidden">
        <Navigation variant="admin" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg text-muted-foreground">Chargement des badges...</p>
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
              <h1 className="text-2xl font-bold text-foreground">Gestion des Badges</h1>
              <p className="text-muted-foreground">Créez et gérez les récompenses pour motiver vos étudiants</p>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Badge
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Créer un nouveau badge</DialogTitle>
                </DialogHeader>
                <BadgeFormContent 
                  badgeForm={badgeForm}
                  setBadgeForm={setBadgeForm}
                  onSave={handleCreateBadge}
                  onCancel={() => setIsCreateDialogOpen(false)}
                  isLoading={createBadgeMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            {badges.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun badge créé</h3>
                  <p className="text-muted-foreground mb-4">
                    Commencez par créer votre premier badge de récompense.
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer le premier badge
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {badges.map((badge: BadgeType) => (
                  <Card key={badge.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                            style={{ backgroundColor: badge.color + '20', border: `2px solid ${badge.color}` }}
                          >
                            {badge.icon}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{badge.name}</CardTitle>
                            {badge.isActive ? (
                              <Badge variant="default">Actif</Badge>
                            ) : (
                              <Badge variant="secondary">Inactif</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditDialog(badge)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteBadge(badge.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">{badge.description}</p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">XP requis:</span>
                          <span className="font-medium">{badge.xpRequired} XP</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Critères:</span>
                          <p className="text-xs mt-1 p-2 bg-muted rounded">{badge.criteria}</p>
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
              <DialogTitle>Modifier le badge</DialogTitle>
            </DialogHeader>
            <BadgeFormContent 
              badgeForm={badgeForm}
              setBadgeForm={setBadgeForm}
              onSave={handleUpdateBadge}
              onCancel={() => setIsEditDialogOpen(false)}
              isLoading={updateBadgeMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function BadgeFormContent({ 
  badgeForm, 
  setBadgeForm, 
  onSave, 
  onCancel, 
  isLoading 
}: {
  badgeForm: BadgeForm;
  setBadgeForm: (form: BadgeForm) => void;
  onSave: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nom du badge</Label>
          <Input
            id="name"
            value={badgeForm.name}
            onChange={(e) => setBadgeForm({ ...badgeForm, name: e.target.value })}
            placeholder="Ex: Premier Pas"
          />
        </div>
        <div>
          <Label htmlFor="xpRequired">XP requis</Label>
          <Input
            id="xpRequired"
            type="number"
            value={badgeForm.xpRequired}
            onChange={(e) => setBadgeForm({ ...badgeForm, xpRequired: parseInt(e.target.value) || 0 })}
            min="0"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={badgeForm.description}
          onChange={(e) => setBadgeForm({ ...badgeForm, description: e.target.value })}
          placeholder="Description du badge..."
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="criteria">Critères d'obtention</Label>
        <Textarea
          id="criteria"
          value={badgeForm.criteria}
          onChange={(e) => setBadgeForm({ ...badgeForm, criteria: e.target.value })}
          placeholder="Décrivez comment obtenir ce badge..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Icône</Label>
          <div className="grid grid-cols-8 gap-2 mt-2">
            {badgeIcons.map((icon) => (
              <button
                key={icon}
                type="button"
                className={`w-8 h-8 rounded border-2 flex items-center justify-center text-lg hover:bg-gray-100 ${
                  badgeForm.icon === icon ? 'border-primary bg-primary/10' : 'border-gray-300'
                }`}
                onClick={() => setBadgeForm({ ...badgeForm, icon })}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Couleur</Label>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {badgeColors.map((color) => (
              <button
                key={color.value}
                type="button"
                className={`w-8 h-8 rounded border-2 ${
                  badgeForm.color === color.value ? 'border-gray-800 ring-2 ring-gray-400' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color.value }}
                onClick={() => setBadgeForm({ ...badgeForm, color: color.value })}
                title={color.name}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={badgeForm.isActive}
          onChange={(e) => setBadgeForm({ ...badgeForm, isActive: e.target.checked })}
          className="rounded border-gray-300"
        />
        <Label htmlFor="isActive">Badge actif</Label>
      </div>

      {/* Preview */}
      <div className="p-4 border rounded-lg">
        <Label className="text-sm font-medium">Aperçu</Label>
        <div className="flex items-center space-x-3 mt-2">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{ backgroundColor: badgeForm.color + '20', border: `2px solid ${badgeForm.color}` }}
          >
            {badgeForm.icon}
          </div>
          <div>
            <h3 className="font-medium">{badgeForm.name || 'Nom du badge'}</h3>
            <p className="text-sm text-muted-foreground">{badgeForm.description || 'Description du badge'}</p>
          </div>
        </div>
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