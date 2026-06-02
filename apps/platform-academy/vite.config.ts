import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const apiProxyTarget = process.env.PLATFORM_ACADEMY_DEV_API_PROXY_TARGET || process.env.VITE_DEV_API_PROXY_TARGET || "";
const proxy = apiProxyTarget
  ? {
      "/api": apiProxyTarget,
      "/healthz": apiProxyTarget,
      "/readyz": apiProxyTarget,
      "/metrics": apiProxyTarget
    }
  : undefined;

function localEventsNoop(): Plugin {
  return {
    name: "local-events-noop",
    configureServer(server) {
      server.middlewares.use("/api/events", (_request, response) => {
        response.statusCode = 204;
        response.end();
      });
    }
  };
}

export default defineConfig({
  plugins: [localEventsNoop(), react()],
  server: {
    port: 5174,
    proxy
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test.setup.ts"
  }
});
