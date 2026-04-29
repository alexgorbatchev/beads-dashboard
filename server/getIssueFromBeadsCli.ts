import type { CommentId, IComment, IDependency, IIssue } from "./db";

const BEADS_CLI_TIMEOUT_MS = 10_000;

type BeadsCliCommandArgs = string[];

type JsonObject = object;

export type BeadsCliExecutionResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

export type BeadsCliRunner = (args: BeadsCliCommandArgs, cwd: string) => Promise<BeadsCliExecutionResult>;

export type GetIssueFromBeadsCliOptions = {
  includeRelated?: boolean;
  runner?: BeadsCliRunner;
};

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null;
}

function getProperty(value: JsonObject, propertyName: string): unknown {
  return Object.getOwnPropertyDescriptor(value, propertyName)?.value;
}

function unwrapBdJsonEnvelope(value: unknown): unknown {
  if (!isJsonObject(value)) {
    return value;
  }

  const dataDescriptor = Object.getOwnPropertyDescriptor(value, "data");
  if (dataDescriptor) {
    return dataDescriptor.value;
  }

  return value;
}

function getStringProperty(value: JsonObject, propertyName: string): string | undefined {
  const propertyValue = getProperty(value, propertyName);
  if (typeof propertyValue === "string") {
    return propertyValue;
  }

  return undefined;
}

function getNullableStringProperty(value: JsonObject, propertyName: string): string | null | undefined {
  const propertyValue = getProperty(value, propertyName);
  if (typeof propertyValue === "string" || propertyValue === null) {
    return propertyValue;
  }

  return undefined;
}

function getNumberProperty(value: JsonObject, propertyName: string): number | undefined {
  const propertyValue = getProperty(value, propertyName);
  if (typeof propertyValue === "number") {
    return propertyValue;
  }

  return undefined;
}

function getBooleanProperty(value: JsonObject, propertyName: string): boolean | undefined {
  const propertyValue = getProperty(value, propertyName);
  if (typeof propertyValue === "boolean") {
    return propertyValue;
  }

  return undefined;
}

function getCommentIdProperty(value: JsonObject, propertyName: string): CommentId | undefined {
  const propertyValue = getProperty(value, propertyName);
  if (typeof propertyValue === "string" || typeof propertyValue === "number") {
    return propertyValue;
  }

  return undefined;
}

function getArrayProperty(value: JsonObject, propertyName: string): unknown[] {
  const propertyValue = getProperty(value, propertyName);
  if (Array.isArray(propertyValue)) {
    return propertyValue;
  }

  return [];
}

function getStringArrayProperty(value: JsonObject, propertyName: string): string[] {
  return getArrayProperty(value, propertyName).filter((item) => typeof item === "string");
}

function normalizeIssueStatus(status: string | undefined): IIssue["status"] {
  if (
    status === "open" ||
    status === "in_progress" ||
    status === "closed" ||
    status === "blocked" ||
    status === "deferred"
  ) {
    return status;
  }

  return "open";
}

function normalizeDependencyType(type: string | undefined): IDependency["type"] {
  if (type === "blocks" || type === "related" || type === "parent-child" || type === "discovered-from") {
    return type;
  }

  return "related";
}

function normalizeBdDependency(issueId: string, value: unknown): IDependency[] {
  if (!isJsonObject(value)) {
    return [];
  }

  const dependsOnId = getStringProperty(value, "id");
  if (!dependsOnId) {
    return [];
  }

  const dependency: IDependency = {
    issue_id: issueId,
    depends_on_id: dependsOnId,
    type: normalizeDependencyType(getStringProperty(value, "dependency_type")),
    created_at: getStringProperty(value, "created_at") || "",
    created_by: getStringProperty(value, "created_by") || "",
  };

  const title = getStringProperty(value, "title");
  if (title) {
    dependency.title = title;
  }

  const status = getStringProperty(value, "status");
  if (status) {
    dependency.status = status;
  }

  const priority = getNumberProperty(value, "priority");
  if (priority !== undefined) {
    dependency.priority = priority;
  }

  return [dependency];
}

