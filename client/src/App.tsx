import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Chatbot, { ChatbotToggle } from "@/components/chatbot";
import Landing from "@/pages/landing";
import LoginPage from "@/pages/login";
import StudentDashboard from "@/pages/student-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminModulesPage from "@/pages/admin-modules";
import AdminQuizzesPage from "@/pages/admin-quizzes";
import AdminBadgesPage from "@/pages/admin-badges";
import AdminAnalyticsPage from "@/pages/admin-analytics";
import AdminSettingsPage from "@/pages/admin-settings";
import ModulesPage from "@/pages/modules";
import ProgressPage from "@/pages/progress";
import BadgesPage from "@/pages/badges";
import SimulationsPage from "@/pages/simulations";
import ProfilePage from "@/pages/profile";
import ForumPage from "@/pages/forum";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/" component={LoginPage} />
        <Route component={LoginPage} />
      </Switch>
    );
  }

  const isAdmin = (user as any)?.role === 'admin';

  return (
    <Switch>
      {/* Admin Routes */}
      {isAdmin && (
        <>
          <Route path="/" component={AdminDashboard} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/modules" component={AdminModulesPage} />
          <Route path="/admin/quizzes" component={AdminQuizzesPage} />
          <Route path="/admin/badges" component={AdminBadgesPage} />
          <Route path="/admin/students" component={AdminDashboard} />
          <Route path="/admin/analytics" component={AdminAnalyticsPage} />
          <Route path="/admin/settings" component={AdminSettingsPage} />
          <Route path="/profile" component={ProfilePage} />
        </>
      )}
      
      {/* Student Routes */}
      {!isAdmin && (
        <>
          <Route path="/" component={StudentDashboard} />
          <Route path="/modules" component={ModulesPage} />
          <Route path="/progress" component={ProgressPage} />
          <Route path="/badges" component={BadgesPage} />
          <Route path="/forum" component={ForumPage} />
          <Route path="/simulations" component={SimulationsPage} />
          <Route path="/profile" component={ProfilePage} />
        </>
      )}
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        
        {/* Chatbot global - visible sur toutes les pages */}
        <ChatbotToggle 
          onClick={() => setIsChatbotOpen(true)} 
          isOpen={isChatbotOpen} 
        />
        <Chatbot 
          isOpen={isChatbotOpen} 
          onToggle={() => setIsChatbotOpen(!isChatbotOpen)} 
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
