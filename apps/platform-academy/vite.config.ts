import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const apiProxyTarget = process.env.PLATFORM_ACADEMY_DEV_API_PROXY_TARGET || process.env.VITE_DEV_API_PROXY_TARGET || "";
const proxy = apiProxyTarget
  ? {
      "/api": apiProxyTarget,
      "/healthz": apiProxyTarget,
      "/readyz": apiProxyTarget,
      "/metrics": apiProxyTarget
    }
  : undefined;

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom") || id.includes("node_modules/react-router-dom")) {
            return "vendor-react";
          }
          if (id.includes("node_modules/@tanstack")) return "vendor-query";
          if (id.includes("node_modules/lucide-react")) return "vendor-icons";
          if (id.includes("/src/components/reference-figma/v2/")) return "reference-figma-v2";
          if (id.includes("/src/components/reference-figma/v1/")) return "reference-figma-data";
          if (id.includes("/src/reference-figma-v")) return "reference-figma-styles";
        }
      }
    }
  },
  server: {
    port: 5174,
    proxy
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test.setup.ts"
  }
});
