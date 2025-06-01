import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Video, Home, BookOpen, Award, BarChart3, Settings, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface NavigationProps {
  variant?: 'student' | 'admin';
}

export default function Navigation({ variant = 'student' }: NavigationProps) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const studentNavItems = [
    { href: "/", label: "Accueil", icon: Home },
    { href: "/modules", label: "Formations", icon: BookOpen },
    { href: "/progress", label: "Ma Progression", icon: BarChart3 },
    { href: "/badges", label: "Mes Badges", icon: Award },
    { href: "/simulations", label: "Simulations", icon: Video },
    { href: "/profile", label: "Mon Profil", icon: User },
  ];

  const adminNavItems = [
    { href: "/admin", label: "Tableau de bord", icon: Home },
    { href: "/admin/modules", label: "Gestion Modules", icon: BookOpen },
    { href: "/admin/students", label: "Élèves", icon: User },
    { href: "/admin/analytics", label: "Analytiques", icon: BarChart3 },
    { href: "/admin/settings", label: "Paramètres", icon: Settings },
  ];

  const navItems = variant === 'admin' ? adminNavItems : studentNavItems;

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center p-6 border-b">
        <div className={`${variant === 'admin' ? 'bg-red-600' : 'bg-primary'} text-white w-10 h-10 rounded-lg flex items-center justify-center mr-3`}>
          <Video className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-800">
            {variant === 'admin' ? 'Administration' : 'Créateur Academy'}
          </h1>
          <p className="text-sm text-gray-600">
            {variant === 'admin' ? 'Panneau Admin' : 'Formation Créateur'}
          </p>
        </div>
      </div>

      {/* User Info */}
      <div className="p-6 border-b">
        <div className="flex items-center space-x-3">
          {user?.profileImageUrl && (
            <img 
              src={user.profileImageUrl} 
              alt="Photo de profil" 
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
            />
          )}
          <div className="flex-1">
            <p className="font-medium text-gray-800">
              {user?.firstName || 'Utilisateur'} {user?.lastName || ''}
            </p>
            <p className="text-sm text-gray-600">
              {variant === 'admin' ? 'Administrateur' : `Niveau ${user?.level || 1} - ${user?.xp || 0} XP`}
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
                        ? `${variant === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-primary'}` 
                        : 'text-gray-600 hover:bg-gray-100'
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
      <div className="p-4 border-t">
        <Button 
          onClick={handleLogout}
          variant="ghost" 
          className="w-full justify-start text-gray-600 hover:text-red-600"
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
            <Button variant="ghost" size="sm">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Navigation Sidebar */}
      <div className="hidden md:flex w-80 bg-white border-r border-gray-200">
        <NavContent />
      </div>
    </>
  );
}