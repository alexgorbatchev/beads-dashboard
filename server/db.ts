import fs from "node:fs";
import path from "node:path";

import { getIssueFromBeadsCli, runBeadsCli, type BeadsCliRunner } from "./getIssueFromBeadsCli";

export interface ICreateIssueData {
  id: string;
  title: string;
  description?: string;
  priority?: number;
  issue_type?: string;
  assignee?: string;
}

export interface IProjectIssuesOptions {
  status?: string;
  limit?: number;
  offset?: number;
  includeLabels?: boolean;
}

export interface IAllIssuesOptions {
  status?: string;
  limit?: number;
}

interface IBlockedIssue extends IIssue {
  blocked_by_count: number;
}

interface IJsonObjectMap {
  [key: string]: unknown;
}

interface IStatusSummary {
  total_issues?: number;
  open_issues?: number;
  in_progress_issues?: number;
  closed_issues?: number;
  blocked_issues?: number;
  deferred_issues?: number;
  ready_issues?: number;
  overdue_issues?: number;
}

interface IStatusResponse {
  summary: IStatusSummary;
}

export interface IProjectStatsSummary {
  total: number;
  open: number;
  ready: number;
}

export interface ILabelCount {
  label: string;
  count: number;
}

type BeadsCliArgs = string[];
type IssueFieldValue = string | number | null;

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", ".nuxt", "coverage", "__pycache__", ".venv", "venv"]);

let beadsCliRunner: BeadsCliRunner = runBeadsCli;

export interface IProject {
  name: string;
  path: string;
  issueCount?: number;
}

export interface IIssue {
  id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "closed" | "blocked" | "deferred";
  priority: number;
  issue_type: string;
  assignee: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  deleted_at?: string | null;
  project?: string;
  design?: string;
  acceptance_criteria?: string;
  notes?: string;
  estimated_minutes?: number | null;
  due_at?: string | null;
  defer_until?: string | null;
  close_reason?: string;
  pinned?: number;
  external_ref?: string | null;
  labels?: string[];
  dependencies?: IDependency[];
  blockedBy?: IDependency[];
  events?: IIssueEvent[];
  comments?: IComment[];
  isReady?: boolean;
  blockedByCount?: number;
}

export interface IDependency {
  issue_id: string;
  depends_on_id: string;
  type: "blocks" | "related" | "parent-child" | "discovered-from";
  created_at: string;
  created_by: string;
  title?: string;
  status?: string;
  priority?: number;
}

export interface IIssueEvent {
  id: number;
  issue_id: string;
  event_type: string;
  actor: string;
  old_value: string | null;
  new_value: string | null;
  comment: string | null;
  created_at: string;
}

export type CommentId = number | string;

export interface IComment {
  id: CommentId;
  issue_id: string;
  author: string;
  text: string;
  created_at: string;
}

export interface IProjectStats {
  total: number;
  open: number;
  in_progress: number;
  closed: number;
  blocked: number;
  ready: number;
  overdue: number;
  byPriority: Record<number, number>;
  byType: Record<string, number>;
}

function isJsonObject(value: unknown): value is IJsonObjectMap {
  return typeof value === "object" && value !== null;
}

function getProperty(value: IJsonObjectMap, propertyName: string): unknown {
  return Object.getOwnPropertyDescriptor(value, propertyName)?.value;
}

function unwrapBdJsonEnvelope(value: unknown): unknown {
  if (!isJsonObject(value)) {
    return value;
  }

  const data = getProperty(value, "data");
  if (data !== undefined) {
    return data;
  }

  return value;
}

