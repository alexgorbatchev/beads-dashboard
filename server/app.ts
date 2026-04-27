import { existsSync } from "node:fs";
import path from "node:path";
import express, { type Response } from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import {
  scanForProjects,
  getProjectStats,
  getProjectIssues,
  getAllIssues,
  getIssue,
  updateIssueStatus,
  updateIssuePriority,
  updateIssueTitle,
  updateIssueDescription,
  updateIssueNotes,
  createIssue,
  deleteIssue,
  closeAllDbs,
  getIssueDependencies,
  getIssueBlockedBy,
  getIssueEvents,
  getIssueComments,
  getAllLabels,
  getReadyIssues,
  getBlockedIssues,
  getDetailedProjectStats,
  toggleIssuePinned,
  updateIssueDueDate,
  addIssueLabel,
  removeIssueLabel,
  supportsProjectWrites,
  type Project,
} from "./db";
import {
  addProjectSetting,
  PROJECT_SETTINGS_FILE_NAME,
  readProjectSettings,
  getConfiguredProjects,
  removeProjectSetting,
  updateProjectSetting,
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

// In-memory cache for projects
let projectsCache: Project[] = [];

export function loadProjects(): Project[] {
  const projectSettings = readProjectSettings(PROJECT_SETTINGS_PATH);
  if (projectSettings.exists) {
    return getConfiguredProjects(PROJECT_SETTINGS_PATH);
  }
  return getProjectStats(scanForProjects(ROOT_DIR));
}

function ensureProjectWritable(project: Project, res: Response): boolean {
  if (supportsProjectWrites(project.database)) {
    return true;
  }

  res.status(501).json({
    ok: false,
    error: "JSONL-backed projects are read-only in the dashboard. Use the beads CLI for mutations.",
  });
  return false;
}

// Scan and cache projects on startup
function refreshProjects(): Project[] {
  projectsCache = loadProjects();
  return projectsCache;
}

// Initialize projects
try {
  refreshProjects();
} catch (error) {
  console.error("Error initializing projects cache:", error);
}

// ============================================================================
// REST API Routes
// ============================================================================

// GET /api/projects - List all projects with issue counts
app.get("/api/projects", (_req, res) => {
  try {
    const projects = refreshProjects();
    res.json({ ok: true, projects });
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ ok: false, error: "Failed to fetch projects" });
  }
});

// GET /api/settings/projects - List configured project settings
app.get("/api/settings/projects", (_req, res) => {
  try {
    const settings = readProjectSettings(PROJECT_SETTINGS_PATH);
    res.json({ ok: true, settings });
  } catch (error) {
    console.error("Error fetching project settings:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch project settings" });
  }
});

// POST /api/settings/projects - Add configured project path
app.post("/api/settings/projects", (req, res) => {
  try {
    const { path: projectPath } = req.body;
    if (typeof projectPath !== "string") {
      res.status(400).json({ ok: false, error: "path is required" });
      return;
    }

    const settings = addProjectSetting(PROJECT_SETTINGS_PATH, projectPath);
    refreshProjects();
    broadcastUpdate({ type: "projects-refreshed" });
    res.json({ ok: true, settings });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }

    console.error("Error adding project setting:", error);
    res.status(500).json({ ok: false, error: "Failed to add project setting" });
  }
});

// PATCH /api/settings/projects - Update configured project path
app.patch("/api/settings/projects", (req, res) => {
  try {
    const { currentPath, nextPath } = req.body;
    if (typeof currentPath !== "string" || typeof nextPath !== "string") {
      res.status(400).json({ ok: false, error: "currentPath and nextPath are required" });
      return;
    }

    const settings = updateProjectSetting(PROJECT_SETTINGS_PATH, currentPath, nextPath);
    refreshProjects();
    broadcastUpdate({ type: "projects-refreshed" });
    res.json({ ok: true, settings });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }

    console.error("Error updating project setting:", error);
    res.status(500).json({ ok: false, error: "Failed to update project setting" });
  }
});

