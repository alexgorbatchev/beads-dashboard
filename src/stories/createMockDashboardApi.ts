import type { IProject, IProjectSettings, ISsue } from "../types";
import { dashboardStoryFixtures } from "./dashboardStoryFixtures";

interface ICreateMockDashboardApiOptions {
  projects?: IProject[];
  issues?: ISsue[];
  settings?: IProjectSettings;
}

interface IProjectStatsSummary {
  total: number;
  open: number;
  ready: number;
}

interface IMockDashboardApi {
  install: () => () => void;
  getIssues: () => ISsue[];
  getProjectSettings: () => IProjectSettings;
}

type MockFetchInput = RequestInfo | URL;

function createJsonResponse(body: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

function countOpenIssues(issues: ISsue[], projectName: string): number {
  return issues.filter((issue) => issue.project === projectName && issue.status !== "closed").length;
}

function computeStats(issues: ISsue[]) {
  const open = issues.filter((issue) => issue.status === "open").length;
  const inProgress = issues.filter((issue) => issue.status === "in_progress").length;
  const closed = issues.filter((issue) => issue.status === "closed").length;
  const blocked = issues.filter((issue) => issue.status === "blocked").length;
  const overdue = issues.filter((issue) => issue.due_at && issue.status !== "closed" && new Date(issue.due_at) < new Date()).length;
  const ready = issues.filter((issue) => issue.isReady).length;
  const byProject = issues.reduce<Record<string, IProjectStatsSummary>>((projectStats, issue) => {
    const projectName = issue.project ?? "unknown";
    const currentProjectStats = projectStats[projectName] ?? { total: 0, open: 0, ready: 0 };
    currentProjectStats.total += 1;
    if (issue.status !== "closed") {
      currentProjectStats.open += 1;
    }
    if (issue.isReady) {
      currentProjectStats.ready += 1;
    }
    projectStats[projectName] = currentProjectStats;
    return projectStats;
  }, {});

  return {
    total: issues.length,
    open,
    in_progress: inProgress,
    closed,
    blocked,
    ready,
    overdue,
    byProject,
  };
}

function buildProjects(projectCatalog: IProject[], issues: ISsue[]): IProject[] {
  return projectCatalog.map((project) => ({
    ...project,
    issueCount: countOpenIssues(issues, project.name),
  }));
}

function buildProjectSettings(settings: IProjectSettings, issues: ISsue[]): IProjectSettings {
  return {
    ...settings,
    projects: settings.projects.map((projectSetting) => ({
      ...projectSetting,
      issueCount: projectSetting.name ? countOpenIssues(issues, projectSetting.name) : projectSetting.issueCount ?? 0,
    })),
  };
}

function getPathname(input: MockFetchInput): string {
  if (typeof input === "string") {
    return new URL(input, window.location.origin).pathname;
  }

  if (input instanceof URL) {
    return input.pathname;
  }

  return new URL(input.url, window.location.origin).pathname;
}

function getUrl(input: MockFetchInput): URL {
  if (typeof input === "string") {
    return new URL(input, window.location.origin);
  }

  if (input instanceof URL) {
    return new URL(input.toString(), window.location.origin);
  }

  return new URL(input.url, window.location.origin);
}

function getMethod(input: MockFetchInput, init?: RequestInit): string {
  if (init?.method) {
    return init.method.toUpperCase();
  }

  if (typeof input === "string" || input instanceof URL) {
    return "GET";
  }

  return input.method.toUpperCase();
}

function parseBody(init?: RequestInit): Record<string, unknown> {
  if (typeof init?.body !== "string") {
    return {};
  }

  const parsedValue: unknown = JSON.parse(init.body);
  if (typeof parsedValue !== "object" || parsedValue === null || parsedValue instanceof Array) {
    return {};
  }

  return Object.fromEntries(Object.entries(parsedValue));
}

function isIssueStatus(value: unknown): value is ISsue["status"] {
  return value === "open" || value === "in_progress" || value === "closed" || value === "blocked" || value === "deferred";
}

function decodePathSegment(value: string): string {
  return decodeURIComponent(value);
}

export function createMockDashboardApi(options: ICreateMockDashboardApiOptions = {}): IMockDashboardApi {
  let issues = structuredClone(options.issues ?? dashboardStoryFixtures.issues);
  const projectCatalog = structuredClone(options.projects ?? dashboardStoryFixtures.projects);
  let settings = structuredClone(options.settings ?? dashboardStoryFixtures.projectSettings);

  async function handleRequest(input: MockFetchInput, init?: RequestInit): Promise<Response> {
    const url = getUrl(input);
    const method = getMethod(input, init);
    const pathname = url.pathname;

    if (pathname === "/api/projects" && method === "GET") {
      return createJsonResponse({ ok: true, projects: buildProjects(projectCatalog, issues) });
    }

    if (pathname === "/api/issues" && method === "GET") {
      const project = url.searchParams.get("project");
      const filteredIssues = project && project !== "__ALL__"
        ? issues.filter((issue) => issue.project === project)
        : issues;
      return createJsonResponse({ ok: true, issues: filteredIssues });
    }

    if (pathname === "/api/stats" && method === "GET") {
      return createJsonResponse({ ok: true, stats: computeStats(issues) });
    }

    if (pathname === "/api/settings/projects" && method === "GET") {
      return createJsonResponse({ ok: true, settings: buildProjectSettings(settings, issues) });
    }

    if (pathname === "/api/settings/projects" && method === "POST") {
      const body = parseBody(init);
      const nextPath = typeof body.path === "string" ? body.path : "../new-project";
      const nextName = nextPath.replace(/^\.\.\//, "").replace(/-project$/, "");
      settings = {
        ...settings,
        exists: true,
        projects: [
          ...settings.projects,
          {
            path: nextPath,
            resolvedPath: `/workspaces/${nextName}`,
            name: nextName,
            issueCount: countOpenIssues(issues, nextName),
            isValid: true,
            error: null,
          },
        ],
      };
      return createJsonResponse({ ok: true, settings: buildProjectSettings(settings, issues) });
    }

    if (pathname === "/api/settings/projects" && method === "PATCH") {
      const body = parseBody(init);
      const currentPath = typeof body.currentPath === "string" ? body.currentPath : "";
      const nextPath = typeof body.nextPath === "string" ? body.nextPath : currentPath;
      settings = {
        ...settings,
        projects: settings.projects.map((projectSetting) =>
          projectSetting.path === currentPath
            ? {
                ...projectSetting,
                path: nextPath,
                resolvedPath: `/workspaces/${nextPath.replace(/^\.\.\//, "").replace(/-project$/, "")}`,
              }
            : projectSetting,
        ),
      };
      return createJsonResponse({ ok: true, settings: buildProjectSettings(settings, issues) });
    }

    if (pathname === "/api/settings/projects" && method === "DELETE") {
      const body = parseBody(init);
      const path = typeof body.path === "string" ? body.path : "";
      settings = {
        ...settings,
        projects: settings.projects.filter((projectSetting) => projectSetting.path !== path),
      };
      return createJsonResponse({ ok: true, settings: buildProjectSettings(settings, issues) });
    }

    const createIssueMatch = pathname.match(/^\/api\/projects\/([^/]+)\/issues$/);
    if (createIssueMatch && method === "POST") {
      const projectName = decodePathSegment(createIssueMatch[1]);
      const body = parseBody(init);
      const now = new Date().toISOString();
      const id = typeof body.id === "string" ? body.id : `ISSUE-${issues.length + 1}`;
      const title = typeof body.title === "string" ? body.title : "Untitled issue";
      const description = typeof body.description === "string" ? body.description : "";
      const priority = typeof body.priority === "number" ? body.priority : 2;
      const issueType = typeof body.issue_type === "string" ? body.issue_type : "task";
      const assignee = typeof body.assignee === "string" ? body.assignee : null;
      const nextIssue: ISsue = {
        id,
        project: projectName,
        title,
        description,
        status: "open",
        priority,
        issue_type: issueType,
        assignee,
        created_at: now,
        updated_at: now,
        closed_at: null,
        labels: [],
        isReady: false,
      };
      issues = [...issues, nextIssue];
      return createJsonResponse({ ok: true });
    }

    const issueMatch = pathname.match(/^\/api\/projects\/([^/]+)\/issues\/([^/]+)$/);
    if (issueMatch && method === "GET") {
      const projectName = decodePathSegment(issueMatch[1]);
      const issueId = decodePathSegment(issueMatch[2]);
      const issue = issues.find((candidate) => candidate.project === projectName && candidate.id === issueId);
      return issue
        ? createJsonResponse({ ok: true, issue })
        : createJsonResponse({ ok: false, error: "Issue not found" }, 404);
    }

    if (issueMatch && method === "PATCH") {
      const projectName = decodePathSegment(issueMatch[1]);
      const issueId = decodePathSegment(issueMatch[2]);
      const updates = parseBody(init);
      issues = issues.map((issue) => {
        if (issue.project !== projectName || issue.id !== issueId) {
          return issue;
        }

        const nextStatus = isIssueStatus(updates.status) ? updates.status : issue.status;
        const nextPriority = typeof updates.priority === "number" ? updates.priority : issue.priority;
        const nextTitle = typeof updates.title === "string" ? updates.title : issue.title;
        const nextDescription = typeof updates.description === "string" ? updates.description : issue.description;
        const nextNotes = typeof updates.notes === "string" ? updates.notes : issue.notes;
        const nextDueAt =
          typeof updates.due_at === "string" || updates.due_at === null ? updates.due_at : issue.due_at;

        return {
          ...issue,
          status: nextStatus,
          priority: nextPriority,
          title: nextTitle,
          description: nextDescription,
          notes: nextNotes,
          due_at: nextDueAt,
          closed_at: nextStatus === "closed" ? new Date().toISOString() : issue.closed_at,
          updated_at: new Date().toISOString(),
        };
      });
      return createJsonResponse({ ok: true });
    }

    if (issueMatch && method === "DELETE") {
      const projectName = decodePathSegment(issueMatch[1]);
      const issueId = decodePathSegment(issueMatch[2]);
      issues = issues.filter((issue) => issue.project !== projectName || issue.id !== issueId);
      return createJsonResponse({ ok: true });
    }

    const labelMatch = pathname.match(/^\/api\/projects\/([^/]+)\/issues\/([^/]+)\/labels$/);
    if (labelMatch && method === "POST") {
      const projectName = decodePathSegment(labelMatch[1]);
      const issueId = decodePathSegment(labelMatch[2]);
      const body = parseBody(init);
      const nextLabel = typeof body.label === "string" ? body.label : "new-label";
      issues = issues.map((issue) => {
        if (issue.project !== projectName || issue.id !== issueId) {
          return issue;
        }

        const nextLabels = issue.labels?.includes(nextLabel) ? issue.labels : [...(issue.labels ?? []), nextLabel];
        return {
          ...issue,
          labels: nextLabels,
          updated_at: new Date().toISOString(),
        };
      });
      return createJsonResponse({ ok: true });
    }

    const removeLabelMatch = pathname.match(/^\/api\/projects\/([^/]+)\/issues\/([^/]+)\/labels\/([^/]+)$/);
    if (removeLabelMatch && method === "DELETE") {
      const projectName = decodePathSegment(removeLabelMatch[1]);
      const issueId = decodePathSegment(removeLabelMatch[2]);
      const label = decodePathSegment(removeLabelMatch[3]);
      issues = issues.map((issue) => {
        if (issue.project !== projectName || issue.id !== issueId) {
          return issue;
        }

        return {
          ...issue,
          labels: (issue.labels ?? []).filter((candidate) => candidate !== label),
          updated_at: new Date().toISOString(),
        };
      });
      return createJsonResponse({ ok: true });
    }

    const pinMatch = pathname.match(/^\/api\/projects\/([^/]+)\/issues\/([^/]+)\/pin$/);
    if (pinMatch && method === "POST") {
      const projectName = decodePathSegment(pinMatch[1]);
      const issueId = decodePathSegment(pinMatch[2]);
      issues = issues.map((issue) => {
        if (issue.project !== projectName || issue.id !== issueId) {
          return issue;
        }

        return {
          ...issue,
          pinned: issue.pinned ? 0 : 1,
          updated_at: new Date().toISOString(),
        };
      });
      return createJsonResponse({ ok: true });
    }

    if (pathname.startsWith("/api/")) {
      return createJsonResponse({ ok: false, error: `Unhandled mock API route: ${method} ${pathname}` }, 500);
    }

    return window.fetch(input, init);
  }

  return {
    install() {
      const originalFetch = window.fetch.bind(window);
      window.fetch = async (input: MockFetchInput, init?: RequestInit): Promise<Response> => {
        const pathname = getPathname(input);
        if (!pathname.startsWith("/api/")) {
          return originalFetch(input, init);
        }

        return handleRequest(input, init);
      };

      return () => {
        window.fetch = originalFetch;
      };
    },
    getIssues() {
      return structuredClone(issues);
    },
    getProjectSettings() {
      return structuredClone(buildProjectSettings(settings, issues));
    },
  };
}
