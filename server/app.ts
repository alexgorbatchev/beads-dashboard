import { existsSync } from "node:fs";
import path from "node:path";
import express from "express";
import cors from "cors";
import http from "http";
import {
  scanForProjects,
  getProjectStats,
  type Project,
} from "./db";
import {
  PROJECT_SETTINGS_FILE_NAME,
  readProjectSettings,
  getConfiguredProjects,
} from "./projectSettings";
import { getAllowedCorsOrigins } from "./corsOrigins";

export const app = express();
const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || 3001);
const ROOT_DIR = process.env.BEADS_ROOT || process.cwd();
const PROJECT_SETTINGS_PATH = path.join(process.cwd(), PROJECT_SETTINGS_FILE_NAME);
const allowedOrigins = getAllowedCorsOrigins(process.env);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
  }),
);
app.use(express.json());

export const server = http.createServer(app);

export function loadProjects(): Project[] {
  const projectSettings = readProjectSettings(PROJECT_SETTINGS_PATH);
  if (projectSettings.exists) {
    return getConfiguredProjects(PROJECT_SETTINGS_PATH);
  }
  return getProjectStats(scanForProjects(ROOT_DIR));
}

export function startServer() {
  server.listen(PORT, HOST, () => {
    console.log(`Beads Dashboard API running on http://${HOST}:${PORT}`);
    console.log(`WebSocket available at ws://${HOST}:${PORT}/ws`);
    if (existsSync(PROJECT_SETTINGS_PATH)) {
      console.log(`Loading configured projects from: ${PROJECT_SETTINGS_PATH}`);
    } else {
      console.log(`Scanning for projects in: ${ROOT_DIR}`);
    }
  });
}
