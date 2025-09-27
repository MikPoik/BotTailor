
import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
import { nanoid } from "nanoid";
import { isSSRRoute } from "@shared/route-metadata";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const { createServer: createViteServer, createLogger } = await import("vite");
  const viteConfig = {
    plugins: [
      (await import("@vitejs/plugin-react")).default(),
      (await import("@replit/vite-plugin-runtime-error-modal")).default(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "..", "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "..", "shared"),
        "@assets": path.resolve(import.meta.dirname, "..", "attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "..", "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "..", "dist/public"),
      emptyOutDir: true,
    },
  };
  
  const viteLogger = createLogger();

  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );

      // Check if this route should be server-side rendered
      const requestUrl = new URL(url, 'http://localhost');
      const pathname = requestUrl.pathname;
      
      if (isSSRRoute(pathname)) {
        // Server-side render marketing pages
        try {
          const entryServer = await vite.ssrLoadModule("/src/entry-server.tsx");
          const generateHTML = entryServer.generateHTML as (url: string, search?: string) => Promise<{ html: string; ssrContext: any }>;
          const generateMetaTags = entryServer.generateMetaTags as (url: string) => string;

          if (typeof generateHTML !== "function" || typeof generateMetaTags !== "function") {
            throw new Error("SSR entry module did not export generateHTML and generateMetaTags");
          }

          const { html: appHtml, ssrContext } = await generateHTML(pathname, requestUrl.search);
          
          // Handle redirects
          if (ssrContext.redirectTo) {
            return res.redirect(302, ssrContext.redirectTo);
          }
          
          // Replace default meta tags with route-specific ones
          const metaTags = generateMetaTags(pathname);
          template = template.replace(
            /<!-- SSR_META_START -->[\s\S]*?<!-- SSR_META_END -->/,
            () => {
              const indentedMeta = metaTags
                .split("\n")
                .map((line) => (line ? `    ${line}` : ""))
                .join("\n");
              return `<!-- SSR_META_START -->\n${indentedMeta}\n    <!-- SSR_META_END -->`;
            }
          );

          if (!template.includes("data-ssr-styles")) {
            const styleHref = process.env.NODE_ENV === "development"
              ? "/src/index.css"
              : "/assets/index.css";
            const styleTag = `    <link rel="stylesheet" href="${styleHref}" data-ssr-styles />`;
            template = template.replace("</head>", `${styleTag}\n  </head>`);
          }
          
          // Inject the SSR-rendered content
          template = template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
        } catch (ssrError) {
          // Fall back to CSR if SSR fails
          console.error('SSR Error, falling back to CSR:', ssrError);
        }
      }

      // Inject chat widget config if available
      if ((req as any).chatWidgetConfig) {
        const config = (req as any).chatWidgetConfig;
        const configScript = `
          <script>
            window.__CHAT_WIDGET_CONFIG__ = ${JSON.stringify(config)};
          </script>
        `;
        template = template.replace('</head>', `${configScript}</head>`);
      }

      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