function parseJsonPayload(stdout: string, commandName: string): unknown {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse ${commandName} JSON: ${message}`);
  }

  const payload = unwrapBdJsonEnvelope(parsed);
  if (isJsonObject(payload)) {
    const cliError = getStringProperty(payload, "error");
    if (cliError) {
      throw new Error(`${commandName} failed: ${cliError}`);
    }
  }

  return payload;
}

function getStringProperty(value: IJsonObjectMap, propertyName: string): string | undefined {
  const propertyValue = getProperty(value, propertyName);
  if (typeof propertyValue === "string") {
    return propertyValue;
  }

  return undefined;
}

function getNullableStringProperty(value: IJsonObjectMap, propertyName: string): string | null | undefined {
  const propertyValue = getProperty(value, propertyName);
  if (typeof propertyValue === "string" || propertyValue === null) {
    return propertyValue;
  }

  return undefined;
}

function getNumberProperty(value: IJsonObjectMap, propertyName: string): number | undefined {
  const propertyValue = getProperty(value, propertyName);
  if (typeof propertyValue === "number") {
    return propertyValue;
  }

  return undefined;
}

function getBooleanProperty(value: IJsonObjectMap, propertyName: string): boolean | undefined {
  const propertyValue = getProperty(value, propertyName);
  if (typeof propertyValue === "boolean") {
    return propertyValue;
  }

  return undefined;
}

function getBooleanLikeProperty(value: IJsonObjectMap, propertyName: string): boolean | undefined {
  const propertyValue = getProperty(value, propertyName);
  if (typeof propertyValue === "boolean") {
    return propertyValue;
  }
  if (propertyValue === "true") {
    return true;
  }
  if (propertyValue === "false") {
    return false;
  }

  return undefined;
}

function getObjectProperty(value: IJsonObjectMap, propertyName: string): IJsonObjectMap | undefined {
  const propertyValue = getProperty(value, propertyName);
  if (isJsonObject(propertyValue)) {
    return propertyValue;
  }

  return undefined;
}

function getArrayProperty(value: IJsonObjectMap, propertyName: string): unknown[] {
  const propertyValue = getProperty(value, propertyName);
  if (Array.isArray(propertyValue)) {
    return propertyValue;
  }

  return [];
}

function normalizeIssueStatus(status: string | undefined): IIssue["status"] {
  if (status === "open" || status === "in_progress" || status === "closed" || status === "blocked" || status === "deferred") {
    return status;
  }

  return "open";
}

function normalizeIssue(value: unknown): IIssue[] {
  if (!isJsonObject(value)) {
    return [];
  }

  const id = getStringProperty(value, "id");
  if (!id) {
    return [];
  }

  const createdAt = getStringProperty(value, "created_at") || "";
  const issue: IIssue = {
    id,
    title: getStringProperty(value, "title") || id,
    description: getStringProperty(value, "description") || "",
    status: normalizeIssueStatus(getStringProperty(value, "status")),
    priority: getNumberProperty(value, "priority") ?? 2,
    issue_type: getStringProperty(value, "issue_type") || "task",
    assignee: getNullableStringProperty(value, "assignee") ?? null,
    created_at: createdAt,
    updated_at: getStringProperty(value, "updated_at") || createdAt,
    closed_at: getNullableStringProperty(value, "closed_at") ?? null,
  };

  const labels = getArrayProperty(value, "labels").filter((label) => typeof label === "string");
  if (labels.length > 0) {
    issue.labels = labels;
  }

  const dependencyCount = getNumberProperty(value, "dependency_count");
  if (dependencyCount !== undefined) {
    issue.blockedByCount = dependencyCount;
    issue.isReady = issue.status === "open" && dependencyCount === 0;
  }

  const pinnedNumber = getNumberProperty(value, "pinned");
  if (pinnedNumber !== undefined) {
    issue.pinned = pinnedNumber;
  }

  const pinnedBoolean = getBooleanProperty(value, "pinned");
  if (pinnedBoolean !== undefined) {
    issue.pinned = pinnedBoolean ? 1 : 0;
  }

  const metadata = getObjectProperty(value, "metadata");
  const isPinnedInMetadata = metadata ? getBooleanLikeProperty(metadata, "pinned") : undefined;
  if (isPinnedInMetadata !== undefined) {
    issue.pinned = isPinnedInMetadata ? 1 : 0;
  }

  return [issue];
}

function countLabels(issues: IIssue[]): ILabelCount[] {
  const countsByLabel = new Map<string, number>();
  for (const issue of issues) {
    for (const label of issue.labels ?? []) {
      countsByLabel.set(label, (countsByLabel.get(label) ?? 0) + 1);
    }
  }

  return Array.from(countsByLabel.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

async function runCli(args: BeadsCliArgs, projectPath: string, commandName: string): Promise<string> {
  const result = await beadsCliRunner(args, projectPath);
  if (result.exitCode !== 0) {
    throw new Error(`${commandName} failed in ${projectPath}: ${result.stderr || `exit ${result.exitCode}`}`);
  }

  return result.stdout;
}

function sortIssues(issues: IIssue[]): IIssue[] {
  return [...issues].sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }

    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
}

function applyPagination(issues: IIssue[], options: IProjectIssuesOptions): IIssue[] {
  const offset = options.offset ?? 0;
  const end = options.limit === undefined ? undefined : offset + options.limit;
  return issues.slice(offset, end);
}

function mapStatusResponse(payload: unknown): IStatusResponse {
  if (!isJsonObject(payload)) {
    return { summary: {} };
  }

  const summary = getProperty(payload, "summary");
  if (!isJsonObject(summary)) {
    return { summary: {} };
  }

  return {
    summary: {
      total_issues: getNumberProperty(summary, "total_issues"),
      open_issues: getNumberProperty(summary, "open_issues"),
      in_progress_issues: getNumberProperty(summary, "in_progress_issues"),
      closed_issues: getNumberProperty(summary, "closed_issues"),
      blocked_issues: getNumberProperty(summary, "blocked_issues"),
      deferred_issues: getNumberProperty(summary, "deferred_issues"),
      ready_issues: getNumberProperty(summary, "ready_issues"),
      overdue_issues: getNumberProperty(summary, "overdue_issues"),
    },
  };
}

async function getStatusSummary(projectPath: string): Promise<IStatusSummary> {
  const stdout = await runCli(["status", "--json"], projectPath, "bd status");
  return mapStatusResponse(parseJsonPayload(stdout, "bd status")).summary;
}

function summarizeIssues(issues: IIssue[], summary: IStatusSummary): IProjectStats {
  const byPriority: Record<number, number> = {};
  const byType: Record<string, number> = {};
  for (const issue of issues) {
    if (issue.status === "closed") {
      continue;
    }

    byPriority[issue.priority] = (byPriority[issue.priority] ?? 0) + 1;
    byType[issue.issue_type] = (byType[issue.issue_type] ?? 0) + 1;
  }

  return {
    total: summary.total_issues ?? issues.length,
    open: summary.open_issues ?? issues.filter((issue) => issue.status === "open").length,
    in_progress: summary.in_progress_issues ?? issues.filter((issue) => issue.status === "in_progress").length,
    closed: summary.closed_issues ?? issues.filter((issue) => issue.status === "closed").length,
    blocked: summary.blocked_issues ?? issues.filter((issue) => issue.status === "blocked").length,
    ready: summary.ready_issues ?? issues.filter((issue) => issue.isReady === true).length,
    overdue: summary.overdue_issues ?? 0,
    byPriority,
    byType,
  };
}

export function setBeadsCliRunnerForTests(runner: BeadsCliRunner): void {
  beadsCliRunner = runner;
}

export function resetBeadsCliRunnerForTests(): void {
  beadsCliRunner = runBeadsCli;
}

export async function scanProjectDirectory(projectPath: string): Promise<IProject | null> {
  const resolvedPath = path.resolve(projectPath);
  const result = await beadsCliRunner(["where", "--json"], resolvedPath);
  if (result.exitCode !== 0) {
    return null;
  }

  parseJsonPayload(result.stdout, "bd where");
  return {
    name: path.basename(resolvedPath),
    path: resolvedPath,
  };
}

export async function scanForProjects(rootDir: string): Promise<IProject[]> {
  const projectsByPath = new Map<string, IProject>();

  async function scanDirectory(directoryPath: string): Promise<void> {
    const project = await scanProjectDirectory(directoryPath);
    if (project) {
      projectsByPath.set(project.path, project);
      return;
    }

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(directoryPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || SKIP_DIRS.has(entry.name)) {
        continue;
      }

      await scanDirectory(path.join(directoryPath, entry.name));
    }
  }

  await scanDirectory(path.resolve(rootDir));
  return Array.from(projectsByPath.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getProjectIssues(projectPath: string, options: IProjectIssuesOptions = {}): Promise<IIssue[]> {
  if (options.status === "ready") {
    return applyPagination(await getReadyIssues(projectPath), options);
  }
  if (options.status === "blocked") {
    return applyPagination(await getBlockedIssues(projectPath), options);
  }

  const args = ["list", "--json", "--all", "--no-pager", "--limit", "0"];
  if (options.status && options.status !== "all") {
    args.push("--status", options.status);
  }

  const stdout = await runCli(args, projectPath, "bd list");
  const payload = parseJsonPayload(stdout, "bd list");
  if (!Array.isArray(payload)) {
    throw new Error("bd list JSON was not an array");
  }

  return applyPagination(sortIssues(payload.flatMap(normalizeIssue)), options);
}

export async function getAllIssues(projects: IProject[], options: IAllIssuesOptions = {}): Promise<IIssue[]> {
  const issuesByProject = await Promise.all(
    projects.map(async (project) => {
      const projectIssues = await getProjectIssues(project.path, { status: options.status });
      return projectIssues.map((issue) => ({ ...issue, project: project.name }));
    }),
  );
  return sortIssues(issuesByProject.flat()).slice(0, options.limit);
}

export async function getIssue(projectPath: string, issueId: string): Promise<IIssue | null> {
  return getIssueFromBeadsCli(projectPath, issueId, { includeRelated: true, runner: beadsCliRunner });
}

export async function getProjectStats(projects: IProject[]): Promise<IProject[]> {
  return Promise.all(
    projects.map(async (project) => {
      const summary = await getStatusSummary(project.path);
      const closed = summary.closed_issues ?? 0;
      const total = summary.total_issues ?? 0;
      return { ...project, issueCount: Math.max(total - closed, 0) };
    }),
  );
}

export async function getDetailedProjectStats(projectPath: string): Promise<IProjectStats> {
  const [summary, issues] = await Promise.all([getStatusSummary(projectPath), getProjectIssues(projectPath)]);
  return summarizeIssues(issues, summary);
}

export async function createIssue(projectPath: string, data: ICreateIssueData): Promise<boolean> {
  const args = ["create", "--id", data.id, "--title", data.title, "--json"];
  if (data.description !== undefined) {
    args.push("--description", data.description);
  }
  if (data.priority !== undefined) {
    args.push("--priority", String(data.priority));
  }
  if (data.issue_type !== undefined) {
    args.push("--type", data.issue_type);
  }
  if (data.assignee !== undefined) {
    args.push("--assignee", data.assignee);
  }

  const result = await beadsCliRunner(args, projectPath);
  return result.exitCode === 0;
}

async function updateIssueField(projectPath: string, issueId: string, flagName: string, value: IssueFieldValue): Promise<boolean> {
  const result = await beadsCliRunner(["update", issueId, flagName, value === null ? "" : String(value), "--json"], projectPath);
  return result.exitCode === 0;
}

export async function updateIssueStatus(projectPath: string, issueId: string, status: string): Promise<boolean> {
  return updateIssueField(projectPath, issueId, "--status", status);
}

export async function updateIssuePriority(projectPath: string, issueId: string, priority: number): Promise<boolean> {
  return updateIssueField(projectPath, issueId, "--priority", priority);
}

export async function updateIssueTitle(projectPath: string, issueId: string, title: string): Promise<boolean> {
  return updateIssueField(projectPath, issueId, "--title", title);
}

export async function updateIssueDescription(projectPath: string, issueId: string, description: string): Promise<boolean> {
  return updateIssueField(projectPath, issueId, "--description", description);
}

export async function updateIssueNotes(projectPath: string, issueId: string, notes: string): Promise<boolean> {
  return updateIssueField(projectPath, issueId, "--notes", notes);
}

export async function updateIssueDueDate(projectPath: string, issueId: string, dueAt: string | null): Promise<boolean> {
  return updateIssueField(projectPath, issueId, "--due", dueAt);
}

export async function deleteIssue(projectPath: string, issueId: string): Promise<boolean> {
  const result = await beadsCliRunner(["delete", issueId, "--force", "--json"], projectPath);
  return result.exitCode === 0;
}

export function closeAllDbs(): void {}

export async function getIssueDependencies(projectPath: string, issueId: string): Promise<IDependency[]> {
  const issue = await getIssueFromBeadsCli(projectPath, issueId, { includeRelated: true, runner: beadsCliRunner });
  return issue?.dependencies ?? [];
}

export async function getIssueBlockedBy(projectPath: string, issueId: string): Promise<IDependency[]> {
  const issue = await getIssueFromBeadsCli(projectPath, issueId, { includeRelated: true, runner: beadsCliRunner });
  return issue?.blockedBy ?? [];
}

export async function getIssueEvents(projectPath: string, issueId: string): Promise<IIssueEvent[]> {
  const issue = await getIssueFromBeadsCli(projectPath, issueId, { includeRelated: true, runner: beadsCliRunner });
  return issue?.events ?? [];
}

export async function getIssueComments(projectPath: string, issueId: string): Promise<IComment[]> {
  const issue = await getIssueFromBeadsCli(projectPath, issueId, { includeRelated: true, runner: beadsCliRunner });
  return issue?.comments ?? [];
}

export async function getAllLabels(projectPath: string): Promise<ILabelCount[]> {
  return countLabels(await getProjectIssues(projectPath));
}

export async function getReadyIssues(projectPath: string): Promise<IIssue[]> {
  const stdout = await runCli(["ready", "--json", "--limit", "0"], projectPath, "bd ready");
  const payload = parseJsonPayload(stdout, "bd ready");
  if (!Array.isArray(payload)) {
    throw new Error("bd ready JSON was not an array");
  }

  return sortIssues(payload.flatMap(normalizeIssue));
}

export async function getBlockedIssues(projectPath: string): Promise<IBlockedIssue[]> {
  const stdout = await runCli(["blocked", "--json"], projectPath, "bd blocked");
  const payload = parseJsonPayload(stdout, "bd blocked");
  if (!Array.isArray(payload)) {
    throw new Error("bd blocked JSON was not an array");
  }

  return sortIssues(payload.flatMap(normalizeIssue)).map((issue) => ({ ...issue, blocked_by_count: issue.blockedByCount ?? 0 }));
}

export async function toggleIssuePinned(projectPath: string, issueId: string): Promise<boolean> {
  const issue = await getIssueFromBeadsCli(projectPath, issueId, { runner: beadsCliRunner });
  if (!issue) {
    return false;
  }

  const pinnedValue = issue.pinned === 1 ? "false" : "true";
  const result = await beadsCliRunner(["update", issueId, "--set-metadata", `pinned=${pinnedValue}`, "--json"], projectPath);
  return result.exitCode === 0;
}

export async function addIssueLabel(projectPath: string, issueId: string, label: string): Promise<boolean> {
  const result = await beadsCliRunner(["update", issueId, "--add-label", label, "--json"], projectPath);
  return result.exitCode === 0;
}

export async function removeIssueLabel(projectPath: string, issueId: string, label: string): Promise<boolean> {
  const result = await beadsCliRunner(["update", issueId, "--remove-label", label, "--json"], projectPath);
  return result.exitCode === 0;
}
