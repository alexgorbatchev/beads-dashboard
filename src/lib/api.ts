import type {
  IProject,
  IProjectSettings,
  ISsue,
  IDependency,
  ISsueEvent,
  IComment,
  IProjectStats,
  IAggregatedStats,
  ILabelCount,
  IFetchIssuesParams,
  ICreateIssueData,
  IDependenciesResponse,
  IssueUpdate,
} from "../types";
import { readApiResponse } from "./readApiResponse";

const DEFAULT_API_BASE = "/api";
const apiBase = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;

function getWebSocketUrl(): string {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
}

interface IApiResponse<T> {
  ok: boolean;
  error?: string;
  projects?: T;
  issues?: T;
  issue?: T;
  project?: T;
  labels?: T;
  stats?: T;
  events?: T;
  comments?: T;
  dependencies?: IDependency[];
  blockedBy?: IDependency[];
  settings?: T;
}

// ============================================================================
// Projects
// ============================================================================

export async function fetchProjects(): Promise<IProject[]> {
  const res = await fetch(`${apiBase}/projects`);
  const data = await readApiResponse<IApiResponse<IProject[]>>(res, `${apiBase}/projects`);
  if (!data.ok) throw new Error(data.error || "Failed to fetch projects");
  return data.projects || [];
}

export async function fetchProjectSettings(): Promise<IProjectSettings> {
  const res = await fetch(`${apiBase}/settings/projects`);
  const data = await readApiResponse<IApiResponse<IProjectSettings>>(res, `${apiBase}/settings/projects`);
  if (!data.ok || !data.settings) {
    throw new Error(data.error || "Failed to fetch project settings");
  }

  return data.settings;
}

