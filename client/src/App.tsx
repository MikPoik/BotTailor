import React, { Suspense, useEffect,useRef } from "react";
import { Switch, Route, useLocation } from "wouter";
import { CookieConsentModal, CookieConsentStatus } from "@/components/cookie-consent-modal";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/theme-context";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ClientOnly } from "@/components/client-only";
import NotFound from "@/pages/not-found";
import ChatWidget from "@/pages/chat-widget";
import { normalizeRoutePath } from "@shared/route-metadata";
import { shouldSSR } from "@/routes/registry";
import { StackProvider, StackHandler, StackTheme, useUser } from '@stackframe/react';
import { stackClientApp } from '@/lib/stack';
import { apiRequest } from "@/lib/queryClient";

import Dashboard from "@/pages/dashboard";
import Home from "@/pages/home";
import ChatbotForm from "@/pages/chatbot-form";
import ChatbotEdit from "@/pages/chatbot-edit";
import ChatbotTest from "@/pages/chatbot-test";
import UIDesigner from "@/pages/ui-designer";
import AddData from "@/pages/add-data";
import SurveyBuilder from "@/pages/survey-builder";
import SurveyAnalytics from "@/pages/survey-analytics";
import ChatHistory from "@/pages/chat-history";
import ChatbotEmbed from "@/pages/chatbot-embed";
import Docs from "@/pages/docs";
import Pricing from "@/pages/pricing";
import Subscription from "@/pages/Subscription";
import Contact from "@/pages/contact";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";

function HandlerRoutes() {
  const [location] = useLocation();
  return (
    <StackHandler app={stackClientApp} location={location} fullPage />
  );
}

function AuthenticatedRouter() {
  // Check if this is an embedded widget context
  // Check both URL params and injected config (SSR-safe)
  const urlEmbedded = typeof window !== 'undefined' ? 
    new URLSearchParams(window.location.search).get('embedded') === 'true' : false;
  const configEmbedded = typeof window !== 'undefined' ? 
    (window as any).__CHAT_WIDGET_CONFIG__?.embedded : false;
  const isEmbedded = urlEmbedded || configEmbedded;

  // Sync user to database on login (right after Stack Auth authentication)
  const stackUser = useUser();
  useEffect(() => {
    if (stackUser && !isEmbedded) {
      // Call /api/ensure-user to sync/create user in app database
      apiRequest("POST", "/api/ensure-user").catch((error) => {
        console.warn("[USER SYNC] Failed to sync user to database:", error);
        // Don't throw - user will still be able to use the app, just without sync
      });
    }
  }, [stackUser?.id, isEmbedded]);

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

  // Wrap auth-dependent routing in ClientOnly to avoid hydration issues
  return (
    <ClientOnly fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <AuthenticatedRouterContent />
    </ClientOnly>
  );
}

function AuthenticatedRouterContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  const currentPath = location ?? '/';
  const normalizedLocation = normalizeRoutePath(currentPath);
  const isPublicRoute = shouldSSR(normalizedLocation);

  if (isLoading && !isPublicRoute) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Handler routes - available to all */}
      <Route path="/handler/*" component={HandlerRoutes} />
      
      {/* Public routes - available to all */}
      <Route path="/" component={Home} />
      <Route path="/contact" component={Contact} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/docs" component={Docs} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/widget" component={ChatWidget} />
      <Route path="/chat-widget" component={ChatWidget} />
      
      {/* Support route alias */}
      <Route path="/support" component={Docs} />
      
      {/* Authenticated routes - rendered conditionally at component level */}
      {isAuthenticated && (
        <>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/chatbots/new" component={ChatbotForm} />
          <Route path="/chatbots/:guid/add-data" component={AddData} />
          <Route path="/chatbots/:guid/test" component={ChatbotTest} />
          <Route path="/chatbots/:guid/ui-designer" component={UIDesigner} />
          <Route path="/chatbots/:guid/analytics" component={ChatHistory} />
          <Route path="/chatbots/:guid/survey-analytics" component={SurveyAnalytics} />
          <Route path="/chatbots/:guid/surveys" component={SurveyBuilder} />
          <Route path="/chatbots/:guid/embed" component={ChatbotEmbed} />
          <Route path="/chatbots/:guid" component={ChatbotEdit} />
          <Route path="/subscription" component={Subscription} />
        </>
      )}
      
      {/* Catch-all 404 route - must be last */}
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  // Check if this is an embedded widget context
  // Check both URL params and injected config (SSR-safe)
  const urlEmbedded = typeof window !== 'undefined' ? 
    new URLSearchParams(window.location.search).get('embedded') === 'true' : false;
  const configEmbedded = typeof window !== 'undefined' ? 
    (window as any).__CHAT_WIDGET_CONFIG__?.embedded : false;
  const isEmbedded = urlEmbedded || configEmbedded;

  if (isEmbedded) {
    // CRITICAL: Keep Suspense for lazy-loaded components but use invisible fallback
    // This prevents "component suspended" errors while avoiding visible loading states
    return (
      <Suspense fallback={<div style={{ display: 'none' }} />}>
        <AuthenticatedRouter />
      </Suspense>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <ClientOnly fallback={
          <div className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" />
        }>
          <Navbar />
        </ClientOnly>
        <main className="flex-1">
          <AuthenticatedRouter />
        </main>
        <Footer />
      </Suspense>
    </div>
  );
}

function App() {
  // Cookie consent logic
  const [consent, setConsent] = React.useState<CookieConsentStatus>(null);
  const [gaLoaded, setGaLoaded] = React.useState(false);
  const consentRef = useRef<CookieConsentStatus>(null);

  // Initialize consent from localStorage
  React.useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('cookie_consent') : null;
    let consentValue: CookieConsentStatus = null;
    if (stored === 'accepted') {
      consentValue = 'accepted';
    } else if (stored === 'declined') {
      consentValue = 'declined';
    }
    consentRef.current = consentValue;
    setConsent(consentValue);
  }, []);

  // Load GA when consent is accepted
  React.useEffect(() => {
    const urlEmbedded = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('embedded') === 'true' : false;
    const configEmbedded = typeof window !== 'undefined' ? (window as any).__CHAT_WIDGET_CONFIG__?.embedded : false;
    const isEmbedded = urlEmbedded || configEmbedded;
    
    if (consent === 'accepted' && !gaLoaded && !isEmbedded) {
      const gaId = import.meta.env.VITE_GA_ID;
      if (gaId) {
        const w = window as any;
        // Initialize dataLayer before script loads
        w.dataLayer = w.dataLayer || [];
        
        // Define gtag function globally
        w.gtag = function(...args: any[]) {
          w.dataLayer.push(arguments);
        };
        w.gtag('js', new Date());
        w.gtag('config', gaId);
        
        // Inject GA script after gtag is defined
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        script.onload = () => {
          setGaLoaded(true);
        };
        script.onerror = () => {
          console.error('Failed to load Google Analytics');
          setGaLoaded(true); // Mark as loaded to prevent retries
        };
        document.head.appendChild(script);
      }
    }
  }, [consent, gaLoaded]);

  // Only show modal if not embedded widget and consent not given
  const urlEmbedded = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('embedded') === 'true' : false;
  const configEmbedded = typeof window !== 'undefined' ? (window as any).__CHAT_WIDGET_CONFIG__?.embedded : false;
  const isEmbedded = urlEmbedded || configEmbedded;

  return (
    <ClientOnly fallback={isEmbedded ? null : (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )}>
      <StackProvider app={stackClientApp}>
        <StackTheme>
          <Toaster />
          <Router />
          {!isEmbedded && consent === null && (
            <CookieConsentModal onConsent={setConsent} />
          )}
        </StackTheme>
      </StackProvider>
    </ClientOnly>
  );
}

export default App;
