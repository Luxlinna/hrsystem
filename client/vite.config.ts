import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import AutoImport from "unplugin-auto-import/vite";
// import { readdyJsxRuntimeProxyPlugin } from "./vite.jsx-runtime-proxy";

const base = process.env.BASE_PATH || "/";
const port = Number(process.env.PORT) || 3000;
const isPreview = process.env.IS_PREVIEW ? true : false;
//const proxyPlugins = isPreview ? [readdyJsxRuntimeProxyPlugin()] : [];
// https://vite.dev/config/
export default defineConfig({
  // Load .env from the monorepo root so VITE_* vars defined in root .env are available
  envDir: resolve(process.cwd(), ".."),
  define: {
    __BASE_PATH__: JSON.stringify(base),
    __IS_PREVIEW__: JSON.stringify(isPreview),
    __READDY_PROJECT_ID__: JSON.stringify(process.env.PROJECT_ID || ""),
    __READDY_VERSION_ID__: JSON.stringify(process.env.VERSION_ID || ""),
    __READDY_AI_DOMAIN__: JSON.stringify(process.env.READDY_AI_DOMAIN || ""),
  },
  plugins: [
    react() as any,
    AutoImport({
      imports: [
        'react',
        'react-router-dom',
        'react-i18next',
      ],
      dts: true,
    }) as any,
  ],
  base,
  build: {
    sourcemap: true,
    outDir: resolve(process.cwd(), "../out"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
  },
  resolve: {
    alias: {
      "@": resolve(process.cwd(), "./src"),
      "@shared": resolve(process.cwd(), "./src/shared"),
      "@features": resolve(process.cwd(), "./src/features"),
      "xlsx": resolve(process.cwd(), "./src/lib/xlsx.ts"),
    },
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: [".opssolution.tech", "hrsystem.opssolution.tech"],
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/health": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/iclock": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "react-easy-crop", "@supabase/supabase-js"],
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: [".opssolution.tech", "hrsystem.opssolution.tech"],
  },
});
