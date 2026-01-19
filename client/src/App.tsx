/**
 * Root component for the React frontend application (Vite + React 18).
 *
 * Responsibilities:
 * - Sets up routing, providers (Auth, Theme, Query, Tooltip), and global UI elements.
 * - Detects embed contexts (legacy and new iframe) and SSR hydration.
 * - Handles cookie consent, analytics, and Stack Auth integration.
 *
 * Constraints & Edge Cases:
 * - Must match SSR provider tree (see entry-server.tsx).
 * - Embed mode is detected via query param or window globals; disables chrome and analytics.
 * - SSR hydration and client mount must be coordinated for correct UI state.
 */
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
import EmbedPage from "@/pages/embed";
import EmbedDesignsPage from "@/pages/embed-designs";
import EmbedDesignEditPage from "@/pages/embed-design-edit";
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
  // Check embedded contexts
  // - Chat widget embed: `embedded=true` or `window.__CHAT_WIDGET_CONFIG__`
  // - New iframe embed designs: `window.__EMBED_CONFIG__`
  const urlEmbedded = typeof window !== 'undefined' ?
    new URLSearchParams(window.location.search).get('embedded') === 'true' : false;
  const chatEmbedFlag = typeof window !== 'undefined' ?
    (window as any).__CHAT_WIDGET_CONFIG__?.embedded === true : false;
  // Only treat as embed design if an embed config is present AND the route is an /embed page.
  // Also treat iframe hosts that inject `__EMBED_CONFIG__` as embedded.
  const inIframe = typeof window !== 'undefined' && (window.self !== window.top);
  const configEmbedFlag = typeof window !== 'undefined' ? !!(window as any).__EMBED_CONFIG__ : false;
  const isEmbedDesign = typeof window !== 'undefined' ? (window.location.pathname?.startsWith('/embed') && configEmbedFlag) : false;
  const isEmbedded = urlEmbedded || chatEmbedFlag || isEmbedDesign || (inIframe && configEmbedFlag);

  // Move user sync into a small Suspense-aware helper so that `useUser` can suspend
  // without causing a synchronous update to suspend the entire router.
  function UserSync({ embedded }: { embedded: boolean }) {
    const stackUser = useUser();
    useEffect(() => {
      if (stackUser && !embedded) {
        const userEmail = stackUser.primaryEmail || undefined;
        const userName = stackUser.displayName || stackUser.primaryEmail?.split('@')[0] || undefined;

        apiRequest("POST", "/api/ensure-user", {
          email: userEmail,
          name: userName,
        }).catch((error) => {
          console.warn("[USER SYNC] Failed to sync user to database:", error);
        });
      }
    }, [stackUser?.id, embedded]);

    return null;
  }

  // Render the sync inside a small Suspense boundary so a suspend doesn't replace the UI
  // Note: Suspense fallback is null to avoid visual changes in embed mode
  const UserSyncBoundary = isEmbedded ? (
    <React.Suspense fallback={null}><UserSync embedded={isEmbedded} /></React.Suspense>
  ) : (
    <React.Suspense fallback={<div style={{ display: 'none' }} />}><UserSync embedded={isEmbedded} /></React.Suspense>
  );


  // If chat-widget embed is active (legacy), use ChatWidget routes.
  // For new embed designs, continue to normal router so /embed/:embedId works.
  if (!isEmbedDesign && (urlEmbedded || chatEmbedFlag)) {
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
      {UserSyncBoundary}
      <AuthenticatedRouterContent />
    </ClientOnly>
  );
}

