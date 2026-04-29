import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import assert from "node:assert";
import { afterEach, describe, expect, it } from "bun:test";

import { getIssueGitDiff } from "../gitDiff";

const temporaryRoots: string[] = [];

function createTemporaryDirectory(): string {
  const temporaryParentPath = path.join(process.cwd(), ".tmp");
  mkdirSync(temporaryParentPath, { recursive: true });
  const temporaryRoot = mkdtempSync(path.join(temporaryParentPath, "git-diff-test-"));
  temporaryRoots.push(temporaryRoot);
  return temporaryRoot;
}

function runGit(workingDirectory: string, args: string[]): void {
  const result = spawnSync("git", args, {
    cwd: workingDirectory,
    encoding: "utf8",
  });

  expect(result.status).toBe(0);
}

function normalizeDiffHashes(diff: string): string {
  return diff.replace(/index [0-9a-f]+\.\.[0-9a-f]+/g, "index <hash>..<hash>");
}

afterEach(() => {
  for (const temporaryRoot of temporaryRoots.splice(0)) {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

describe("getIssueGitDiff", () => {
  it("returns the committed branch diff and dirty worktree diff for a matching issue worktree", () => {
    const repositoryPath = createTemporaryDirectory();
    runGit(repositoryPath, ["init", "--initial-branch=main"]);
    runGit(repositoryPath, ["config", "user.email", "test@example.com"]);
    runGit(repositoryPath, ["config", "user.name", "Test User"]);

    writeFileSync(path.join(repositoryPath, "README.md"), "base\n");
    runGit(repositoryPath, ["add", "README.md"]);
    runGit(repositoryPath, ["commit", "-m", "initial"]);

    const worktreePath = path.join(createTemporaryDirectory(), "bd-1234-worktree");
    runGit(repositoryPath, ["worktree", "add", "-b", "feature/bd-1234-diff", worktreePath]);

    writeFileSync(path.join(worktreePath, "README.md"), "base\nbranch change\n");
    runGit(worktreePath, ["commit", "-am", "branch change"]);
    writeFileSync(path.join(worktreePath, "README.md"), "base\nbranch change\nworktree change\n");

    const result = getIssueGitDiff({ issueId: "bd-1234", projectPath: repositoryPath });

    assert(result.kind === "found");
    expect(result.branchName).toBe("feature/bd-1234-diff");
    expect(result.baseBranch).toBe("main");
    expect(result.worktreePath).toBe(worktreePath);
    expect(normalizeDiffHashes(result.branchDiff)).toMatchInlineSnapshot(`
      "diff --git a/README.md b/README.md
      index <hash>..<hash> 100644
      --- a/README.md
      +++ b/README.md
      @@ -1 +1,2 @@
       base
      +branch change
      "
    `);
    expect(normalizeDiffHashes(result.worktreeDiff)).toMatchInlineSnapshot(`
      "diff --git a/README.md b/README.md
      index <hash>..<hash> 100644
      --- a/README.md
      +++ b/README.md
      @@ -1,2 +1,3 @@
       base
       branch change
      +worktree change
      "
    `);
    expect(result.status).toMatchInlineSnapshot(`
      " M README.md
      "
    `);
  });

  it("returns not_found when no branch or worktree name contains the issue id", () => {
    const repositoryPath = createTemporaryDirectory();
    runGit(repositoryPath, ["init", "--initial-branch=main"]);
    runGit(repositoryPath, ["config", "user.email", "test@example.com"]);
    runGit(repositoryPath, ["config", "user.name", "Test User"]);
    writeFileSync(path.join(repositoryPath, "README.md"), "base\n");
    runGit(repositoryPath, ["add", "README.md"]);
    runGit(repositoryPath, ["commit", "-m", "initial"]);

    const result = getIssueGitDiff({ issueId: "bd-missing", projectPath: repositoryPath });

    expect(result).toEqual({
      kind: "not_found",
      message: "No git branch or worktree containing issue id bd-missing was found.",
    });
  });
});
