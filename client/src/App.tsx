import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import StudentDashboard from "@/pages/student-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import ModulesPage from "@/pages/modules";
import ProgressPage from "@/pages/progress";
import BadgesPage from "@/pages/badges";
import SimulationsPage from "@/pages/simulations";
import ProfilePage from "@/pages/profile";
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

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          {(user as any)?.role === 'admin' ? (
            <>
              <Route path="/" component={AdminDashboard} />
              <Route path="/admin" component={AdminDashboard} />
              <Route path="/admin/modules" component={AdminDashboard} />
              <Route path="/admin/students" component={AdminDashboard} />
              <Route path="/admin/analytics" component={AdminDashboard} />
              <Route path="/admin/settings" component={AdminDashboard} />
            </>
          ) : (
            <>
              <Route path="/" component={StudentDashboard} />
              <Route path="/modules" component={ModulesPage} />
              <Route path="/progress" component={ProgressPage} />
              <Route path="/badges" component={BadgesPage} />
              <Route path="/simulations" component={SimulationsPage} />
              <Route path="/profile" component={ProfilePage} />
            </>
          )}
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
