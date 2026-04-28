import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

import { fileURLToPath } from "node:url";

const dirname = typeof __dirname !== "undefined"
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));

function getAllowedHosts(rawAllowedHosts: string | undefined): string[] {
  if (!rawAllowedHosts) {
    return [];
  }

  return rawAllowedHosts
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean);
}
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: "0.0.0.0",
      allowedHosts: getAllowedHosts(environment.ALLOWED_HOSTS),
      proxy: {
        "/api": {
          target: "http://127.0.0.1:3001",
          changeOrigin: true,
        },
        "/ws": {
          target: "ws://127.0.0.1:3001",
          ws: true,
        },
      },
    },
    preview: {
      host: "0.0.0.0",
    },
    resolve: {
      alias: {
        "@": path.resolve(dirname, "./src"),
      },
    },
  };
});