export async function addProjectSetting(projectPath: string): Promise<IProjectSettings> {
  const res = await fetch(`${apiBase}/settings/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: projectPath }),
  });
  const data = await readApiResponse<IApiResponse<IProjectSettings>>(res, `${apiBase}/settings/projects`);
  if (!data.ok || !data.settings) {
    throw new Error(data.error || "Failed to add project setting");
  }

  return data.settings;
}

export async function updateProjectSetting(currentPath: string, nextPath: string): Promise<IProjectSettings> {
  const res = await fetch(`${apiBase}/settings/projects`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPath, nextPath }),
  });
  const data = await readApiResponse<IApiResponse<IProjectSettings>>(res, `${apiBase}/settings/projects`);
  if (!data.ok || !data.settings) {
    throw new Error(data.error || "Failed to update project setting");
  }

  return data.settings;
}

export async function deleteProjectSetting(projectPath: string): Promise<IProjectSettings> {
  const res = await fetch(`${apiBase}/settings/projects`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: projectPath }),
  });
  const data = await readApiResponse<IApiResponse<IProjectSettings>>(res, `${apiBase}/settings/projects`);
  if (!data.ok || !data.settings) {
    throw new Error(data.error || "Failed to remove project setting");
  }

  return data.settings;
}

// ============================================================================
// Issues
// ============================================================================

export async function fetchIssues(params?: IFetchIssuesParams): Promise<ISsue[]> {
  const searchParams = new URLSearchParams();
  if (params?.project) searchParams.set("project", params.project);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.label) searchParams.set("label", params.label);

  const url = `${apiBase}/issues?${searchParams.toString()}`;
  const res = await fetch(url);
  const data = await readApiResponse<IApiResponse<ISsue[]>>(res, url);
  if (!data.ok) throw new Error(data.error || "Failed to fetch issues");
  return data.issues || [];
}

type FetchIssueOptions = { includeRelated?: boolean };

export async function fetchIssue(project: string, issueId: string, options?: FetchIssueOptions): Promise<ISsue> {
  const params = options?.includeRelated ? "?includeRelated=true" : "";
  const res = await fetch(
    `${apiBase}/projects/${encodeURIComponent(project)}/issues/${encodeURIComponent(issueId)}${params}`,
  );
  const data: IApiResponse<ISsue> = await res.json();
  if (!data.ok) throw new Error(data.error || "Failed to fetch issue");
  return data.issue as ISsue;
}

export async function updateIssue(project: string, issueId: string, updates: IssueUpdate): Promise<void> {
  const res = await fetch(`${apiBase}/projects/${encodeURIComponent(project)}/issues/${encodeURIComponent(issueId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  const data: IApiResponse<void> = await res.json();
  if (!data.ok) throw new Error(data.error || "Failed to update issue");
}

export async function createIssue(project: string, issue: ICreateIssueData): Promise<void> {
  const res = await fetch(`${apiBase}/projects/${encodeURIComponent(project)}/issues`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(issue),
  });
  const data: IApiResponse<void> = await res.json();
  if (!data.ok) throw new Error(data.error || "Failed to create issue");
}

export async function deleteIssue(project: string, issueId: string): Promise<void> {
  const res = await fetch(`${apiBase}/projects/${encodeURIComponent(project)}/issues/${encodeURIComponent(issueId)}`, {
    method: "DELETE",
  });
  const data: IApiResponse<void> = await res.json();
  if (!data.ok) throw new Error(data.error || "Failed to delete issue");
}

// ============================================================================
// Ready & Blocked Issues
// ============================================================================

export async function fetchReadyIssues(project?: string): Promise<ISsue[]> {
  const url = project ? `${apiBase}/projects/${encodeURIComponent(project)}/ready` : `${apiBase}/ready`;
  const res = await fetch(url);
  const data: IApiResponse<ISsue[]> = await res.json();
  if (!data.ok) throw new Error(data.error || "Failed to fetch ready issues");
  return data.issues || [];
}

export async function fetchBlockedIssues(project: string): Promise<ISsue[]> {
  const res = await fetch(`${apiBase}/projects/${encodeURIComponent(project)}/blocked`);
  const data: IApiResponse<ISsue[]> = await res.json();
  if (!data.ok) throw new Error(data.error || "Failed to fetch blocked issues");
  return data.issues || [];
}

// ============================================================================
// Dependencies
// ============================================================================

export async function fetchIssueDependencies(project: string, issueId: string): Promise<IDependenciesResponse> {
  const res = await fetch(
    `${apiBase}/projects/${encodeURIComponent(project)}/issues/${encodeURIComponent(issueId)}/dependencies`,
  );
  const data: IApiResponse<void> = await res.json();
  if (!data.ok) throw new Error(data.error || "Failed to fetch dependencies");
  return {
    dependencies: data.dependencies || [],
    blockedBy: data.blockedBy || [],
  };
}

// ============================================================================
// Events & Comments
// ============================================================================

export async function fetchIssueEvents(project: string, issueId: string): Promise<ISsueEvent[]> {
  const res = await fetch(
    `${apiBase}/projects/${encodeURIComponent(project)}/issues/${encodeURIComponent(issueId)}/events`,
  );
  const data: IApiResponse<ISsueEvent[]> = await res.json();
  if (!data.ok) throw new Error(data.error || "Failed to fetch events");
  return data.events || [];
}

export async function fetchIssueComments(project: string, issueId: string): Promise<IComment[]> {
  const res = await fetch(
    `${apiBase}/projects/${encodeURIComponent(project)}/issues/${encodeURIComponent(issueId)}/comments`,
  );
  const data: IApiResponse<IComment[]> = await res.json();
  if (!data.ok) throw new Error(data.error || "Failed to fetch comments");
  return data.comments || [];
}

// ============================================================================
// Labels
// ============================================================================

export async function fetchProjectLabels(project: string): Promise<ILabelCount[]> {
  const res = await fetch(`${apiBase}/projects/${encodeURIComponent(project)}/labels`);
  const data: IApiResponse<ILabelCount[]> = await res.json();
  if (!data.ok) throw new Error(data.error || "Failed to fetch labels");
  return data.labels || [];
}

export async function addIssueLabel(project: string, issueId: string, label: string): Promise<void> {
  const res = await fetch(
    `${apiBase}/projects/${encodeURIComponent(project)}/issues/${encodeURIComponent(issueId)}/labels`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    },
  );
  const data: IApiResponse<void> = await res.json();
  if (!data.ok) throw new Error(data.error || "Failed to add label");
}

export async function removeIssueLabel(project: string, issueId: string, label: string): Promise<void> {
  const res = await fetch(
    `${apiBase}/projects/${encodeURIComponent(project)}/issues/${encodeURIComponent(issueId)}/labels/${encodeURIComponent(label)}`,
    { method: "DELETE" },
  );
  const data: IApiResponse<void> = await res.json();
  if (!data.ok) throw new Error(data.error || "Failed to remove label");
}

// ============================================================================
// Pin
// ============================================================================

export async function toggleIssuePin(project: string, issueId: string): Promise<void> {
  const res = await fetch(
    `${apiBase}/projects/${encodeURIComponent(project)}/issues/${encodeURIComponent(issueId)}/pin`,
    { method: "POST" },
  );
  const data: IApiResponse<void> = await res.json();
  if (!data.ok) throw new Error(data.error || "Failed to toggle pin");
}

// ============================================================================
// Statistics
// ============================================================================

export async function fetchProjectStats(project: string): Promise<IProjectStats> {
  const res = await fetch(`${apiBase}/projects/${encodeURIComponent(project)}/stats`);
  const data: IApiResponse<IProjectStats> = await res.json();
  if (!data.ok) throw new Error(data.error || "Failed to fetch stats");
  return data.stats as IProjectStats;
}

export async function fetchAggregatedStats(): Promise<IAggregatedStats> {
  const res = await fetch(`${apiBase}/stats`);
  const data: IApiResponse<IAggregatedStats> = await res.json();
  if (!data.ok) throw new Error(data.error || "Failed to fetch stats");
  return data.stats as IAggregatedStats;
}

// ============================================================================
// WebSocket connection for real-time updates
// ============================================================================

type WebSocketHandler = (data: unknown) => void;

export function createWebSocket(onMessage: WebSocketHandler): WebSocket {
  const ws = new WebSocket(getWebSocketUrl());

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error);
    }
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  return ws;
}
