import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { LoginPage } from "@/pages/Login";
import { LoginTestSimple } from "@/pages/LoginTestSimple";
import { useAuth } from "@/hooks/use-auth";

function Router() {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  // Redirect to login if not authenticated and trying to access home
  useEffect(() => {
    if (!isLoading && !user && location === '/') {
      navigate('/login');
    }
  }, [user, isLoading, location, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  console.log('[Router] Rendering - user:', user ? user.email : 'null');

  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/test-login" component={LoginTestSimple} />
      <Route path="/">
        {user ? <Home /> : <LoginPage />}
      </Route>
      {/* Fallback to 404 */}
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
