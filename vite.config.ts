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