// DELETE /api/settings/projects - Remove configured project path
app.delete("/api/settings/projects", (req, res) => {
  try {
    const { path: projectPath } = req.body;
    if (typeof projectPath !== "string") {
      res.status(400).json({ ok: false, error: "path is required" });
      return;
    }

    const settings = removeProjectSetting(PROJECT_SETTINGS_PATH, projectPath);
    refreshProjects();
    broadcastUpdate({ type: "projects-refreshed" });
    res.json({ ok: true, settings });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ ok: false, error: error.message });
      return;
    }

    console.error("Error removing project setting:", error);
    res.status(500).json({ ok: false, error: "Failed to remove project setting" });
  }
});

// GET /api/projects/:name - Get single project by name
app.get("/api/projects/:name", (req, res) => {
  try {
    const project = projectsCache.find((p) => p.name === req.params.name);
    if (!project) {
      res.status(404).json({ ok: false, error: "Project not found" });
      return;
    }
    res.json({ ok: true, project });
  } catch (err) {
    console.error("Error fetching project:", err);
    res.status(500).json({ ok: false, error: "Failed to fetch project" });
  }
});

// GET /api/issues - Get all issues across projects
app.get("/api/issues", (req, res) => {
  try {
    const { status, limit, project } = req.query;

    let issues: ReturnType<typeof getProjectIssues>;
    if (project && project !== "__ALL__") {
      const proj = projectsCache.find((p) => p.name === project);
      if (!proj) {
        res.status(404).json({ ok: false, error: "Project not found" });
        return;
      }
      issues = getProjectIssues(proj.database, {
        status: status as string | undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      // Add project name to issues
      issues = issues.map((issue) => ({ ...issue, project: proj.name }));
    } else {
      issues = getAllIssues(projectsCache, {
        status: status as string | undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
    }

    res.json({ ok: true, issues });
  } catch (err) {
    console.error("Error fetching issues:", err);
    res.status(500).json({ ok: false, error: "Failed to fetch issues" });
  }
});

// GET /api/projects/:name/issues - Get issues for a specific project
app.get("/api/projects/:name/issues", (req, res) => {
  try {
    const project = projectsCache.find((p) => p.name === req.params.name);
    if (!project) {
      res.status(404).json({ ok: false, error: "Project not found" });
      return;
    }

    const { status, limit, offset } = req.query;
    const issues = getProjectIssues(project.database, {
      status: status as string | undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    // Add project name
    const issuesWithProject = issues.map((issue) => ({ ...issue, project: project.name }));

    res.json({ ok: true, issues: issuesWithProject });
  } catch (err) {
    console.error("Error fetching project issues:", err);
    res.status(500).json({ ok: false, error: "Failed to fetch issues" });
  }
});

// GET /api/projects/:name/issues/:id - Get single issue
app.get("/api/projects/:name/issues/:id", (req, res) => {
  try {
    const project = projectsCache.find((p) => p.name === req.params.name);
    if (!project) {
      res.status(404).json({ ok: false, error: "Project not found" });
      return;
    }

    const includeRelated = req.query.includeRelated === "true";
    const issue = getIssue(project.database, req.params.id, { includeRelated });
    if (!issue) {
      res.status(404).json({ ok: false, error: "Issue not found" });
      return;
    }

    res.json({ ok: true, issue: { ...issue, project: project.name } });
  } catch (err) {
    console.error("Error fetching issue:", err);
    res.status(500).json({ ok: false, error: "Failed to fetch issue" });
  }
});

// POST /api/projects/:name/issues - Create new issue
app.post("/api/projects/:name/issues", (req, res) => {
  try {
    const project = projectsCache.find((p) => p.name === req.params.name);
    if (!project) {
      res.status(404).json({ ok: false, error: "Project not found" });
      return;
    }
    if (!ensureProjectWritable(project, res)) {
      return;
    }

    const { id, title, description, priority, issue_type, assignee } = req.body;

    if (!id || !title) {
      res.status(400).json({ ok: false, error: "id and title are required" });
      return;
    }

    const success = createIssue(project.database, {
      id,
      title,
      description,
      priority,
      issue_type,
      assignee,
    });

    if (success) {
      // Refresh project stats
      refreshProjects();
      // Broadcast update
      broadcastUpdate({ type: "issue-created", project: project.name, issueId: id });
      res.json({ ok: true });
    } else {
      res.status(500).json({ ok: false, error: "Failed to create issue" });
    }
  } catch (err) {
    console.error("Error creating issue:", err);
    res.status(500).json({ ok: false, error: "Failed to create issue" });
  }
});

// PATCH /api/projects/:name/issues/:id - Update issue
app.patch("/api/projects/:name/issues/:id", (req, res) => {
  try {
    const project = projectsCache.find((p) => p.name === req.params.name);
    if (!project) {
      res.status(404).json({ ok: false, error: "Project not found" });
      return;
    }
    if (!ensureProjectWritable(project, res)) {
      return;
    }

    const { status, priority, title, description, notes, due_at } = req.body;
    let success = false;

    if (status !== undefined) {
      success = updateIssueStatus(project.database, req.params.id, status);
    }
    if (priority !== undefined) {
      success = updateIssuePriority(project.database, req.params.id, priority) || success;
    }
    if (title !== undefined) {
      success = updateIssueTitle(project.database, req.params.id, title) || success;
    }
    if (description !== undefined) {
      success = updateIssueDescription(project.database, req.params.id, description) || success;
    }
    if (notes !== undefined) {
      success = updateIssueNotes(project.database, req.params.id, notes) || success;
    }
    if (due_at !== undefined) {
      success = updateIssueDueDate(project.database, req.params.id, due_at) || success;
    }

    if (success) {
      // Refresh project stats if status changed
      if (status !== undefined) {
        refreshProjects();
      }
      // Broadcast update
      broadcastUpdate({ type: "issue-updated", project: project.name, issueId: req.params.id });
      res.json({ ok: true });
    } else {
      res.status(404).json({ ok: false, error: "Issue not found or no changes made" });
    }
  } catch (err) {
    console.error("Error updating issue:", err);
    res.status(500).json({ ok: false, error: "Failed to update issue" });
  }
});

// DELETE /api/projects/:name/issues/:id - Soft delete issue
app.delete("/api/projects/:name/issues/:id", (req, res) => {
  try {
    const project = projectsCache.find((p) => p.name === req.params.name);
    if (!project) {
      res.status(404).json({ ok: false, error: "Project not found" });
      return;
    }
    if (!ensureProjectWritable(project, res)) {
      return;
    }

    const success = deleteIssue(project.database, req.params.id);

    if (success) {
      refreshProjects();
      broadcastUpdate({ type: "issue-deleted", project: project.name, issueId: req.params.id });
      res.json({ ok: true });
    } else {
      res.status(404).json({ ok: false, error: "Issue not found" });
    }
  } catch (err) {
    console.error("Error deleting issue:", err);
    res.status(500).json({ ok: false, error: "Failed to delete issue" });
  }
});

// POST /api/refresh - Force refresh projects cache
app.post("/api/refresh", (_req, res) => {
  try {
    const projects = refreshProjects();
    broadcastUpdate({ type: "projects-refreshed" });
    res.json({ ok: true, count: projects.length });
  } catch (err) {
    console.error("Error refreshing projects:", err);
    res.status(500).json({ ok: false, error: "Failed to refresh projects" });
  }
});

// ============================================================================
// Extended API Routes (Dependencies, Labels, Events, Stats)
// ============================================================================

// GET /api/projects/:name/labels - Get all labels in a project
app.get("/api/projects/:name/labels", (req, res) => {
  try {
    const project = projectsCache.find((p) => p.name === req.params.name);
    if (!project) {
      res.status(404).json({ ok: false, error: "Project not found" });
      return;
    }
    const labels = getAllLabels(project.database);
    res.json({ ok: true, labels });
  } catch (err) {
    console.error("Error fetching labels:", err);
    res.status(500).json({ ok: false, error: "Failed to fetch labels" });
  }
});

// GET /api/projects/:name/ready - Get ready issues (no blockers)
app.get("/api/projects/:name/ready", (req, res) => {
  try {
    const project = projectsCache.find((p) => p.name === req.params.name);
    if (!project) {
      res.status(404).json({ ok: false, error: "Project not found" });
      return;
    }
    const issues = getReadyIssues(project.database);
    const issuesWithProject = issues.map((issue) => ({ ...issue, project: project.name }));
    res.json({ ok: true, issues: issuesWithProject });
  } catch (err) {
    console.error("Error fetching ready issues:", err);
    res.status(500).json({ ok: false, error: "Failed to fetch ready issues" });
  }
});

// GET /api/projects/:name/blocked - Get blocked issues
app.get("/api/projects/:name/blocked", (req, res) => {
  try {
    const project = projectsCache.find((p) => p.name === req.params.name);
    if (!project) {
      res.status(404).json({ ok: false, error: "Project not found" });
      return;
    }
    const issues = getBlockedIssues(project.database);
    const issuesWithProject = issues.map((issue) => ({ ...issue, project: project.name }));
    res.json({ ok: true, issues: issuesWithProject });
  } catch (err) {
    console.error("Error fetching blocked issues:", err);
    res.status(500).json({ ok: false, error: "Failed to fetch blocked issues" });
  }
});

// GET /api/projects/:name/stats - Get detailed project statistics
app.get("/api/projects/:name/stats", (req, res) => {
  try {
    const project = projectsCache.find((p) => p.name === req.params.name);
    if (!project) {
      res.status(404).json({ ok: false, error: "Project not found" });
      return;
    }
    const stats = getDetailedProjectStats(project.database);
    res.json({ ok: true, stats });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ ok: false, error: "Failed to fetch stats" });
  }
});

type ProjectStatsMap = Record<string, { total: number; open: number; ready: number }>;

// GET /api/stats - Get aggregated stats across all projects
app.get("/api/stats", (_req, res) => {
  try {
    const aggregated = {
      total: 0,
      open: 0,
      in_progress: 0,
      closed: 0,
      blocked: 0,
      ready: 0,
      overdue: 0,
      byProject: {} as ProjectStatsMap,
    };

    for (const project of projectsCache) {
      try {
        const stats = getDetailedProjectStats(project.database);
        aggregated.total += stats.total;
        aggregated.open += stats.open;
        aggregated.in_progress += stats.in_progress;
        aggregated.closed += stats.closed;
        aggregated.blocked += stats.blocked;
        aggregated.ready += stats.ready;
        aggregated.overdue += stats.overdue;
        aggregated.byProject[project.name] = {
          total: stats.total,
          open: stats.open,
          ready: stats.ready,
        };
      } catch {
        // Skip projects with errors
      }
    }

    res.json({ ok: true, stats: aggregated });
  } catch (err) {
    console.error("Error fetching aggregated stats:", err);
    res.status(500).json({ ok: false, error: "Failed to fetch stats" });
  }
});

// GET /api/ready - Get ready issues across all projects
app.get("/api/ready", (_req, res) => {
  try {
    const allReady: ReturnType<typeof getReadyIssues> = [];
    for (const project of projectsCache) {
      try {
        const issues = getReadyIssues(project.database);
        for (const issue of issues) {
          allReady.push({ ...issue, project: project.name });
        }
      } catch {
        // Skip projects with errors
      }
    }
    // Sort by priority then updated_at
    allReady.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    res.json({ ok: true, issues: allReady });
  } catch (err) {
    console.error("Error fetching ready issues:", err);
    res.status(500).json({ ok: false, error: "Failed to fetch ready issues" });
  }
});

// GET /api/projects/:name/issues/:id/dependencies - Get issue dependencies
app.get("/api/projects/:name/issues/:id/dependencies", (req, res) => {
  try {
    const project = projectsCache.find((p) => p.name === req.params.name);
    if (!project) {
      res.status(404).json({ ok: false, error: "Project not found" });
      return;
    }
    const dependencies = getIssueDependencies(project.database, req.params.id);
    const blockedBy = getIssueBlockedBy(project.database, req.params.id);
    res.json({ ok: true, dependencies, blockedBy });
  } catch (err) {
    console.error("Error fetching dependencies:", err);
    res.status(500).json({ ok: false, error: "Failed to fetch dependencies" });
  }
});

// GET /api/projects/:name/issues/:id/events - Get issue events/history
app.get("/api/projects/:name/issues/:id/events", (req, res) => {
  try {
    const project = projectsCache.find((p) => p.name === req.params.name);
    if (!project) {
      res.status(404).json({ ok: false, error: "Project not found" });
      return;
    }
    const events = getIssueEvents(project.database, req.params.id);
    res.json({ ok: true, events });
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ ok: false, error: "Failed to fetch events" });
  }
});

// GET /api/projects/:name/issues/:id/comments - Get issue comments
app.get("/api/projects/:name/issues/:id/comments", (req, res) => {
  try {
    const project = projectsCache.find((p) => p.name === req.params.name);
    if (!project) {
      res.status(404).json({ ok: false, error: "Project not found" });
      return;
    }
    const comments = getIssueComments(project.database, req.params.id);
    res.json({ ok: true, comments });
  } catch (err) {
    console.error("Error fetching comments:", err);
    res.status(500).json({ ok: false, error: "Failed to fetch comments" });
  }
});

// POST /api/projects/:name/issues/:id/pin - Toggle pin status
app.post("/api/projects/:name/issues/:id/pin", (req, res) => {
  try {
    const project = projectsCache.find((p) => p.name === req.params.name);
    if (!project) {
      res.status(404).json({ ok: false, error: "Project not found" });
      return;
    }
    if (!ensureProjectWritable(project, res)) {
      return;
    }
    const success = toggleIssuePinned(project.database, req.params.id);
    if (success) {
      broadcastUpdate({ type: "issue-updated", project: project.name, issueId: req.params.id });
      res.json({ ok: true });
    } else {
      res.status(404).json({ ok: false, error: "Issue not found" });
    }
  } catch (err) {
    console.error("Error toggling pin:", err);
    res.status(500).json({ ok: false, error: "Failed to toggle pin" });
  }
});

// POST /api/projects/:name/issues/:id/labels - Add label
app.post("/api/projects/:name/issues/:id/labels", (req, res) => {
  try {
    const project = projectsCache.find((p) => p.name === req.params.name);
    if (!project) {
      res.status(404).json({ ok: false, error: "Project not found" });
      return;
    }
    if (!ensureProjectWritable(project, res)) {
      return;
    }
    const { label } = req.body;
    if (!label) {
      res.status(400).json({ ok: false, error: "Label is required" });
      return;
    }
    addIssueLabel(project.database, req.params.id, label);
    broadcastUpdate({ type: "issue-updated", project: project.name, issueId: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    console.error("Error adding label:", err);
    res.status(500).json({ ok: false, error: "Failed to add label" });
  }
});

// DELETE /api/projects/:name/issues/:id/labels/:label - Remove label
app.delete("/api/projects/:name/issues/:id/labels/:label", (req, res) => {
  try {
    const project = projectsCache.find((p) => p.name === req.params.name);
    if (!project) {
      res.status(404).json({ ok: false, error: "Project not found" });
      return;
    }
    if (!ensureProjectWritable(project, res)) {
      return;
    }
    removeIssueLabel(project.database, req.params.id, req.params.label);
    broadcastUpdate({ type: "issue-updated", project: project.name, issueId: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    console.error("Error removing label:", err);
    res.status(500).json({ ok: false, error: "Failed to remove label" });
  }
});

// ============================================================================
// WebSocket Server for real-time updates
// ============================================================================

const wss = new WebSocketServer({ server, path: "/ws" });

const clients = new Set<WebSocket>();

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log("WebSocket client connected");

  // Send initial projects list
  ws.send(JSON.stringify({ type: "projects", projects: projectsCache }));

  ws.on("close", () => {
    clients.delete(ws);
    console.log("WebSocket client disconnected");
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err);
    clients.delete(ws);
  });
});

function broadcastUpdate(message: Record<string, unknown>) {
  const data = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
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
    console.log(`Found ${projectsCache.length} projects`);
  });
}

// Cleanup on exit
process.on("SIGINT", () => {
  console.log("\nShutting down...");
  closeAllDbs();
  server.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  closeAllDbs();
  server.close();
  process.exit(0);
});

if (import.meta.main) {
  startServer();
}
