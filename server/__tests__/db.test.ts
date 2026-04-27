import assert from "node:assert";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "bun:test";

import {
  closeAllDbs,
  getAllLabels,
  getBlockedIssues,
  getDetailedProjectStats,
  getIssue,
  getProjectIssues,
  getProjectStats,
  getReadyIssues,
  getIssueEvents,
  scanForProjects,
  supportsProjectWrites,
} from "../db";

const tempPaths: string[] = [];

afterEach(() => {
  closeAllDbs();

  for (const tempPath of tempPaths.splice(0, tempPaths.length)) {
    rmSync(tempPath, { recursive: true, force: true });
  }
});

function createJsonlProject(): string {
  const rootPath = mkdtempSync(join(tmpdir(), "beads-dashboard-jsonl-"));
  tempPaths.push(rootPath);

  const projectPath = join(rootPath, "jsonl-project");
  const beadsPath = join(projectPath, ".beads");
  mkdirSync(beadsPath, { recursive: true });

  writeFileSync(
    join(beadsPath, "metadata.json"),
    JSON.stringify({ database: "dolt", backend: "dolt", project_id: "proj-123" }, null, 2),
  );

  writeFileSync(
    join(beadsPath, "issues.jsonl"),
    [
      JSON.stringify({
        id: "jsonl-project-1",
        title: "Ready issue",
        description: "First issue",
        status: "open",
        priority: 1,
        issue_type: "bug",
        assignee: "alex",
        created_at: "2026-04-25T17:08:38Z",
        updated_at: "2026-04-25T17:08:38Z",
        closed_at: null,
        notes: "Imported from tracker",
        external_ref: "gitea-1",
        metadata: { gitea_labels: ["Kind/Bug", "Priority/High"] },
        dependency_count: 0,
        dependent_count: 1,
        comment_count: 0,
      }),
      JSON.stringify({
        id: "jsonl-project-2",
        title: "Blocked issue",
        description: "Second issue",
        status: "in_progress",
        priority: 2,
        issue_type: "feature",
        assignee: null,
        created_at: "2026-04-25T17:09:38Z",
        updated_at: "2026-04-25T17:10:38Z",
        closed_at: null,
        metadata: { gitea_labels: ["Kind/Enhancement"] },
        dependency_count: 2,
        dependent_count: 0,
        comment_count: 0,
      }),
      JSON.stringify({
        id: "jsonl-project-3",
        title: "Closed issue",
        description: "Third issue",
        status: "closed",
        priority: 3,
        issue_type: "task",
        assignee: null,
        created_at: "2026-04-24T17:09:38Z",
        updated_at: "2026-04-24T17:10:38Z",
        closed_at: "2026-04-24T18:10:38Z",
        metadata: { gitea_labels: ["Priority/Low"] },
        dependency_count: 0,
        dependent_count: 0,
        comment_count: 0,
      }),
    ].join("\n") + "\n",
  );

  writeFileSync(
    join(beadsPath, "interactions.jsonl"),
    [
      JSON.stringify({
        id: "int-1",
        kind: "field_change",
        created_at: "2026-04-25T17:11:38Z",
        actor: "Alex Gorbatchev",
        issue_id: "jsonl-project-2",
        extra: { field: "status", old_value: "open", new_value: "in_progress" },
      }),
    ].join("\n") + "\n",
  );

  return rootPath;
}

describe("db JSONL support", () => {
  it("discovers JSONL-backed beads projects and exposes read-only issue data", () => {
    const rootPath = createJsonlProject();

    const projects = scanForProjects(rootPath);
    expect(projects).toHaveLength(1);
    expect(projects[0]).toMatchObject({
      name: "jsonl-project",
      path: join(rootPath, "jsonl-project"),
    });

    const project = projects[0];
    const issues = getProjectIssues(project.database, { includeLabels: true });
    expect(issues.map((issue) => issue.id)).toEqual(["jsonl-project-2", "jsonl-project-1", "jsonl-project-3"]);
    expect(issues[1].labels).toEqual(["Kind/Bug", "Priority/High"]);

    const issue = getIssue(project.database, "jsonl-project-2", { includeRelated: true });
    assert(issue);
    expect(issue.labels).toEqual(["Kind/Enhancement"]);
    expect(issue.events).toEqual([
      {
        id: 1,
        issue_id: "jsonl-project-2",
        event_type: "field_change",
        actor: "Alex Gorbatchev",
        old_value: "open",
        new_value: "in_progress",
        comment: "status",
        created_at: "2026-04-25T17:11:38Z",
      },
    ]);
    expect(issue.comments).toEqual([]);
    expect(issue.dependencies).toEqual([]);
    expect(issue.blockedBy).toEqual([]);

    expect(getAllLabels(project.database)).toEqual([
      { label: "Kind/Bug", count: 1 },
      { label: "Kind/Enhancement", count: 1 },
      { label: "Priority/High", count: 1 },
      { label: "Priority/Low", count: 1 },
    ]);

    expect(getReadyIssues(project.database).map((readyIssue) => readyIssue.id)).toEqual(["jsonl-project-1"]);
    expect(getBlockedIssues(project.database)).toEqual([
      expect.objectContaining({ id: "jsonl-project-2", blocked_by_count: 2 }),
    ]);

    expect(getDetailedProjectStats(project.database)).toEqual({
      total: 3,
      open: 1,
      in_progress: 1,
      closed: 1,
      blocked: 1,
      ready: 1,
      overdue: 0,
      byPriority: { 1: 1, 2: 1 },
      byType: { bug: 1, feature: 1 },
    });

    expect(getProjectStats(projects)[0].issueCount).toBe(2);
    expect(getIssueEvents(project.database, "jsonl-project-2")).toEqual([
      {
        id: 1,
        issue_id: "jsonl-project-2",
        event_type: "field_change",
        actor: "Alex Gorbatchev",
        old_value: "open",
        new_value: "in_progress",
        comment: "status",
        created_at: "2026-04-25T17:11:38Z",
      },
    ]);
    expect(supportsProjectWrites(project.database)).toBe(false);
  });
});
