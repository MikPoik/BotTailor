/**
 * Vite build configuration for client and SSR builds.
 *
 * Responsibilities:
 * - Configures plugins, aliases, and build output for both client and SSR.
 * - Handles dev/prod branching, REPL/Cartographer plugin, and Stack integration.
 * - Ensures correct output paths and entrypoints for Docker and Fly.io deploys.
 *
 * Constraints & Edge Cases:
 * - Must keep alias and output paths in sync with Dockerfile and server/vite.ts.
 * - SSR and client builds must both be produced for production deploys.
 * - NODE_ENV and REPL_ID affect plugin config and build output.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig(async () => {
  const plugins = [react(), runtimeErrorOverlay()];

  if (
    process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
  ) {
    const { cartographer } = await import("@replit/vite-plugin-cartographer");
    plugins.push(cartographer());
  }

  const root = path.resolve(import.meta.dirname, "client");
  const isServerBuild = Boolean(process.argv.includes("--ssr"));

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    logLevel: 'warn',
    ssr: {
      noExternal: ["@stackframe/react", "@stackframe/stack-ui"],
    },
    root,
    build: {
      outDir: isServerBuild
        ? path.resolve(import.meta.dirname, "dist/server")
        : path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: !isServerBuild,
      ssr: isServerBuild
        ? path.resolve(root, "src/entry-server.tsx")
        : undefined,
      rollupOptions: isServerBuild
        ? {
            input: path.resolve(root, "src/entry-server.tsx"),
            output: {
              entryFileNames: "entry-server.js",
            },
          }
        : undefined,
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
