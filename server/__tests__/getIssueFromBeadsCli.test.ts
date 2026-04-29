import assert from "node:assert";
import { describe, expect, it } from "bun:test";

import { getIssueFromBeadsCli, type BeadsCliExecutionResult, type BeadsCliRunner } from "../getIssueFromBeadsCli";

type RecordedCommand = {
  cwd: string;
  args: string[];
};

function createRunner(outputs: Map<string, BeadsCliExecutionResult>, recordedCommands: RecordedCommand[]): BeadsCliRunner {
  return async (args, cwd) => {
    recordedCommands.push({ cwd, args });
    const output = outputs.get(args.join(" "));
    assert(output);
    return output;
  };
}

describe("getIssueFromBeadsCli", () => {
  it("loads issue details from bd show JSON in the project worktree", async () => {
    const recordedCommands: RecordedCommand[] = [];
    const projectPath = "/projects/example";
    const runner = createRunner(
      new Map([
        [
          "show bd-123 --json --long",
          {
            exitCode: 0,
            stdout: JSON.stringify([
              {
                id: "bd-123",
                title: "Use CLI details",
                description: "Read from bd instead of storage files",
                status: "open",
                priority: 1,
                issue_type: "task",
                assignee: "Alex Gorbatchev",
                created_at: "2026-04-28T10:00:00Z",
                updated_at: "2026-04-28T11:00:00Z",
                closed_at: null,
                design: "Use bd show as the detail source",
                acceptance_criteria: "Detail fields are preserved",
                notes: "Prefer the CLI contract",
                estimated_minutes: 30,
                due_at: "2026-04-30T00:00:00Z",
                defer_until: null,
                close_reason: "",
                pinned: true,
                external_ref: "BEADS-123",
                labels: ["Kind/Task"],
                dependencies: [
                  {
                    id: "bd-100",
                    title: "Parent blocker",
                    status: "in_progress",
                    priority: 2,
                    dependency_type: "blocks",
                    created_at: "2026-04-28T09:00:00Z",
                    created_by: "Alex Gorbatchev",
                  },
                ],
                comments: [
                  {
                    id: "comment-1",
                    issue_id: "bd-123",
                    author: "Alex Gorbatchev",
                    text: "CLI comment",
                    created_at: "2026-04-28T12:00:00Z",
                  },
                ],
              },
            ]),
            stderr: "",
          },
        ],
        [
          "show bd-123 --json --long --refs",
          {
            exitCode: 0,
            stdout: JSON.stringify({
              "bd-123": [
                {
                  id: "bd-200",
                  title: "Reverse dependency",
                  status: "open",
                  priority: 3,
                  dependency_type: "blocks",
                  created_at: "2026-04-28T08:00:00Z",
                  created_by: "Alex Gorbatchev",
                },
              ],
              schema_version: 1,
            }),
            stderr: "",
          },
        ],
        [
          "history bd-123 --json",
          {
            exitCode: 0,
            stdout: JSON.stringify([
              {
                CommitHash: "commit-1",
                Committer: "Alex Gorbatchev",
                CommitDate: "2026-04-28T13:00:00Z",
              },
            ]),
            stderr: "",
          },
        ],
      ]),
      recordedCommands,
    );

    const issue = await getIssueFromBeadsCli(projectPath, "bd-123", { includeRelated: true, runner });

    assert(issue);
    expect(recordedCommands).toEqual([
      { cwd: projectPath, args: ["show", "bd-123", "--json", "--long"] },
      { cwd: projectPath, args: ["show", "bd-123", "--json", "--long", "--refs"] },
      { cwd: projectPath, args: ["history", "bd-123", "--json"] },
    ]);
    expect(issue).toEqual({
      id: "bd-123",
      title: "Use CLI details",
      description: "Read from bd instead of storage files",
      status: "open",
      priority: 1,
      issue_type: "task",
      assignee: "Alex Gorbatchev",
      created_at: "2026-04-28T10:00:00Z",
      updated_at: "2026-04-28T11:00:00Z",
      closed_at: null,
      design: "Use bd show as the detail source",
      acceptance_criteria: "Detail fields are preserved",
      notes: "Prefer the CLI contract",
      estimated_minutes: 30,
      due_at: "2026-04-30T00:00:00Z",
      defer_until: null,
      close_reason: "",
      external_ref: "BEADS-123",
      pinned: 1,
      labels: ["Kind/Task"],
      dependencies: [
        {
          issue_id: "bd-123",
          depends_on_id: "bd-100",
          type: "blocks",
          created_at: "2026-04-28T09:00:00Z",
          created_by: "Alex Gorbatchev",
          title: "Parent blocker",
          status: "in_progress",
          priority: 2,
        },
      ],
      blockedBy: [
        {
          issue_id: "bd-200",
          depends_on_id: "bd-123",
          type: "blocks",
          created_at: "2026-04-28T08:00:00Z",
          created_by: "Alex Gorbatchev",
          title: "Reverse dependency",
          status: "open",
          priority: 3,
        },
      ],
      events: [
        {
          id: 1,
          issue_id: "bd-123",
          event_type: "history",
          actor: "Alex Gorbatchev",
          old_value: null,
          new_value: null,
          comment: "commit-1",
          created_at: "2026-04-28T13:00:00Z",
        },
      ],
      comments: [
        {
          id: "comment-1",
          issue_id: "bd-123",
          author: "Alex Gorbatchev",
          text: "CLI comment",
          created_at: "2026-04-28T12:00:00Z",
        },
      ],
      isReady: true,
      blockedByCount: 0,
    });
  });

  it("returns null when bd reports the issue is missing", async () => {
    const recordedCommands: RecordedCommand[] = [];
    const runner = createRunner(
      new Map([
        [
          "show bd-missing --json --long",
          {
            exitCode: 1,
            stdout: "",
            stderr: "Error: issue not found",
          },
        ],
      ]),
      recordedCommands,
    );

    const issue = await getIssueFromBeadsCli("/projects/example", "bd-missing", { runner });

    expect(recordedCommands).toEqual([{ cwd: "/projects/example", args: ["show", "bd-missing", "--json", "--long"] }]);
    expect(issue).toBeNull();
  });

  it("loads related issue details from enveloped bd JSON", async () => {
    const recordedCommands: RecordedCommand[] = [];
    const runner = createRunner(
      new Map([
        [
          "show bd-envelope --json --long",
          {
            exitCode: 0,
            stdout: JSON.stringify({
              schema_version: 1,
              data: [
                {
                  id: "bd-envelope",
                  title: "Envelope support",
                  description: "Read data from the bd JSON envelope",
                  status: "open",
                  priority: 2,
                  issue_type: "task",
                  assignee: null,
                  created_at: "2026-04-28T14:00:00Z",
                  updated_at: "2026-04-28T14:30:00Z",
                  closed_at: null,
                  labels: [],
                  dependencies: [],
                  comments: [],
                },
              ],
            }),
            stderr: "",
          },
        ],
        [
          "show bd-envelope --json --long --refs",
          {
            exitCode: 0,
            stdout: JSON.stringify({
              schema_version: 1,
              data: {
                "bd-envelope": [],
              },
            }),
            stderr: "",
          },
        ],
        [
          "history bd-envelope --json",
          {
            exitCode: 0,
            stdout: JSON.stringify({
              schema_version: 1,
              data: [],
            }),
            stderr: "",
          },
        ],
      ]),
      recordedCommands,
    );

    const issue = await getIssueFromBeadsCli("/projects/example", "bd-envelope", { includeRelated: true, runner });

    assert(issue);
    expect(recordedCommands).toEqual([
      { cwd: "/projects/example", args: ["show", "bd-envelope", "--json", "--long"] },
      { cwd: "/projects/example", args: ["show", "bd-envelope", "--json", "--long", "--refs"] },
      { cwd: "/projects/example", args: ["history", "bd-envelope", "--json"] },
    ]);
    expect(issue).toEqual({
      id: "bd-envelope",
      title: "Envelope support",
      description: "Read data from the bd JSON envelope",
      status: "open",
      priority: 2,
      issue_type: "task",
      assignee: null,
      created_at: "2026-04-28T14:00:00Z",
      updated_at: "2026-04-28T14:30:00Z",
      closed_at: null,
      labels: [],
      dependencies: [],
      blockedBy: [],
      events: [],
      comments: [],
      isReady: true,
      blockedByCount: 0,
    });
  });
});
