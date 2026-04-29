import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { type Request } from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import {
  scanForProjects,
  getProjectStats,
  getProjectIssues,
  getAllIssues,
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
  type IIssue,
  type IProject,
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
import { getIssueFromBeadsCli } from "./getIssueFromBeadsCli";
import { getIssueGitDiff } from "./gitDiff";

export const app = express();
const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || 3001);
const ROOT_DIR = process.env.BEADS_ROOT || process.cwd();
const PROJECT_SETTINGS_PATH = path.join(process.cwd(), PROJECT_SETTINGS_FILE_NAME);
const DASHBOARD_STATIC_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
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
let projectsCache: IProject[] = [];

export async function loadProjects(): Promise<IProject[]> {
  const projectSettings = await readProjectSettings(PROJECT_SETTINGS_PATH);
  if (projectSettings.exists) {
    return getConfiguredProjects(PROJECT_SETTINGS_PATH);
  }
  return getProjectStats(await scanForProjects(ROOT_DIR));
}

// Scan and cache projects on startup
async function refreshProjects(): Promise<IProject[]> {
  projectsCache = await loadProjects();
  return projectsCache;
}

// ============================================================================
// REST API Routes
// ============================================================================

// GET /api/projects - List all projects with issue counts
app.get("/api/projects", async (_req, res) => {
  try {
    const projects = await refreshProjects();
    res.json({ ok: true, projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch projects" });
  }
});

// GET /api/settings/projects - List configured project settings
app.get("/api/settings/projects", async (_req, res) => {
  try {
    const settings = await readProjectSettings(PROJECT_SETTINGS_PATH);
    res.json({ ok: true, settings });
  } catch (error) {
    console.error("Error fetching project settings:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch project settings" });
  }
});

// POST /api/settings/projects - Add configured project path
app.post("/api/settings/projects", async (req, res) => {
  try {
    const { path: projectPath } = req.body;
    if (typeof projectPath !== "string") {
      res.status(400).json({ ok: false, error: "path is required" });
      return;
    }

    const settings = await addProjectSetting(PROJECT_SETTINGS_PATH, projectPath);
    await refreshProjects();
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
app.patch("/api/settings/projects", async (req, res) => {
  try {
    const { currentPath, nextPath } = req.body;
    if (typeof currentPath !== "string" || typeof nextPath !== "string") {
      res.status(400).json({ ok: false, error: "currentPath and nextPath are required" });
      return;
    }

    const settings = await updateProjectSetting(PROJECT_SETTINGS_PATH, currentPath, nextPath);
    await refreshProjects();
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
app.delete("/api/settings/projects", async (req, res) => {
  try {
    const { path: projectPath } = req.body;
    if (typeof projectPath !== "string") {
      res.status(400).json({ ok: false, error: "path is required" });
      return;
    }

    const settings = await removeProjectSetting(PROJECT_SETTINGS_PATH, projectPath);
    await refreshProjects();
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
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch project" });
  }
});

// GET /api/issues - Get all issues across projects
app.get("/api/issues", async (req, res) => {
  try {
    const { status, limit, project } = req.query;

    let issues: IIssue[];
    if (project && project !== "__ALL__") {
      const proj = projectsCache.find((p) => p.name === project);
      if (!proj) {
        res.status(404).json({ ok: false, error: "Project not found" });
        return;
      }
      issues = await getProjectIssues(proj.path, {
        status: status as string | undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      // Add project name to issues
      issues = issues.map((issue) => ({ ...issue, project: proj.name }));
    } else {
      issues = await getAllIssues(projectsCache, {
        status: status as string | undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
    }

    res.json({ ok: true, issues });
  } catch (error) {
    console.error("Error fetching issues:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch issues" });
  }
});

// GET /api/projects/:name/issues - Get issues for a specific project
app.get("/api/projects/:name/issues", async (req, res) => {
  try {
    const project = projectsCache.find((p) => p.name === req.params.name);
    if (!project) {
      res.status(404).json({ ok: false, error: "Project not found" });
      return;
    }

    const { status, limit, offset } = req.query;
    const issues = await getProjectIssues(project.path, {
      status: status as string | undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    // Add project name
    const issuesWithProject = issues.map((issue) => ({ ...issue, project: project.name }));

    res.json({ ok: true, issues: issuesWithProject });
  } catch (error) {
    console.error("Error fetching project issues:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch issues" });
  }
});

// GET /api/projects/:name/issues/:id - Get single issue
app.get("/api/projects/:name/issues/:id", async (req, res) => {
  try {
    const project = projectsCache.find((p) => p.name === req.params.name);
    if (!project) {
      res.status(404).json({ ok: false, error: "Project not found" });
      return;
    }

    const includeRelated = req.query.includeRelated === "true";
    const issue = await getIssueFromBeadsCli(project.path, req.params.id, { includeRelated });
    if (!issue) {
      res.status(404).json({ ok: false, error: "Issue not found" });
      return;
    }

    res.json({ ok: true, issue: { ...issue, project: project.name } });
  } catch (error) {
    console.error("Error fetching issue:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch issue" });
  }
});

// GET /api/projects/:name/issues/:id/diff - Get git branch/worktree diff for an issue
app.get("/api/projects/:name/issues/:id/diff", async (req, res) => {
  try {
    const project = projectsCache.find((p) => p.name === req.params.name);
    if (!project) {
      res.status(404).json({ ok: false, error: "Project not found" });
      return;
    }

    const diff = getIssueGitDiff({ issueId: req.params.id, projectPath: project.path });
    res.json({ ok: true, diff });
  } catch (error) {
    console.error("Error fetching issue git diff:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch issue git diff" });
  }
});

// POST /api/projects/:name/issues - Create new issue
app.post("/api/projects/:name/issues", async (req, res) => {
  try {
    const project = projectsCache.find((p) => p.name === req.params.name);
    if (!project) {
      res.status(404).json({ ok: false, error: "Project not found" });
      return;
    }
    const { id, title, description, priority, issue_type, assignee } = req.body;

    if (!id || !title) {
      res.status(400).json({ ok: false, error: "id and title are required" });
      return;
    }

    const success = await createIssue(project.path, {
      id,
      title,
      description,
      priority,
      issue_type,
      assignee,
    });

    if (success) {
      // Refresh project stats
      await refreshProjects();
      // Broadcast update
      broadcastUpdate({ type: "issue-created", project: project.name, issueId: id });
      res.json({ ok: true });
    } else {
      res.status(500).json({ ok: false, error: "Failed to create issue" });
    }
  } catch (error) {
    console.error("Error creating issue:", error);
    res.status(500).json({ ok: false, error: "Failed to create issue" });
  }
});

// PATCH /api/projects/:name/issues/:id - Update issue
app.patch("/api/projects/:name/issues/:id", async (req, res) => {
  try {
    const project = projectsCache.find((p) => p.name === req.params.name);
    if (!project) {
      res.status(404).json({ ok: false, error: "Project not found" });
      return;
    }
    const { status, priority, title, description, notes, due_at } = req.body;
    let success = false;

    if (status !== undefined) {
      success = await updateIssueStatus(project.path, req.params.id, status);
    }
    if (priority !== undefined) {
      success = (await updateIssuePriority(project.path, req.params.id, priority)) || success;
    }
    if (title !== undefined) {
      success = (await updateIssueTitle(project.path, req.params.id, title)) || success;
    }
    if (description !== undefined) {
      success = (await updateIssueDescription(project.path, req.params.id, description)) || success;
    }
    if (notes !== undefined) {
      success = (await updateIssueNotes(project.path, req.params.id, notes)) || success;
    }
    if (due_at !== undefined) {
      success = (await updateIssueDueDate(project.path, req.params.id, due_at)) || success;
    }

    if (success) {
      // Refresh project stats if status changed
      if (status !== undefined) {
        await refreshProjects();
      }
      // Broadcast update
      broadcastUpdate({ type: "issue-updated", project: project.name, issueId: req.params.id });
      res.json({ ok: true });
    } else {
      res.status(404).json({ ok: false, error: "Issue not found or no changes made" });
    }
  } catch (error) {
    console.error("Error updating issue:", error);
    res.status(500).json({ ok: false, error: "Failed to update issue" });
  }
});

// DELETE /api/projects/:name/issues/:id - Soft delete issue
app.delete("/api/projects/:name/issues/:id", async (req, res) => {
  try {
    const project = projectsCache.find((p) => p.name === req.params.name);
    if (!project) {
      res.status(404).json({ ok: false, error: "Project not found" });
      return;
    }
    const success = await deleteIssue(project.path, req.params.id);

    if (success) {
      await refreshProjects();
      broadcastUpdate({ type: "issue-deleted", project: project.name, issueId: req.params.id });
      res.json({ ok: true });
    } else {
      res.status(404).json({ ok: false, error: "Issue not found" });
    }
  } catch (error) {
    console.error("Error deleting issue:", error);
    res.status(500).json({ ok: false, error: "Failed to delete issue" });
  }
});

// POST /api/refresh - Force refresh projects cache
app.post("/api/refresh", async (_req, res) => {
  try {
    const projects = await refreshProjects();
    broadcastUpdate({ type: "projects-refreshed" });
    res.json({ ok: true, count: projects.length });
  } catch (error) {
    console.error("Error refreshing projects:", error);
    res.status(500).json({ ok: false, error: "Failed to refresh projects" });
  }
});

// ============================================================================
// Extended API Routes (Dependencies, Labels, Events, Stats)
// ============================================================================

// GET /api/projects/:name/labels - Get all labels in a project
app.get("/api/projects/:name/labels", async (req, res) => {
  try {
    const project = projectsCache.find((p) => p.name === req.params.name);
    if (!project) {
      res.status(404).json({ ok: false, error: "Project not found" });
      return;
    }
    const labels = await getAllLabels(project.path);
    res.json({ ok: true, labels });
  } catch (error) {
    console.error("Error fetching labels:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch labels" });
  }
});

// GET /api/projects/:name/ready - Get ready issues (no blockers)
app.get("/api/projects/:name/ready", async (req, res) => {
  try {
    const project = projectsCache.find((p) => p.name === req.params.name);
    if (!project) {
      res.status(404).json({ ok: false, error: "Project not found" });
      return;
    }
    const issues = await getReadyIssues(project.path);
    const issuesWithProject = issues.map((issue) => ({ ...issue, project: project.name }));
    res.json({ ok: true, issues: issuesWithProject });
  } catch (error) {
    console.error("Error fetching ready issues:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch ready issues" });
  }
});

// GET /api/projects/:name/blocked - Get blocked issues
app.get("/api/projects/:name/blocked", async (req, res) => {
  try {
    const project = projectsCache.find((p) => p.name === req.params.name);
    if (!project) {
      res.status(404).json({ ok: false, error: "Project not found" });
      return;
    }
    const issues = await getBlockedIssues(project.path);
    const issuesWithProject = issues.map((issue) => ({ ...issue, project: project.name }));
    res.json({ ok: true, issues: issuesWithProject });
  } catch (error) {
    console.error("Error fetching blocked issues:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch blocked issues" });
  }
});

// GET /api/projects/:name/stats - Get detailed project statistics
app.get("/api/projects/:name/stats", async (req, res) => {
  try {
    const project = projectsCache.find((p) => p.name === req.params.name);
    if (!project) {
      res.status(404).json({ ok: false, error: "Project not found" });
      return;
    }
    const stats = await getDetailedProjectStats(project.path);
    res.json({ ok: true, stats });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch stats" });
  }
});

interface IProjectStatsSummary {
  total: number;
  open: number;
  ready: number;
}

type ProjectStatsMap = Record<string, IProjectStatsSummary>;

// GET /api/stats - Get aggregated stats across all projects
app.get("/api/stats", async (_req, res) => {
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
        const stats = await getDetailedProjectStats(project.path);
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
  } catch (error) {
    console.error("Error fetching aggregated stats:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch stats" });
  }
});

// GET /api/ready - Get ready issues across all projects
app.get("/api/ready", async (_req, res) => {
  try {
    const allReady: IIssue[] = [];
    for (const project of projectsCache) {
      try {
        const issues = await getReadyIssues(project.path);
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
  } catch (error) {
    console.error("Error fetching ready issues:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch ready issues" });
  }
});

// GET /api/projects/:name/issues/:id/dependencies - Get issue dependencies
app.get("/api/projects/:name/issues/:id/dependencies", async (req, res) => {
  try {
    const project = projectsCache.find((p) => p.name === req.params.name);
    if (!project) {
      res.status(404).json({ ok: false, error: "Project not found" });
      return;
    }
    const dependencies = await getIssueDependencies(project.path, req.params.id);
    const blockedBy = await getIssueBlockedBy(project.path, req.params.id);
    res.json({ ok: true, dependencies, blockedBy });
  } catch (error) {
    console.error("Error fetching dependencies:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch dependencies" });
  }
});

// GET /api/projects/:name/issues/:id/events - Get issue events/history
app.get("/api/projects/:name/issues/:id/events", async (req, res) => {
  try {
    const project = projectsCache.find((p) => p.name === req.params.name);
    if (!project) {
      res.status(404).json({ ok: false, error: "Project not found" });
      return;
    }
    const events = await getIssueEvents(project.path, req.params.id);
    res.json({ ok: true, events });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch events" });
  }
});

// GET /api/projects/:name/issues/:id/comments - Get issue comments
app.get("/api/projects/:name/issues/:id/comments", async (req, res) => {
  try {
    const project = projectsCache.find((p) => p.name === req.params.name);
    if (!project) {
      res.status(404).json({ ok: false, error: "Project not found" });
      return;
    }
    const comments = await getIssueComments(project.path, req.params.id);
    res.json({ ok: true, comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch comments" });
  }
});

// POST /api/projects/:name/issues/:id/pin - Toggle pin status
app.post("/api/projects/:name/issues/:id/pin", async (req, res) => {
  try {
    const project = projectsCache.find((p) => p.name === req.params.name);
    if (!project) {
      res.status(404).json({ ok: false, error: "Project not found" });
      return;
    }
    const success = await toggleIssuePinned(project.path, req.params.id);
    if (success) {
      broadcastUpdate({ type: "issue-updated", project: project.name, issueId: req.params.id });
      res.json({ ok: true });
    } else {
      res.status(404).json({ ok: false, error: "Issue not found" });
    }
  } catch (error) {
    console.error("Error toggling pin:", error);
    res.status(500).json({ ok: false, error: "Failed to toggle pin" });
  }
});

// POST /api/projects/:name/issues/:id/labels - Add label
app.post("/api/projects/:name/issues/:id/labels", async (req, res) => {
  try {
    const project = projectsCache.find((p) => p.name === req.params.name);
    if (!project) {
      res.status(404).json({ ok: false, error: "Project not found" });
      return;
    }
    const { label } = req.body;
    if (!label) {
      res.status(400).json({ ok: false, error: "Label is required" });
      return;
    }
    const success = await addIssueLabel(project.path, req.params.id, label);
    if (success) {
      broadcastUpdate({ type: "issue-updated", project: project.name, issueId: req.params.id });
      res.json({ ok: true });
    } else {
      res.status(404).json({ ok: false, error: "Issue not found or label not added" });
    }
  } catch (error) {
    console.error("Error adding label:", error);
    res.status(500).json({ ok: false, error: "Failed to add label" });
  }
});

// DELETE /api/projects/:name/issues/:id/labels/:label - Remove label
app.delete("/api/projects/:name/issues/:id/labels/:label", async (req, res) => {
  try {
    const project = projectsCache.find((p) => p.name === req.params.name);
    if (!project) {
      res.status(404).json({ ok: false, error: "Project not found" });
      return;
    }
    const success = await removeIssueLabel(project.path, req.params.id, req.params.label);
    if (success) {
      broadcastUpdate({ type: "issue-updated", project: project.name, issueId: req.params.id });
      res.json({ ok: true });
    } else {
      res.status(404).json({ ok: false, error: "Issue not found or label not removed" });
    }
  } catch (error) {
    console.error("Error removing label:", error);
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

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
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

function shouldServeDashboardFallback(req: Request): boolean {
  if (req.method !== "GET") {
    return false;
  }

  return !req.path.startsWith("/api") && req.path !== "/ws" && !req.path.startsWith("/ws/");
}

if (existsSync(DASHBOARD_STATIC_PATH)) {
  app.use(express.static(DASHBOARD_STATIC_PATH));
  app.use((req, res, next) => {
    if (!shouldServeDashboardFallback(req)) {
      next();
      return;
    }

    res.sendFile(path.join(DASHBOARD_STATIC_PATH, "index.html"));
  });
}

export async function startServer(): Promise<void> {
  try {
    await refreshProjects();
  } catch (error) {
    console.error("Error initializing projects cache:", error);
  }

  server.listen(PORT, HOST, () => {
    console.log(`Beads Dashboard running on http://${HOST}:${PORT}`);
    console.log(`API available at http://${HOST}:${PORT}/api`);
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
  startServer().catch((error) => {
    console.error("Error starting server:", error);
    process.exit(1);
  });
}
