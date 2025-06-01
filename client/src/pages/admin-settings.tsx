import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/ui/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Database, Shield, Bell, Globe, Palette } from "lucide-react";

export default function AdminSettingsPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user as any)?.role !== 'admin')) {
      toast({
        title: "Accès refusé",
        description: "Vous devez être administrateur. Redirection...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex overflow-hidden">
        <Navigation variant="admin" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg text-muted-foreground">Chargement des paramètres...</p>
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
        <header className="bg-background border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Paramètres</h1>
              <p className="text-muted-foreground mt-1">
                Configuration de la plateforme
              </p>
            </div>
            <Badge variant="outline" className="px-3 py-1">
              <Settings className="h-4 w-4 mr-1" />
              Administration
            </Badge>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* System Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Database className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Système</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Configuration générale de la plateforme
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Base de données</h4>
                      <p className="text-sm text-muted-foreground">Statut de la connexion</p>
                    </div>
                    <Badge variant="default" className="bg-green-500">En ligne</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Version de l'application</h4>
                      <p className="text-sm text-muted-foreground">Version actuelle</p>
                    </div>
                    <span className="text-sm font-mono">v1.0.0</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Maintenance</h4>
                      <p className="text-sm text-muted-foreground">Mode maintenance</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Activer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Sécurité</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Paramètres de sécurité et authentification
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Authentification Google</h4>
                      <p className="text-sm text-muted-foreground">OAuth 2.0 activé</p>
                    </div>
                    <Badge variant="default" className="bg-green-500">Configuré</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Sessions utilisateur</h4>
                      <p className="text-sm text-muted-foreground">Durée des sessions</p>
                    </div>
                    <span className="text-sm">7 jours</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Chiffrement des données</h4>
                      <p className="text-sm text-muted-foreground">Chiffrement activé</p>
                    </div>
                    <Badge variant="default" className="bg-green-500">Actif</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Bell className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Notifications</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Gestion des notifications système
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Notifications par email</h4>
                      <p className="text-sm text-muted-foreground">Alerts administrateur</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configurer
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Alertes système</h4>
                      <p className="text-sm text-muted-foreground">Notifications critiques</p>
                    </div>
                    <Badge variant="default" className="bg-green-500">Activées</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Platform Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Globe className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Plateforme</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Configuration de la plateforme d'apprentissage
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Langue par défaut</h4>
                      <p className="text-sm text-muted-foreground">Langue de l'interface</p>
                    </div>
                    <span className="text-sm">Français</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Inscriptions ouvertes</h4>
                      <p className="text-sm text-muted-foreground">Nouveaux utilisateurs</p>
                    </div>
                    <Badge variant="default" className="bg-green-500">Autorisées</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Mode de test</h4>
                      <p className="text-sm text-muted-foreground">Environnement de développement</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Désactiver
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Theme Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Palette className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Apparence</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Personnalisation de l'interface
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Thème sombre</h4>
                      <p className="text-sm text-muted-foreground">Interface utilisateur</p>
                    </div>
                    <Badge variant="default" className="bg-blue-500">Activé</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Couleur principale</h4>
                      <p className="text-sm text-muted-foreground">Couleur de marque</p>
                    </div>
                    <div className="w-6 h-6 bg-primary rounded border-2 border-gray-300"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Actions */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button variant="outline">
                Réinitialiser
              </Button>
              <Button>
                Sauvegarder les modifications
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}