function normalizeBdRef(issueId: string, value: unknown): IDependency[] {
  if (!isJsonObject(value)) {
    return [];
  }

  const referencingIssueId = getStringProperty(value, "id");
  if (!referencingIssueId) {
    return [];
  }

  const dependency: IDependency = {
    issue_id: referencingIssueId,
    depends_on_id: issueId,
    type: normalizeDependencyType(getStringProperty(value, "dependency_type")),
    created_at: getStringProperty(value, "created_at") || "",
    created_by: getStringProperty(value, "created_by") || "",
  };

  const title = getStringProperty(value, "title");
  if (title) {
    dependency.title = title;
  }

  const status = getStringProperty(value, "status");
  if (status) {
    dependency.status = status;
  }

  const priority = getNumberProperty(value, "priority");
  if (priority !== undefined) {
    dependency.priority = priority;
  }

  return [dependency];
}

function normalizeBdComment(value: unknown): IComment[] {
  if (!isJsonObject(value)) {
    return [];
  }

  const id = getCommentIdProperty(value, "id");
  const issueId = getStringProperty(value, "issue_id");
  if (id === undefined || !issueId) {
    return [];
  }

  return [
    {
      id,
      issue_id: issueId,
      author: getStringProperty(value, "author") || "",
      text: getStringProperty(value, "text") || "",
      created_at: getStringProperty(value, "created_at") || "",
    },
  ];
}

function normalizeBdIssue(value: unknown, includeRelated: boolean): IIssue {
  if (!isJsonObject(value)) {
    throw new Error("bd show returned an issue with an unexpected shape");
  }

  const id = getStringProperty(value, "id");
  if (!id) {
    throw new Error("bd show returned an issue without a string id");
  }

  const createdAt = getStringProperty(value, "created_at") || "";
  const status = normalizeIssueStatus(getStringProperty(value, "status"));
  const issue: IIssue = {
    id,
    title: getStringProperty(value, "title") || id,
    description: getStringProperty(value, "description") || "",
    status,
    priority: getNumberProperty(value, "priority") ?? 2,
    issue_type: getStringProperty(value, "issue_type") || "task",
    assignee: getNullableStringProperty(value, "assignee") ?? null,
    created_at: createdAt,
    updated_at: getStringProperty(value, "updated_at") || createdAt,
    closed_at: getNullableStringProperty(value, "closed_at") ?? null,
    labels: getStringArrayProperty(value, "labels"),
  };

  const design = getStringProperty(value, "design");
  if (design !== undefined) {
    issue.design = design;
  }

  const acceptanceCriteria = getStringProperty(value, "acceptance_criteria");
  if (acceptanceCriteria !== undefined) {
    issue.acceptance_criteria = acceptanceCriteria;
  }

  const notes = getStringProperty(value, "notes");
  if (notes !== undefined) {
    issue.notes = notes;
  }

  const estimatedMinutes = getNumberProperty(value, "estimated_minutes");
  if (estimatedMinutes !== undefined) {
    issue.estimated_minutes = estimatedMinutes;
  }

  const dueAt = getNullableStringProperty(value, "due_at");
  if (dueAt !== undefined) {
    issue.due_at = dueAt;
  }

  const deferUntil = getNullableStringProperty(value, "defer_until");
  if (deferUntil !== undefined) {
    issue.defer_until = deferUntil;
  }

  const closeReason = getStringProperty(value, "close_reason");
  if (closeReason !== undefined) {
    issue.close_reason = closeReason;
  }

  const externalRef = getNullableStringProperty(value, "external_ref");
  if (externalRef !== undefined) {
    issue.external_ref = externalRef;
  }

  const pinned = getNumberProperty(value, "pinned");
  if (pinned !== undefined) {
    issue.pinned = pinned;
  }

  const isPinned = getBooleanProperty(value, "pinned");
  if (isPinned !== undefined) {
    issue.pinned = isPinned ? 1 : 0;
  }

  if (includeRelated) {
    const blockedByCount = getNumberProperty(value, "dependency_count") ?? 0;
    issue.dependencies = getArrayProperty(value, "dependencies").flatMap((dependency) => normalizeBdDependency(id, dependency));
    issue.blockedBy = [];
    issue.events = [];
    issue.comments = getArrayProperty(value, "comments").flatMap(normalizeBdComment);
    issue.isReady = status === "open" && blockedByCount === 0;
    issue.blockedByCount = blockedByCount;
  }

  return issue;
}

