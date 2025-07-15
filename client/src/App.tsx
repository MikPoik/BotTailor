import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/navbar";
import NotFound from "@/pages/not-found";
import ChatWidget from "@/pages/chat-widget";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Home from "@/pages/home";
import ChatbotForm from "@/pages/chatbot-form";
import ChatbotEdit from "@/pages/chatbot-edit";
import ChatbotTest from "@/pages/chatbot-test";
import UIDesigner from "@/pages/ui-designer";

function AuthenticatedRouter() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Home} />
          <Route path="/landing" component={Landing} />
          <Route path="/widget" component={ChatWidget} />
          <Route path="/chat-widget" component={ChatWidget} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/chatbots/new" component={ChatbotForm} />
          <Route path="/chatbots/:id/test" component={ChatbotTest} />
          <Route path="/chatbots/:id/ui-designer" component={UIDesigner} />
          <Route path="/chatbots/:id" component={ChatbotEdit} />
          <Route path="/landing" component={Landing} />
          <Route path="/widget" component={ChatWidget} />
          <Route path="/chat-widget" component={ChatWidget} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  return (
    <>
      <Navbar />
      <AuthenticatedRouter />
    </>
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