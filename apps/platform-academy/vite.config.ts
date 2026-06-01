import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

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
    proxy: {
      "/api": "http://localhost:8000",
      "/healthz": "http://localhost:8000",
      "/readyz": "http://localhost:8000",
      "/metrics": "http://localhost:8000"
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test.setup.ts"
  }
});
