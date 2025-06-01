import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Download, Palette, Star, Calendar, BarChart3 } from "lucide-react";

interface SimulationModalProps {
  type: string;
  onClose: () => void;
}

export default function SimulationModal({ type, onClose }: SimulationModalProps) {
  const [title, setTitle] = useState("Comment EXPLOSER sur YouTube en 2024");
  const [style, setStyle] = useState("gaming");
  const [color, setColor] = useState("purple");

  const getSimulationContent = () => {
    switch (type) {
      case 'thumbnail_creator':
        return {
          title: "Créateur de Miniatures YouTube",
          icon: Palette,
          content: (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Design Canvas */}
              <div className="bg-gray-100 rounded-xl p-4 aspect-video">
                <div className="bg-white rounded-lg h-full flex items-center justify-center border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Votre miniature apparaîtra ici</p>
                    <Button className="bg-primary text-white hover:bg-blue-700">
                      <Upload className="mr-2 h-4 w-4" />
                      Télécharger une image
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Controls */}
              <div className="space-y-6">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Titre de la vidéo</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Comment EXPLOSER sur YouTube en 2024"
                  />
                </div>
                
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Style de miniature</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gaming">Gaming Dynamique</SelectItem>
                      <SelectItem value="lifestyle">Lifestyle Coloré</SelectItem>
                      <SelectItem value="tech">Tech Moderne</SelectItem>
                      <SelectItem value="education">Éducatif Propre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Couleur principale</Label>
                  <div className="flex space-x-2">
                    {['red', 'blue', 'green', 'yellow', 'purple'].map((colorOption) => (
                      <button
                        key={colorOption}
                        className={`w-8 h-8 bg-${colorOption}-500 rounded-full border-2 ${
                          color === colorOption ? 'border-primary border-4' : 'border-gray-300'
                        }`}
                        onClick={() => setColor(colorOption)}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Button className="w-full bg-primary text-white hover:bg-blue-700">
                    <Palette className="mr-2 h-4 w-4" />
                    Générer la miniature
                  </Button>
                  <Button className="w-full bg-green-600 text-white hover:bg-green-700">
                    <Download className="mr-2 h-4 w-4" />
                    Télécharger
                  </Button>
                </div>
              </div>
            </div>
          )
        };
      
      case 'post_scheduler':
        return {
          title: "Planificateur de Posts",
          icon: Calendar,
          content: (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Contenu du post</Label>
                  <textarea 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    rows={4}
                    placeholder="Rédigez votre contenu..."
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Plateformes</Label>
                  <div className="space-y-2">
                    {['YouTube', 'Instagram', 'TikTok', 'Twitter/X'].map((platform) => (
                      <label key={platform} className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span>{platform}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Date de publication</Label>
                  <Input type="date" />
                </div>
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Heure</Label>
                  <Input type="time" />
                </div>
              </div>
              
              <Button className="w-full bg-green-600 text-white hover:bg-green-700">
                <Calendar className="mr-2 h-4 w-4" />
                Programmer le post
              </Button>
            </div>
          )
        };
      
      case 'performance_analyzer':
        return {
          title: "Analyseur de Performance",
          icon: BarChart3,
          content: (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <h4 className="font-semibold text-gray-800">Vues totales</h4>
                    <p className="text-2xl font-bold text-primary">125,340</p>
                    <p className="text-sm text-green-600">+12% cette semaine</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <h4 className="font-semibold text-gray-800">Engagement</h4>
                    <p className="text-2xl font-bold text-primary">8.4%</p>
                    <p className="text-sm text-green-600">+2.1% ce mois</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <h4 className="font-semibold text-gray-800">Abonnés</h4>
                    <p className="text-2xl font-bold text-primary">2,847</p>
                    <p className="text-sm text-green-600">+156 ce mois</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="bg-gray-100 rounded-lg p-6 text-center">
                <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Graphique d'analyse des performances</p>
                <p className="text-sm text-gray-500 mt-2">
                  Vos contenus YouTube performent le mieux le mercredi à 18h
                </p>
              </div>
              
              <Button className="w-full bg-orange-600 text-white hover:bg-orange-700">
                <BarChart3 className="mr-2 h-4 w-4" />
                Générer rapport détaillé
              </Button>
            </div>
          )
        };
      
      default:
        return {
          title: "Simulation",
          icon: Star,
          content: <div>Simulation non trouvée</div>
        };
    }
  };

  const simulation = getSimulationContent();
  const Icon = simulation.icon;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Icon className="mr-2 h-5 w-5" />
            {simulation.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-6">
          {simulation.content}
          
          {/* XP Reward */}
          <Card className="bg-yellow-50 border-yellow-200 mt-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-center">
                <Star className="h-5 w-5 text-yellow-500 mr-2" />
                <span className="text-yellow-800 font-medium">
                  +50 XP pour avoir utilisé cette simulation !
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
