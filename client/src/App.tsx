import { Switch, Route, useLocation, Router } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import EventList from "@/pages/events/index";
import NewEvent from "@/pages/events/new";
import EventDetails from "@/pages/events/[id]";
import ParticipantList from "@/pages/participants/index";
import ParticipantDetails from "@/pages/participants/[id]";
import ParticipantReview from "@/pages/participants/review";
import EmailTemplateList from "@/pages/email-templates/index";
import NewEmailTemplate from "@/pages/email-templates/new";
import EmailTemplateDetails from "@/pages/email-templates/[id]";
import Settings from "@/pages/settings";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

function ProtectedRoutes() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/events" component={EventList} />
      <Route path="/events/new" component={NewEvent} />
      <Route path="/events/:id" component={EventDetails} />
      <Route path="/participants" component={ParticipantList} />
      <Route path="/participants/:id" component={ParticipantDetails} />
      <Route path="/participants/review" component={ParticipantReview} />
      <Route path="/email-templates" component={EmailTemplateList} />
      <Route path="/email-templates/new" component={NewEmailTemplate} />
      <Route path="/email-templates/:id" component={EmailTemplateDetails} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthRouter() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Redirect to login if not authenticated and not already on login page
    if (!isLoading && !isAuthenticated && location !== "/login") {
      setLocation("/login");
    }

    // Redirect to dashboard if authenticated and on login page
    if (!isLoading && isAuthenticated && location === "/login") {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, isLoading, location, setLocation]);

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      {isAuthenticated ? <Route component={ProtectedRoutes} /> : null}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router>
          <AuthRouter />
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
