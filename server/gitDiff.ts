import { execFileSync } from "node:child_process";
import path from "node:path";

const GIT_DIFF_MAX_BUFFER_BYTES = 8 * 1024 * 1024;

export type IssueGitDiffResult = IssueGitDiffFound | IssueGitDiffNotFound | IssueGitDiffUnavailable;

export interface IIssueGitDiffRequest {
  issueId: string;
  projectPath: string;
}

export interface IIssueGitDiffFound {
  kind: "found";
  branchName: string;
  baseBranch: string;
  worktreePath: string | null;
  branchDiff: string;
  worktreeDiff: string;
  status: string;
}

export interface IIssueGitDiffNotFound {
  kind: "not_found";
  message: string;
}

export interface IIssueGitDiffUnavailable {
  kind: "unavailable";
  message: string;
}

interface IGitWorktree {
  worktreePath: string;
  branchName: string | null;
}

interface IIssueGitCandidate {
  branchName: string;
  comparisonRef: string;
  diffWorkingDirectory: string;
  worktreePath: string | null;
}

function runGit(workingDirectory: string, args: string[]): string {
  return execFileSync("git", args, {
    cwd: workingDirectory,
    encoding: "utf8",
    maxBuffer: GIT_DIFF_MAX_BUFFER_BYTES,
  });
}

function tryRunGit(workingDirectory: string, args: string[]): string | null {
  try {
    return runGit(workingDirectory, args);
  } catch {
    return null;
  }
}

function stripGitRefPrefix(branchRef: string): string {
  const branchPrefix = "refs/heads/";
  if (branchRef.startsWith(branchPrefix)) {
    return branchRef.slice(branchPrefix.length);
  }

  return branchRef;
}

export function parseGitWorktreeList(output: string): IGitWorktree[] {
  return output
    .trim()
    .split("\n\n")
    .filter(Boolean)
    .map((block) => {
      const lines = block.split("\n");
      const worktreeLine = lines.find((line) => line.startsWith("worktree "));
      const branchLine = lines.find((line) => line.startsWith("branch "));
      const worktreePath = worktreeLine ? worktreeLine.slice("worktree ".length) : "";
      const branchName = branchLine ? stripGitRefPrefix(branchLine.slice("branch ".length)) : null;

      return { worktreePath, branchName };
    })
    .filter((worktree) => worktree.worktreePath.length > 0);
}

function getLocalBranches(repositoryPath: string): string[] {
  const output = tryRunGit(repositoryPath, ["for-each-ref", "--format=%(refname:short)", "refs/heads"]);
  if (!output) {
    return [];
  }

  return output.split("\n").filter(Boolean);
}

function branchExists(repositoryPath: string, branchName: string): boolean {
  return tryRunGit(repositoryPath, ["rev-parse", "--verify", "--quiet", branchName]) !== null;
}

function getBaseBranch(repositoryPath: string): string {
  const remoteHead = tryRunGit(repositoryPath, ["symbolic-ref", "--quiet", "--short", "refs/remotes/origin/HEAD"]);
  if (remoteHead) {
    return remoteHead.trim();
  }

  if (branchExists(repositoryPath, "main")) {
    return "main";
  }

  if (branchExists(repositoryPath, "master")) {
    return "master";
  }

  return "HEAD";
}

function isIssueMatch(value: string, issueId: string): boolean {
  return value.toLocaleLowerCase().includes(issueId.toLocaleLowerCase());
}

function getMatchingCandidate(repositoryPath: string, issueId: string): IIssueGitCandidate | null {
  const worktreeOutput = tryRunGit(repositoryPath, ["worktree", "list", "--porcelain"]);
  const worktrees = worktreeOutput ? parseGitWorktreeList(worktreeOutput) : [];

  const matchingWorktree = worktrees.find((worktree) => {
    const baseName = path.basename(worktree.worktreePath);
    const branchName = worktree.branchName || "";
    return isIssueMatch(baseName, issueId) || isIssueMatch(branchName, issueId);
  });

  if (matchingWorktree?.branchName) {
    return {
      branchName: matchingWorktree.branchName,
      comparisonRef: matchingWorktree.branchName,
      diffWorkingDirectory: repositoryPath,
      worktreePath: matchingWorktree.worktreePath,
    };
  }

  if (matchingWorktree) {
    return {
      branchName: "detached HEAD",
      comparisonRef: "HEAD",
      diffWorkingDirectory: matchingWorktree.worktreePath,
      worktreePath: matchingWorktree.worktreePath,
    };
  }

  const matchingBranch = getLocalBranches(repositoryPath).find((branchName) => isIssueMatch(branchName, issueId));
  if (matchingBranch) {
    return {
      branchName: matchingBranch,
      comparisonRef: matchingBranch,
      diffWorkingDirectory: repositoryPath,
      worktreePath: null,
    };
  }

  return null;
}

function getWorktreeDiff(worktreePath: string): string {
  const stagedDiff = tryRunGit(worktreePath, ["diff", "--cached", "--binary", "--find-renames", "--"]);
  const unstagedDiff = tryRunGit(worktreePath, ["diff", "--binary", "--find-renames", "--"]);

  return [stagedDiff, unstagedDiff].filter((diff) => diff !== null && diff.length > 0).join("");
}

export function getIssueGitDiff(request: IIssueGitDiffRequest): IssueGitDiffResult {
  const repositoryPath = tryRunGit(request.projectPath, ["rev-parse", "--show-toplevel"]);
  if (!repositoryPath) {
    return {
      kind: "unavailable",
      message: "Project path is not inside a git repository.",
    };
  }

  const resolvedRepositoryPath = repositoryPath.trim();
  const candidate = getMatchingCandidate(resolvedRepositoryPath, request.issueId);
  if (!candidate) {
    return {
      kind: "not_found",
      message: `No git branch or worktree containing issue id ${request.issueId} was found.`,
    };
  }

  const baseBranch = getBaseBranch(resolvedRepositoryPath);
  const branchDiff = runGit(candidate.diffWorkingDirectory, [
    "diff",
    "--binary",
    "--find-renames",
    `${baseBranch}...${candidate.comparisonRef}`,
    "--",
  ]);
  const worktreeDiff = candidate.worktreePath ? getWorktreeDiff(candidate.worktreePath) : "";
  const status = candidate.worktreePath ? runGit(candidate.worktreePath, ["status", "--short"]) : "";

  return {
    kind: "found",
    branchName: candidate.branchName,
    baseBranch,
    worktreePath: candidate.worktreePath,
    branchDiff,
    worktreeDiff,
    status,
  };
}
