import type { IProject, IProjectSettings, ISsue } from "../types";

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60_000).toISOString();
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60_000).toISOString();
}

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60_000).toISOString();
}

const projects: IProject[] = [
  {
    name: "alpha",
    path: "/workspaces/alpha",
    issueCount: 3,
  },
  {
    name: "beta",
    path: "/workspaces/beta",
    issueCount: 1,
  },
  {
    name: "gamma",
    path: "/workspaces/gamma",
    issueCount: 1,
  },
];

const issues: ISsue[] = [
  {
    id: "ALPHA-101",
    project: "alpha",
    title: "Investigate websocket reconnect failure",
    description:
      "Reconnect logic drops pending updates after the tab resumes from sleep.\n\n- reproduce with throttled network\n- verify retry backoff",
    status: "open",
    priority: 1,
    issue_type: "bug",
    assignee: "Alex",
    created_at: daysAgo(6),
    updated_at: minutesAgo(10),
    closed_at: null,
    acceptance_criteria: "- connection retries resume automatically\n- queued events flush after reconnect",
    design: "```ts\nreconnect();\nflushPendingEvents();\n```",
    notes: "Watch for duplicate optimistic updates after the reconnect succeeds.",
    due_at: daysAgo(2),
    defer_until: daysFromNow(3),
    pinned: 1,
    labels: ["frontend", "urgent"],
    blockedBy: [
      {
        issue_id: "ALPHA-101",
        depends_on_id: "BETA-201",
        type: "blocks",
        created_at: daysAgo(2),
        created_by: "alex",
        title: "Ship billing API pagination",
        status: "blocked",
        priority: 0,
      },
    ],
    dependencies: [
      {
        issue_id: "GAMMA-301",
        depends_on_id: "ALPHA-101",
        type: "blocks",
        created_at: daysAgo(1),
        created_by: "alex",
        title: "Write release note draft",
        status: "deferred",
        priority: 4,
      },
    ],
    comments: [
      {
        id: 1,
        issue_id: "ALPHA-101",
        author: "Alex",
        text: "Resumes correctly in Chrome after clearing the service worker cache.",
        created_at: hoursAgo(8),
      },
      {
        id: 2,
        issue_id: "ALPHA-101",
        author: "Riley",
        text: "Need to verify the same flow on Firefox before shipping.",
        created_at: hoursAgo(4),
      },
    ],
    events: [
      {
        id: 1,
        issue_id: "ALPHA-101",
        event_type: "created",
        actor: "alex",
        old_value: null,
        new_value: null,
        comment: null,
        created_at: daysAgo(6),
      },
      {
        id: 2,
        issue_id: "ALPHA-101",
        event_type: "label_added",
        actor: "alex",
        old_value: null,
        new_value: "urgent",
        comment: "Escalated after customer report",
        created_at: daysAgo(1),
      },
      {
        id: 3,
        issue_id: "ALPHA-101",
        event_type: "status_change",
        actor: "alex",
        old_value: "open",
        new_value: "in_progress",
        comment: null,
        created_at: hoursAgo(18),
      },
    ],
    isReady: false,
    blockedByCount: 1,
  },
  {
    id: "ALPHA-102",
    project: "alpha",
    title: "Optimize issue hydration in App bootstrap",
    description: "Reduce duplicate issue fetches during the initial project load.",
    status: "in_progress",
    priority: 2,
    issue_type: "task",
    assignee: "Taylor",
    created_at: daysAgo(3),
    updated_at: hoursAgo(2),
    closed_at: null,
    labels: ["backend"],
    isReady: false,
  },
  {
    id: "ALPHA-103",
    project: "alpha",
    title: "Refresh keyboard shortcut help copy",
    description: "Document the /, j, k, and Enter shortcuts in the onboarding modal.",
    status: "open",
    priority: 3,
    issue_type: "chore",
    assignee: null,
    created_at: daysAgo(2),
    updated_at: hoursAgo(6),
    closed_at: null,
    labels: ["frontend"],
    isReady: true,
  },
  {
    id: "BETA-201",
    project: "beta",
    title: "Ship billing API pagination",
    description: "The dashboard cannot page through large billing exports without this endpoint.",
    status: "blocked",
    priority: 0,
    issue_type: "feature",
    assignee: "Casey",
    created_at: daysAgo(4),
    updated_at: hoursAgo(5),
    closed_at: null,
    labels: ["api"],
    isReady: false,
  },
  {
    id: "BETA-202",
    project: "beta",
    title: "Archive unused billing fixtures",
    description: "Remove obsolete CSV fixtures from the smoke-test project.",
    status: "closed",
    priority: 4,
    issue_type: "chore",
    assignee: "Jordan",
    created_at: daysAgo(12),
    updated_at: daysAgo(1),
    closed_at: daysAgo(1),
    isReady: false,
  },
  {
    id: "GAMMA-301",
    project: "gamma",
    title: "Write release note draft",
    description: "Summarize the websocket reliability work for the next release notes.",
    status: "deferred",
    priority: 4,
    issue_type: "epic",
    assignee: null,
    created_at: daysAgo(7),
    updated_at: daysAgo(2),
    closed_at: null,
    due_at: daysFromNow(5),
    isReady: false,
  },
];

const projectSettings: IProjectSettings = {
  exists: true,
  projects: [
    {
      path: "../alpha-project",
      resolvedPath: "/workspaces/alpha",
      name: "alpha",
      issueCount: 3,
      isValid: true,
      error: null,
    },
    {
      path: "../beta-project",
      resolvedPath: "/workspaces/beta",
      name: "beta",
      issueCount: 1,
      isValid: true,
      error: null,
    },
    {
      path: "../missing-project",
      resolvedPath: "/workspaces/missing-project",
      name: null,
      issueCount: 0,
      isValid: false,
      error: "No Beads project found by bd at the configured path.",
    },
  ],
};

export const dashboardStoryFixtures = {
  projects,
  issues,
  projectSettings,
  detailIssue: issues[0],
  compactIssue: issues[1],
  readyIssue: issues[2],
  blockedIssue: issues[3],
  closedIssue: issues[4],
  deferredIssue: issues[5],
};
