/**
 * Client entry point for the React app (CSR/SSR hydration).
 *
 * Responsibilities:
 * - Mounts or hydrates the App with all providers (QueryClient, Theme, Tooltip, Router).
 * - Detects SSR content and hydrates if present, otherwise mounts for CSR.
 * - Ensures client-side hydration matches SSR output (see entry-server.tsx).
 *
 * Constraints & Edge Cases:
 * - Must match provider tree and structure of SSR entry (entry-server.tsx).
 * - SSR detection is based on root element content.
 */
import { createRoot, hydrateRoot } from "react-dom/client";
import { Router } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/theme-context";
import { queryClient } from "./lib/queryClient";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root")!;

// Check if this is an SSR-rendered page by looking for SSR markers
const isSSR = rootElement.innerHTML.trim() !== '';

const AppWithProviders = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <Router>
          <App />
        </Router>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

if (isSSR) {
  // Hydrate SSR content
  hydrateRoot(rootElement, <AppWithProviders />);
} else {
  // Regular CSR mount
  createRoot(rootElement).render(<AppWithProviders />);
}
