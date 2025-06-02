import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Trophy, BookOpen, MessageSquare } from "lucide-react";
import { Link } from "wouter";

export default function UserProfile() {
  const [match, params] = useRoute("/profile/:userId");
  const userId = params?.userId;

  const { data: user, isLoading } = useQuery({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const { data: userProgress } = useQuery({
    queryKey: [`/api/users/${userId}/progress`],
    enabled: !!userId,
  });

  const { data: userBadges } = useQuery({
    queryKey: [`/api/users/${userId}/badges`],
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Utilisateur introuvable</h1>
          <Link href="/forum" className="text-blue-400 hover:text-blue-300">
            Retour au forum
          </Link>
        </div>
      </div>
    );
  }

  const calculateLevel = (xp: number) => {
    return Math.floor(xp / 100) + 1;
  };

  const getXpForNextLevel = (xp: number) => {
    const currentLevel = calculateLevel(xp);
    return currentLevel * 100 - xp;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/forum" className="text-white hover:text-gray-300 transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Profil utilisateur</h1>
        </div>

        {/* Profile Card */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="h-32 w-32">
              <AvatarImage src={user.profileImageUrl} />
              <AvatarFallback className="bg-gradient-to-r from-pink-500 to-violet-500 text-white text-2xl">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold text-white mb-2">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-gray-300 mb-4">
                @{user.firstName?.toLowerCase()}{user.lastName?.toLowerCase()}
              </p>
              
              {/* Level and XP */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                  <span className="text-white font-semibold">
                    Niveau {calculateLevel(user.xp || 0)}
                  </span>
                  <span className="text-gray-300">
                    ({user.xp || 0} XP)
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-pink-500 to-violet-500 h-3 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${((user.xp || 0) % 100)}%` 
                    }}
                  ></div>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {getXpForNextLevel(user.xp || 0)} XP jusqu'au niveau suivant
                </p>
              </div>

              <div className="flex items-center gap-2 text-gray-300">
                <Calendar className="h-4 w-4" />
                <span>Membre depuis {new Date(user.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="h-6 w-6 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Modules complétés</h3>
            </div>
            <p className="text-3xl font-bold text-white">
              {userProgress?.filter((p: any) => p.completed).length || 0}
            </p>
            <p className="text-gray-400 text-sm">
              sur {userProgress?.length || 0} modules
            </p>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="h-6 w-6 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Badges obtenus</h3>
            </div>
            <p className="text-3xl font-bold text-white">
              {userBadges?.length || 0}
            </p>
            <p className="text-gray-400 text-sm">badges débloqués</p>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="h-6 w-6 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Activité forum</h3>
            </div>
            <p className="text-3xl font-bold text-white">Actif</p>
            <p className="text-gray-400 text-sm">membre de la communauté</p>
          </Card>
        </div>

        {/* Badges Section */}
        {userBadges && userBadges.length > 0 && (
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Badges obtenus</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {userBadges.map((userBadge: any) => (
                <div 
                  key={userBadge.badge.id}
                  className="bg-white/5 rounded-lg p-4 text-center hover:bg-white/10 transition-colors"
                >
                  <div className="text-3xl mb-2">{userBadge.badge.icon}</div>
                  <h4 className="font-semibold text-white text-sm mb-1">
                    {userBadge.badge.name}
                  </h4>
                  <p className="text-xs text-gray-400">
                    {userBadge.badge.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Obtenu le {new Date(userBadge.earnedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}