function AuthenticatedRouterContent() {
  // If we're in embed designs (iframe) we must avoid calling auth hooks that may suspend
  // during client startup. Embed pages intentionally skip auth.
  const urlEmbedded = typeof window !== 'undefined' ?
    new URLSearchParams(window.location.search).get('embedded') === 'true' : false;
  const inIframe = typeof window !== 'undefined' && (window.self !== window.top);
  const configEmbedFlag = typeof window !== 'undefined' ? !!(window as any).__EMBED_CONFIG__ : false;
  const isEmbedDesign = typeof window !== 'undefined' ? (window.location.pathname?.startsWith('/embed') && configEmbedFlag) : false;
  const isEmbedded = urlEmbedded || isEmbedDesign || (inIframe && configEmbedFlag);

  // If embedded, skip auth check entirely to avoid useUser/useAuth suspensions
  if (isEmbedded) {
    // Embedded: only render public/handler routes, skip auth-only routes to avoid useUser/useAuth
    return (
      <Switch>
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
        <Route path="/embed/:embedId" component={EmbedPage} />

        {/* Support route alias */}
        <Route path="/support" component={Docs} />

        {/* Catch-all 404 route - must be last */}
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Non-embedded: safe to call auth hook (may suspend) since we render full app UI
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  const currentPath = location ?? '/';
  const normalizedLocation = normalizeRoutePath(currentPath);
  const isPublicRoute = shouldSSR(normalizedLocation);

  // Only block rendering while auth loads for clearly protected routes (dashboard/chatbot management)
  const protectedPrefixes = ['/dashboard', '/chatbots', '/chatbot', '/subscription'];
  const isProtectedRoute = protectedPrefixes.some(p => normalizedLocation.startsWith(p));

  if (isLoading && isProtectedRoute) {
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
      <Route path="/embed/:embedId" component={EmbedPage} />
      
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
          <Route path="/chatbots/:guid/embed-designs" component={EmbedDesignsPage} />
          <Route path="/chatbots/:guid/embed-design/:embedId/edit" component={EmbedDesignEditPage} />
          <Route path="/chatbots/:guid/embed-design/new" component={EmbedDesignEditPage} />
          <Route path="/chatbot/:guid/embed-designs" component={EmbedDesignsPage} />
          <Route path="/chatbot/:guid/embed-design/:embedId/edit" component={EmbedDesignEditPage} />
          <Route path="/chatbot/:guid/embed-design/new" component={EmbedDesignEditPage} />
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
  // Determine embedded context for layout decisions (hide navbar/footer)
  const urlEmbedded = typeof window !== 'undefined' ?
    new URLSearchParams(window.location.search).get('embedded') === 'true' : false;
  const chatEmbedFlag = typeof window !== 'undefined' ?
    (window as any).__CHAT_WIDGET_CONFIG__?.embedded === true : false;
  // Only treat as embed design if an embed config is present AND the route is an /embed page
  // Also treat iframe hosts that inject `__EMBED_CONFIG__` as embedded.
  const inIframe = typeof window !== 'undefined' && (window.self !== window.top);
  const configEmbedFlag = typeof window !== 'undefined' ? !!(window as any).__EMBED_CONFIG__ : false;
  const isEmbedDesign = typeof window !== 'undefined' ? (window.location.pathname?.startsWith('/embed') && configEmbedFlag) : false;
  const isEmbedded = urlEmbedded || chatEmbedFlag || isEmbedDesign || (inIframe && configEmbedFlag);

  if (isEmbedded) {
    // In embedded mode we must NOT use a top-level Suspense fallback that hides the
    // entire router (e.g. `display: none`) because React will temporarily hide the
    // whole subtree during suspensions, causing the CTA to flash. Let inner routes
    // and components manage their own suspenses instead.
    return <AuthenticatedRouter />;
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
  const chatEmbedFlag = typeof window !== 'undefined' ? (window as any).__CHAT_WIDGET_CONFIG__?.embedded === true : false;
  // Only treat as embed design if an embed config is present AND the route is an /embed page
  const inIframe = typeof window !== 'undefined' && (window.self !== window.top);
  const configEmbedFlag = typeof window !== 'undefined' ? !!(window as any).__EMBED_CONFIG__ : false;
  const isEmbedDesign = typeof window !== 'undefined' ? (window.location.pathname?.startsWith('/embed') && configEmbedFlag) : false;
  const isEmbedded = urlEmbedded || chatEmbedFlag || isEmbedDesign || (inIframe && configEmbedFlag);

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
