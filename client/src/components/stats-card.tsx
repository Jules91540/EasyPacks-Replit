import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  color: 'green' | 'blue' | 'purple' | 'orange';
}

const colorVariants = {
  green: "bg-green-100 text-green-600",
  blue: "bg-blue-100 text-primary",
  purple: "bg-purple-100 text-purple-600",
  orange: "bg-orange-100 text-orange-600"
};

export default function StatsCard({ icon: Icon, value, label, color }: StatsCardProps) {
  return (
    <Card className="gradient-card hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`${colorVariants[color]} w-12 h-12 rounded-lg flex items-center justify-center`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-gray-600 text-sm">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
