import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Video, Home, BookOpen, Award, BarChart3, Settings, LogOut, User, Package, Search, MessageSquare, HelpCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import boxIcon from "@assets/Capture d'écran 2025-06-01 215731.png";

interface NavigationProps {
  variant?: 'student' | 'admin';
}

export default function Navigation({ variant = 'student' }: NavigationProps) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();

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

  // Modern sidebar like the mockup
  const ModernSidebar = () => (
    <div className="w-16 bg-[hsl(var(--sidebar-bg))] flex flex-col items-center py-6 space-y-4">
      {/* Logo/Brand at top */}
      <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mb-4">
        <Package className="h-6 w-6 text-white" />
      </div>
      
      {/* Navigation icons */}
      {navItems.map((item, index) => {
        const Icon = item.icon;
        const isActive = location === item.href;
        
        return (
          <Link key={item.href} href={item.href}>
            <div 
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 group relative cursor-pointer ${
                isActive 
                  ? 'bg-primary text-white shadow-lg' 
                  : 'bg-[hsl(var(--sidebar-item-hover))] text-gray-400 hover:text-white hover:bg-[hsl(var(--sidebar-item-active))]'
              }`}
              title={item.label}
            >
              <Icon className="h-5 w-5" />
              {/* Tooltip */}
              <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {item.label}
              </div>
            </div>
          </Link>
        );
      })}
      
      {/* Bottom section */}
      <div className="mt-auto space-y-4">
        <Button 
          onClick={handleLogout}
          variant="ghost" 
          size="sm"
          className="w-10 h-10 p-0 text-gray-400 hover:text-red-400 hover:bg-red-900/20"
          title="Se déconnecter"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
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
          <p className="text-sm text-gray-400">
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
            <p className="text-sm text-gray-400">
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
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
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
          className="w-full justify-start text-gray-400 hover:text-red-400"
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