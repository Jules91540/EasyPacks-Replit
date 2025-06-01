import { Card, CardContent } from "@/components/ui/card";

interface XPProgressProps {
  currentXP: number;
  totalXP: number;
  progress: number;
  nextLevel: number;
}

export default function XPProgress({ currentXP, totalXP, progress, nextLevel }: XPProgressProps) {
  return (
    <Card className="bg-white/20 border-white/30 min-w-72">
      <CardContent className="p-6">
        <div className="flex justify-between text-sm mb-2 text-white">
          <span>Progression vers Niveau {nextLevel}</span>
          <span>{Math.min(progress, 100)}%</span>
        </div>
        <div className="bg-white/30 rounded-full h-3 mb-3">
          <div 
            className="xp-progress h-3 rounded-full transition-all duration-1000 ease-out" 
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
        <p className="text-xs text-blue-100">
          {Math.max(totalXP - currentXP, 0)} XP restants pour passer au niveau suivant
        </p>
      </CardContent>
    </Card>
  );
}