function parseBdShowResponse(stdout: string, issueId: string, includeRelated: boolean): IIssue | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse bd show JSON for ${issueId}: ${message}`);
  }

  const payload = unwrapBdJsonEnvelope(parsed);
  if (!Array.isArray(payload)) {
    throw new Error(`bd show JSON for ${issueId} was not an array`);
  }

  const issue = payload[0];
  if (issue === undefined) {
    return null;
  }

  return normalizeBdIssue(issue, includeRelated);
}

function parseBdRefsResponse(stdout: string, issueId: string): IDependency[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse bd show refs JSON for ${issueId}: ${message}`);
  }

  const payload = unwrapBdJsonEnvelope(parsed);
  if (!isJsonObject(payload)) {
    throw new Error(`bd show refs JSON for ${issueId} was not an object`);
  }

  const refs = getProperty(payload, issueId);
  if (!Array.isArray(refs)) {
    return [];
  }

  return refs.flatMap((ref) => normalizeBdRef(issueId, ref));
}

function normalizeBdHistoryEvent(value: unknown, index: number, issueId: string): IIssueEvent[] {
  if (!isJsonObject(value)) {
    return [];
  }

  const commitHash = getStringProperty(value, "CommitHash");
  if (!commitHash) {
    return [];
  }

  return [
    {
      id: index + 1,
      issue_id: issueId,
      event_type: "history",
      actor: getStringProperty(value, "Committer") || "",
      old_value: null,
      new_value: null,
      comment: commitHash,
      created_at: getStringProperty(value, "CommitDate") || "",
    },
  ];
}

function parseBdHistoryResponse(stdout: string, issueId: string): IIssueEvent[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse bd history JSON for ${issueId}: ${message}`);
  }

  const payload = unwrapBdJsonEnvelope(parsed);
  if (!Array.isArray(payload)) {
    throw new Error(`bd history JSON for ${issueId} was not an array`);
  }

  return payload.flatMap((event, index) => normalizeBdHistoryEvent(event, index, issueId));
}

function isIssueNotFound(stderr: string): boolean {
  return stderr.toLowerCase().includes("not found");
}

async function runBeadsCli(args: BeadsCliCommandArgs, cwd: string): Promise<BeadsCliExecutionResult> {
  const subprocess = Bun.spawn({
    cmd: ["bd", ...args],
    cwd,
    env: {
      ...process.env,
      NO_COLOR: "1",
      TERM: "dumb",
    },
    stdout: "pipe",
    stderr: "pipe",
    timeout: BEADS_CLI_TIMEOUT_MS,
    killSignal: "SIGTERM",
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(subprocess.stdout).text(),
    new Response(subprocess.stderr).text(),
    subprocess.exited,
  ]);

  return { exitCode, stdout, stderr };
}

export async function getIssueFromBeadsCli(
  projectPath: string,
  issueId: string,
  options: GetIssueFromBeadsCliOptions = {},
): Promise<IIssue | null> {
  const includeRelated = options.includeRelated === true;
  const runner = options.runner || runBeadsCli;
  const result = await runner(["show", issueId, "--json", "--long"], projectPath);

  if (result.exitCode !== 0) {
    if (isIssueNotFound(result.stderr)) {
      return null;
    }

    throw new Error(`bd show failed for ${issueId} in ${projectPath}: ${result.stderr || `exit ${result.exitCode}`}`);
  }

  const issue = parseBdShowResponse(result.stdout, issueId, includeRelated);
  if (!issue || !includeRelated) {
    return issue;
  }

  const refsResult = await runner(["show", issueId, "--json", "--long", "--refs"], projectPath);
  if (refsResult.exitCode !== 0) {
    throw new Error(`bd show --refs failed for ${issueId} in ${projectPath}: ${refsResult.stderr || `exit ${refsResult.exitCode}`}`);
  }
  issue.blockedBy = parseBdRefsResponse(refsResult.stdout, issueId);

  const historyResult = await runner(["history", issueId, "--json"], projectPath);
  if (historyResult.exitCode !== 0) {
    throw new Error(`bd history failed for ${issueId} in ${projectPath}: ${historyResult.stderr || `exit ${historyResult.exitCode}`}`);
  }
  issue.events = parseBdHistoryResponse(historyResult.stdout, issueId);

  return issue;
}
