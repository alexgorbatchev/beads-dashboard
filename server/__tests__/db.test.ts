import assert from "node:assert";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "bun:test";

import {
  addIssueLabel,
  createIssue,
  getAllLabels,
  getBlockedIssues,
  getDetailedProjectStats,
  getProjectIssues,
  getProjectStats,
  getReadyIssues,
  resetBeadsCliRunnerForTests,
  scanForProjects,
  setBeadsCliRunnerForTests,
  toggleIssuePinned,
  updateIssueStatus,
  type IProject,
} from "../db";
import type { BeadsCliExecutionResult, BeadsCliRunner } from "../getIssueFromBeadsCli";

interface IRecordedCommand {
  cwd: string;
  args: string[];
}

const tempPaths: string[] = [];

afterEach(() => {
  resetBeadsCliRunnerForTests();

  for (const tempPath of tempPaths.splice(0, tempPaths.length)) {
    rmSync(tempPath, { recursive: true, force: true });
  }
});

function createTempRoot(): string {
  const tempDir = join(process.cwd(), ".tmp");
  mkdirSync(tempDir, { recursive: true });

  const rootPath = mkdtempSync(join(tempDir, "beads-dashboard-cli-"));
  tempPaths.push(rootPath);
  return rootPath;
}

function commandKey(cwd: string, args: string[]): string {
  return `${cwd} :: ${args.join(" ")}`;
}

function createRunner(outputs: Map<string, BeadsCliExecutionResult>, recordedCommands: IRecordedCommand[]): BeadsCliRunner {
  return async (args, cwd) => {
    recordedCommands.push({ cwd, args });
    const output = outputs.get(commandKey(cwd, args));
    assert(output, `Missing fake bd output for ${commandKey(cwd, args)}`);
    return output;
  };
}

function success(stdout: string): BeadsCliExecutionResult {
  return { exitCode: 0, stdout, stderr: "" };
}

function failure(): BeadsCliExecutionResult {
  return { exitCode: 1, stdout: "", stderr: "not a beads project" };
}

