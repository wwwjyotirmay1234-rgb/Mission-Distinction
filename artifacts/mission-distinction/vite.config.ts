import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 5173;

if (rawPort && (Number.isNaN(port) || port <= 0)) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? "/mission-distinction/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core — must be its own chunk so it's guaranteed to load before
          // any other vendor chunk that calls React.useLayoutEffect (e.g. R3F)
          if (
            id.includes("/node_modules/react/") ||
            id.includes("/node_modules/react-dom/") ||
            id.includes("/node_modules/react-is/") ||
            id.includes("/node_modules/scheduler/")
          ) {
            return "vendor-react";
          }
          // Three.js + R3F — large, only needed for Anatomy page
          if (id.includes("three") || id.includes("@react-three") || id.includes("@react-spring")) {
            return "vendor-three";
          }
          // Mermaid + d3 — large async deps; isolate so vendor-misc stays small
          if (
            id.includes("node_modules/mermaid") ||
            id.includes("node_modules/d3") ||
            id.includes("node_modules/@braintree") ||
            id.includes("node_modules/dagre") ||
            id.includes("node_modules/khroma") ||
            id.includes("node_modules/cytoscape") ||
            id.includes("node_modules/elkjs") ||
            id.includes("node_modules/stylis")
          ) {
            return "vendor-mermaid";
          }
          // Framer Motion
          if (id.includes("framer-motion")) {
            return "vendor-motion";
          }
          // Routing + data fetching
          if (id.includes("wouter") || id.includes("@tanstack/react-query")) {
            return "vendor-router";
          }
          // UI primitives (Radix, Lucide, cmdk, sonner)
          if (id.includes("@radix-ui") || id.includes("lucide-react") || id.includes("cmdk") || id.includes("sonner")) {
            return "vendor-ui";
          }
          // Everything else in node_modules → vendor-misc
          if (id.includes("node_modules")) {
            return "vendor-misc";
          }
        },
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
    },
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache",
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
