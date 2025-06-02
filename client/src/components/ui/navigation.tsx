import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Video, Home, BookOpen, Award, BarChart3, Settings, LogOut, User, Package, Search, MessageSquare, HelpCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import FloatingChatbot from "@/components/floating-chatbot";
import boxIcon from "@assets/Capture d'écran 2025-06-01 215731.png";

interface NavigationProps {
  variant?: 'student' | 'admin';
}

export default function Navigation({ variant = 'student' }: NavigationProps) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();

  // Get notifications count
  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { 
        method: "POST",
        credentials: "include"
      });
      if (response.ok) {
        window.location.href = "/login";
      } else {
        throw new Error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Force refresh to clear session
      window.location.href = "/login";
    }
  };

  const studentNavItems = [
    { href: "/", label: "Accueil", icon: Home },
    { href: "/modules", label: "Formations", icon: BookOpen },
    { href: "/progress", label: "Ma Progression", icon: BarChart3 },
    { href: "/badges", label: "Mes Badges", icon: Award },
    { href: "/forum", label: "Forum", icon: MessageSquare },
    { href: "/simulations", label: "Simulations", icon: Video },
    { href: "/profile", label: "Mon Profil", icon: User },
  ];

  const adminNavItems = [
    { href: "/admin", label: "Tableau de bord", icon: Home },
    { href: "/admin/modules", label: "Gestion Modules", icon: BookOpen },
    { href: "/admin/quizzes", label: "Quiz", icon: HelpCircle },
    { href: "/admin/badges", label: "Badges", icon: Award },
    { href: "/profile", label: "Mon Profil", icon: User },
    { href: "/admin/analytics", label: "Analytiques", icon: BarChart3 },
    { href: "/admin/settings", label: "Paramètres", icon: Settings },
  ];

  const navItems = variant === 'admin' ? adminNavItems : studentNavItems;

  // Modern floating sidebar
  const ModernSidebar = () => (
    <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-3 flex flex-col items-center space-y-3">
      {/* Logo/Brand at top */}
      <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center mb-2 shadow-lg">
        <Package className="h-6 w-6 text-white" />
      </div>
      
      {/* Navigation icons */}
      {navItems.map((item, index) => {
        const Icon = item.icon;
        const isActive = location === item.href;
        const isForum = item.href === '/forum';
        const unreadCount = notifications?.unreadCount || 0;
        
        // Attributs de données pour la surbrillance
        const getNavId = (href: string) => {
          if (href === '/') return 'nav-home';
          if (href === '/modules') return 'nav-modules';
          if (href === '/forum') return 'nav-forum';
          if (href === '/progress') return 'nav-progress';
          if (href === '/badges') return 'nav-badges';
          return null;
        };
        
        return (
          <Link key={item.href} href={item.href}>
            <div
              data-nav-id={getNavId(item.href)} 
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group relative cursor-pointer ${
                isActive 
                  ? 'bg-primary text-white shadow-lg scale-110' 
                  : 'bg-white/20 text-white/80 hover:text-white hover:bg-primary/80 hover:scale-105'
              }`}
              title={item.label}
            >
              <Icon className="h-5 w-5" />
              
              {/* Notification badge for forum */}
              {isForum && unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold shadow-lg animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
              
              {/* Tooltip */}
              <div className="absolute left-14 bg-gray-900/90 backdrop-blur text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                {item.label}
                {isForum && unreadCount > 0 && (
                  <span className="ml-2 text-red-300">({unreadCount} nouveaux)</span>
                )}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900/90 rotate-45"></div>
              </div>
            </div>
          </Link>
        );
      })}
      
      {/* Divider */}
      <div className="w-8 h-px bg-white/20 my-2"></div>
      
      {/* Bottom section */}
      <Button 
        onClick={handleLogout}
        variant="ghost" 
        size="sm"
        className="w-11 h-11 p-0 text-white/80 hover:text-red-400 hover:bg-red-500/20 rounded-xl transition-all duration-300 hover:scale-105"
        title="Se déconnecter"
      >
        <LogOut className="h-5 w-5" />
      </Button>
    </div>
  );

  const MobileNavContent = () => (
    <div className="flex flex-col h-full bg-[hsl(var(--sidebar-bg))] text-white">
      {/* Header */}
      <div className="flex items-center p-6 border-b border-gray-700">
        <div className="bg-primary text-white w-10 h-10 rounded-lg flex items-center justify-center mr-3">
          <Package className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">
            {variant === 'admin' ? 'Administration' : 'Créateur Academy'}
          </h1>
          <p className="text-sm text-white/80">
            {variant === 'admin' ? 'Panneau Admin' : 'Formation Créateur'}
          </p>
        </div>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          {(user as any)?.profileImageUrl ? (
            <img 
              src={(user as any).profileImageUrl} 
              alt="Photo de profil" 
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-600"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold">
              {((user as any)?.firstName?.[0] || 'U').toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <p className="font-medium text-white">
              {(user as any)?.firstName || 'Utilisateur'} {(user as any)?.lastName || ''}
            </p>
            <p className="text-sm text-white/80">
              {variant === 'admin' ? 'Administrateur' : `Niveau ${(user as any)?.level || 1} - ${(user as any)?.xp || 0} XP`}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <li key={item.href}>
                <Link href={item.href}>
                  <a 
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-primary text-white' 
                        : 'text-white hover:text-white hover:bg-gray-700'
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-700">
        <Button 
          onClick={handleLogout}
          variant="ghost" 
          className="w-full justify-start text-white/80 hover:text-red-400"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Se déconnecter
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Navigation */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="text-white">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0 border-r-0">
            <MobileNavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Modern Sidebar */}
      <div className="hidden md:block">
        <ModernSidebar />
      </div>
    </>
  );
}