describe("bd CLI project source", () => {
  it("discovers projects through bd where without reading storage files", async () => {
    const rootPath = createTempRoot();
    const alphaPath = join(rootPath, "alpha");
    const betaPath = join(rootPath, "beta");
    const missingPath = join(rootPath, "missing");
    mkdirSync(alphaPath, { recursive: true });
    mkdirSync(betaPath, { recursive: true });
    mkdirSync(missingPath, { recursive: true });
    const recordedCommands: IRecordedCommand[] = [];
    const outputs = new Map([
      [commandKey(rootPath, ["where", "--json"]), failure()],
      [commandKey(alphaPath, ["where", "--json"]), success(JSON.stringify({ schema_version: 1, path: `${alphaPath}/.beads` }))],
      [commandKey(betaPath, ["where", "--json"]), success(JSON.stringify({ schema_version: 1, path: `${betaPath}/.beads` }))],
      [commandKey(missingPath, ["where", "--json"]), failure()],
    ]);
    setBeadsCliRunnerForTests(createRunner(outputs, recordedCommands));

    const projects = await scanForProjects(rootPath);

    expect(projects).toEqual([
      { name: "alpha", path: alphaPath },
      { name: "beta", path: betaPath },
    ]);
    expect(recordedCommands).toEqual([
      { cwd: rootPath, args: ["where", "--json"] },
      { cwd: alphaPath, args: ["where", "--json"] },
      { cwd: betaPath, args: ["where", "--json"] },
      { cwd: missingPath, args: ["where", "--json"] },
    ]);
  });

  it("loads lists, stats, labels, and ready or blocked views through bd commands", async () => {
    const projectPath = "/projects/example";
    const project: IProject = { name: "example", path: projectPath };
    const recordedCommands: IRecordedCommand[] = [];
    const listOutput = JSON.stringify([
      {
        id: "bd-2",
        title: "Second",
        description: "Later work",
        status: "in_progress",
        priority: 2,
        issue_type: "feature",
        assignee: null,
        created_at: "2026-04-28T09:00:00Z",
        updated_at: "2026-04-28T10:00:00Z",
        closed_at: null,
        labels: ["Kind/Feature"],
        dependency_count: 2,
      },
      {
        id: "bd-1",
        title: "First",
        description: "Ready work",
        status: "open",
        priority: 1,
        issue_type: "bug",
        assignee: "alex",
        created_at: "2026-04-28T08:00:00Z",
        updated_at: "2026-04-28T11:00:00Z",
        closed_at: null,
        labels: ["Kind/Bug", "Priority/High"],
        dependency_count: 0,
        metadata: { pinned: "true" },
      },
    ]);
    const statusOutput = JSON.stringify({
      schema_version: 1,
      summary: {
        total_issues: 2,
        open_issues: 1,
        in_progress_issues: 1,
        closed_issues: 0,
        blocked_issues: 1,
        deferred_issues: 0,
        ready_issues: 1,
        overdue_issues: 0,
      },
    });
    const outputs = new Map([
      [commandKey(projectPath, ["list", "--json", "--all", "--no-pager", "--limit", "0"]), success(listOutput)],
      [commandKey(projectPath, ["status", "--json"]), success(statusOutput)],
      [commandKey(projectPath, ["ready", "--json", "--limit", "0"]), success(JSON.stringify([JSON.parse(listOutput)[1]]))],
      [commandKey(projectPath, ["blocked", "--json"]), success(JSON.stringify([JSON.parse(listOutput)[0]]))],
    ]);
    setBeadsCliRunnerForTests(createRunner(outputs, recordedCommands));

    const issues = await getProjectIssues(projectPath);
    const projects = await getProjectStats([project]);
    const stats = await getDetailedProjectStats(projectPath);
    const labels = await getAllLabels(projectPath);
    const readyIssues = await getReadyIssues(projectPath);
    const blockedIssues = await getBlockedIssues(projectPath);

    expect(issues.map((issue) => issue.id)).toEqual(["bd-1", "bd-2"]);
    expect(issues.map((issue) => ({ id: issue.id, pinned: issue.pinned }))).toEqual([
      { id: "bd-1", pinned: 1 },
      { id: "bd-2", pinned: undefined },
    ]);
    expect(projects).toEqual([{ name: "example", path: projectPath, issueCount: 2 }]);
    expect(stats).toEqual({
      total: 2,
      open: 1,
      in_progress: 1,
      closed: 0,
      blocked: 1,
      ready: 1,
      overdue: 0,
      byPriority: { 1: 1, 2: 1 },
      byType: { bug: 1, feature: 1 },
    });
    expect(labels).toEqual([
      { label: "Kind/Bug", count: 1 },
      { label: "Kind/Feature", count: 1 },
      { label: "Priority/High", count: 1 },
    ]);
    expect(readyIssues.map((issue) => issue.id)).toEqual(["bd-1"]);
    expect(blockedIssues).toEqual([
      expect.objectContaining({ id: "bd-2", blocked_by_count: 2 }),
    ]);
  });

  it("writes issue changes through bd create and update commands", async () => {
    const projectPath = "/projects/example";
    const recordedCommands: IRecordedCommand[] = [];
    const outputs = new Map([
      [
        commandKey(projectPath, [
          "create",
          "--id",
          "bd-3",
          "--title",
          "New work",
          "--json",
          "--description",
          "Details",
          "--priority",
          "1",
          "--type",
          "task",
          "--assignee",
          "alex",
        ]),
        success(JSON.stringify([{ id: "bd-3" }])),
      ],
      [commandKey(projectPath, ["update", "bd-3", "--status", "in_progress", "--json"]), success(JSON.stringify([{ id: "bd-3" }]))],
      [commandKey(projectPath, ["update", "bd-3", "--add-label", "Kind/Task", "--json"]), failure()],
      [commandKey(projectPath, ["show", "bd-3", "--json", "--long"]), success(JSON.stringify([{ id: "bd-3", title: "New work", metadata: { pinned: "true" } }]))],
      [commandKey(projectPath, ["update", "bd-3", "--set-metadata", "pinned=false", "--json"]), success(JSON.stringify([{ id: "bd-3" }]))],
    ]);
    setBeadsCliRunnerForTests(createRunner(outputs, recordedCommands));

    const created = await createIssue(projectPath, {
      id: "bd-3",
      title: "New work",
      description: "Details",
      priority: 1,
      issue_type: "task",
      assignee: "alex",
    });
    const updated = await updateIssueStatus(projectPath, "bd-3", "in_progress");
    const labelAdded = await addIssueLabel(projectPath, "bd-3", "Kind/Task");
    const pinned = await toggleIssuePinned(projectPath, "bd-3");

    expect(created).toBe(true);
    expect(updated).toBe(true);
    expect(labelAdded).toBe(false);
    expect(pinned).toBe(true);
    expect(recordedCommands).toEqual([
      {
        cwd: projectPath,
        args: [
          "create",
          "--id",
          "bd-3",
          "--title",
          "New work",
          "--json",
          "--description",
          "Details",
          "--priority",
          "1",
          "--type",
          "task",
          "--assignee",
          "alex",
        ],
      },
      { cwd: projectPath, args: ["update", "bd-3", "--status", "in_progress", "--json"] },
      { cwd: projectPath, args: ["update", "bd-3", "--add-label", "Kind/Task", "--json"] },
      { cwd: projectPath, args: ["show", "bd-3", "--json", "--long"] },
      { cwd: projectPath, args: ["update", "bd-3", "--set-metadata", "pinned=false", "--json"] },
    ]);
  });
});
