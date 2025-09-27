import { renderToPipeableStream } from "react-dom/server";
import { Writable } from "node:stream";
import { Router } from "wouter";
import App from "./App";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/theme-context";
import { getRouteMetadata } from "@shared/route-metadata";

export interface SSRContext {
  redirectTo?: string;
}

export function render(url: string, search?: string) {
  const ssrContext: SSRContext = {};
  
  // Create a fresh QueryClient for each SSR request
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  });

  const stream = renderToPipeableStream(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <Router ssrPath={url} ssrSearch={search}>
            <App />
          </Router>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>,
    {
      onShellReady() {
        // Stream is ready to be consumed
      },
      onError(error) {
        console.error('SSR Error:', error);
      },
    }
  );

  return { stream, ssrContext };
}

export function generateHTML(url: string, search?: string): Promise<{ html: string; ssrContext: SSRContext }> {
  return new Promise((resolve, reject) => {
    const ssrContext: SSRContext = {};
    
    // Create a fresh QueryClient for each SSR request
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity,
        },
      },
    });

    const stream = renderToPipeableStream(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemeProvider>
            <Router ssrPath={url} ssrSearch={search}>
              <App />
            </Router>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>,
      {
        onShellReady() {
          // Use a proper Node.js Writable stream
          const chunks: Buffer[] = [];

          const writableStream = new Writable({
            write(chunk: any, encoding: any, callback: any) {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
              callback();
            },
            final(callback: any) {
              const html = Buffer.concat(chunks).toString('utf8');
              resolve({ html, ssrContext });
              callback();
            }
          });
          
          writableStream.on('error', (error: Error) => {
            reject(error);
          });
          
          try {
            stream.pipe(writableStream);
          } catch (error) {
            reject(error);
          }
        },
        onError(error) {
          console.error('SSR Error:', error);
          reject(error);
        },
      }
    );
  });
}

export function generateMetaTags(url: string): string {
  const metadata = getRouteMetadata(url);
  
  const metaTags = [
    `<title>${metadata.title}</title>`,
    `<meta name="description" content="${metadata.description}" />`,
    metadata.keywords ? `<meta name="keywords" content="${metadata.keywords}" />` : '',
    `<meta name="author" content="BotTailor" />`,
    `<meta name="robots" content="index, follow" />`,
    '',
    '<!-- Open Graph / Facebook -->',
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${metadata.canonical || `https://bottailor.com${url}`}" />`,
    `<meta property="og:title" content="${metadata.ogTitle || metadata.title}" />`,
    `<meta property="og:description" content="${metadata.ogDescription || metadata.description}" />`,
    `<meta property="og:image" content="${metadata.ogImage || 'https://bottailor.com/og-image.jpg'}" />`,
    '',
    '<!-- Twitter -->',
    `<meta property="twitter:card" content="summary_large_image" />`,
    `<meta property="twitter:url" content="${metadata.canonical || `https://bottailor.com${url}`}" />`,
    `<meta property="twitter:title" content="${metadata.ogTitle || metadata.title}" />`,
    `<meta property="twitter:description" content="${metadata.ogDescription || metadata.description}" />`,
    `<meta property="twitter:image" content="${metadata.ogImage || 'https://bottailor.com/og-image.jpg'}" />`,
    '',
    '<!-- Canonical URL -->',
    `<link rel="canonical" href="${metadata.canonical || `https://bottailor.com${url}`}" />`,
  ].filter(Boolean).join('\n    ');

  const structuredData = (metadata as any).structuredData ? 
    `\n    <!-- Structured Data -->\n    <script type="application/ld+json">\n    ${JSON.stringify((metadata as any).structuredData, null, 2)}\n    </script>` : '';

  return metaTags + structuredData;
}
