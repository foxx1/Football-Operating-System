import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// apps/api's local dev port. Requests to /api and /uploads are proxied here
// so relative fetches keep working in dev without needing VITE_API_URL set —
// mirrors the same-origin experience apps/api used to provide directly.
const API_DEV_PORT = 5000;

export default defineConfig(async ({ mode }) => {
  // vite.config.ts runs in Node at config-authoring time, so import.meta.env
  // (a browser/build-time construct) isn't populated here — read the real
  // env the same way Vite itself does, via loadEnv.
  const env = loadEnv(mode, path.resolve(import.meta.dirname), "");
  const apiUrl = env.VITE_API_URL ?? "";

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "icon-16.png", "icon-32.png", "icon-128.png", "icon-180.png", "icon-192.png", "icon-512.png"],
        manifest: {
          name: "360 FOS — Football Operating System",
          short_name: "360 FOS",
          description: "AI-native Football Operating System connecting data, intelligence, and performance across the club.",
          theme_color: "#0B1320",
          background_color: "#0B1320",
          display: "standalone",
          orientation: "portrait",
          scope: "/",
          start_url: "/",
          icons: [
            { src: "icon-128.png", sizes: "128x128", type: "image/png" },
            { src: "icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "icon-512.png", sizes: "512x512", type: "image/png" },
            { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          navigateFallback: "/",
          navigateFallbackDenylist: [/^\/api\//],
          // apiUrl is "" in dev (relative, same-origin via the proxy below)
          // and an absolute origin like "https://api.360fos.com" in prod —
          // these patterns need to match whichever one actually appears on
          // outgoing requests, so they're built from the same value.
          runtimeCaching: [
            {
              urlPattern: new RegExp(`^${apiUrl}/api/`),
              handler: "NetworkFirst",
              options: {
                cacheName: "api-cache",
                expiration: { maxAgeSeconds: 60 * 5 },
                networkTimeoutSeconds: 10,
              },
            },
            {
              urlPattern: new RegExp(`^${apiUrl}/uploads/`),
              handler: "CacheFirst",
              options: {
                cacheName: "uploads-cache",
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
        },
      }),
      ...(mode !== "production" && process.env.REPL_ID !== undefined
        ? [
            await import("@replit/vite-plugin-cartographer").then((m) =>
              m.cartographer(),
            ),
          ]
        : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@shared": path.resolve(import.meta.dirname, "..", "..", "packages", "shared"),
        "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
      },
    },
    build: {
      outDir: path.resolve(import.meta.dirname, "dist"),
      emptyOutDir: true,
    },
    server: {
      hmr: {
        overlay: false,
      },
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
      proxy: {
        "/api": `http://localhost:${API_DEV_PORT}`,
        "/uploads": `http://localhost:${API_DEV_PORT}`,
      },
    },
  };
});
