import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const frontendDirectory = fileURLToPath(new URL(".", import.meta.url));
const protectedDemoRoutes = [
  "/api/challenge/replay",
  "/api/challenge/live-replay",
  "/api/admin/alerts/",
] as const;

export default defineConfig(({ mode }) => {
  const backendDirectory = process.env.SENTINEL_BACKEND_DIR
    ?? resolve(frontendDirectory, "../hacktoon-saltillo");
  const backendEnvironment = loadEnv(mode, backendDirectory, "");
  const adminToken = process.env.SENTINEL_DEMO_ADMIN_TOKEN
    ?? process.env.ADMIN_TOKEN
    ?? backendEnvironment.ADMIN_TOKEN
    ?? "development-only-token";
  const mcpReadToken = process.env.MCP_READ_TOKEN
    ?? backendEnvironment.MCP_READ_TOKEN
    ?? "";

  const apiProxy = {
    target: process.env.SENTINEL_BACKEND_URL ?? "http://127.0.0.1:8000",
    changeOrigin: true,
    configure(proxy: { on: (event: "proxyReq", callback: (
      proxyRequest: { setHeader: (name: string, value: string) => void },
      request: { method?: string; url?: string },
    ) => void) => void }) {
      proxy.on("proxyReq", (proxyRequest, request) => {
        const requestPath = request.url ?? "";
        const requiresAdmin = request.method === "POST"
          && protectedDemoRoutes.some((route) => requestPath.startsWith(route));
        if (requiresAdmin) proxyRequest.setHeader("X-Admin-Token", adminToken);
        const requiresInvestigationRead = requestPath.startsWith("/api/incidents/")
          && (requestPath.endsWith("/investigate") || requestPath.includes("/investigations"));
        if (requiresInvestigationRead && mcpReadToken.length > 0) {
          proxyRequest.setHeader("Authorization", `Bearer ${mcpReadToken}`);
        }
      });
    },
  };

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": apiProxy,
        "/health": apiProxy,
      },
    },
  };
});
