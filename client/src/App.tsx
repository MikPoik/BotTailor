import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/theme-context";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/navbar";
import NotFound from "@/pages/not-found";
import ChatWidget from "@/pages/chat-widget";
import { lazy } from "react";

import Dashboard from "@/pages/dashboard";
import Home from "@/pages/home";
import ChatbotForm from "@/pages/chatbot-form";
import ChatbotEdit from "@/pages/chatbot-edit";
import ChatbotTest from "@/pages/chatbot-test";
import UIDesigner from "@/pages/ui-designer";
import AddData from "@/pages/add-data";
import SurveyBuilder from "@/pages/survey-builder";
import WidgetTest from "@/pages/widget-test";
import ChatHistory from "@/pages/chat-history";

function AuthenticatedRouter() {
  // Check if this is an embedded widget context
  const isEmbedded = new URLSearchParams(window.location.search).get('embedded') === 'true';

  if (isEmbedded) {
    // For embedded widgets, skip authentication entirely
    return (
      <Switch>
        <Route path="/widget" component={ChatWidget} />
        <Route path="/chat-widget" component={ChatWidget} />
        <Route component={ChatWidget} />
      </Switch>
    );
  }

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
          <Route path="/widget" component={ChatWidget} />
          <Route path="/chat-widget" component={ChatWidget} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/chatbots/new" component={ChatbotForm} />
          <Route path="/chatbots/:guid/add-data" component={AddData} />
          <Route path="/chatbots/:guid/test" component={ChatbotTest} />
          <Route path="/chatbots/:guid/ui-designer" component={UIDesigner} />
          <Route path="/chatbots/:guid/analytics" component={lazy(() => import("./pages/chat-history"))} />
          <Route path="/chatbots/:guid/surveys" component={lazy(() => import("./pages/survey-builder"))} />
          <Route path="/chatbots/:guid/ui-designer" component={lazy(() => import("./pages/ui-designer"))} />
          <Route path="/chatbots/:guid/embed" component={lazy(() => import("./pages/chatbot-embed"))} />
          <Route path="/chatbots/:guid" component={ChatbotEdit} />
          <Route path="/widget" component={ChatWidget} />
          <Route path="/chat-widget" component={ChatWidget} />
          <Route path="/widget-test" component={WidgetTest} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  // Check if this is an embedded widget context
  const isEmbedded = new URLSearchParams(window.location.search).get('embedded') === 'true';

  if (isEmbedded) {
    // For embedded widgets, bypass authentication and navbar entirely
    return <AuthenticatedRouter />;
  }

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
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;