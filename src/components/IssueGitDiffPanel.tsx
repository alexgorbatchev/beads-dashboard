import type { JSX } from "react";
import { GitBranch, RefreshCw } from "lucide-react";

import type { IssueGitDiff } from "../types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface IIssueGitDiffPanelProps {
  diff: IssueGitDiff | null;
  isLoading: boolean;
  error: string | null;
  onLoad: () => void;
}

interface IDiffBlockProps {
  label: string;
  diff: string;
}

function DiffBlock({ label, diff }: IDiffBlockProps): JSX.Element | null {
  if (!diff) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted">{label}</div>
      <pre className="max-h-80 overflow-auto rounded-lg border border-border bg-void p-3 text-xs leading-relaxed text-secondary">
        <code>{diff}</code>
      </pre>
    </div>
  );
}

export function IssueGitDiffPanel({ diff, isLoading, error, onLoad }: IIssueGitDiffPanelProps): JSX.Element {
  const isFound = diff?.kind === "found";
  const hasDiff = isFound && (diff.branchDiff.length > 0 || diff.worktreeDiff.length > 0 || diff.status.length > 0);

  return (
    <section className="space-y-3" data-testid="IssueGitDiffPanel">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-xs font-medium leading-none text-muted uppercase tracking-wider">
          <GitBranch className="w-3 h-3" />
          Worktree / Branch Diff
        </h3>
        <Button
          type="button"
          variant="subtle"
          size="xs"
          onClick={onLoad}
          disabled={isLoading}
        >
          <RefreshCw className={cn("size-3", isLoading && "animate-spin")} />
          {diff ? "Refresh diff" : "Load diff"}
        </Button>
      </div>

      {isLoading && <div className="text-sm text-muted">Loading git diff...</div>}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-secondary"
        >
          {error}
        </div>
      )}

      {!isLoading && diff?.kind === "not_found" && (
        <div className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted">{diff.message}</div>
      )}

      {!isLoading && diff?.kind === "unavailable" && (
        <div className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted">{diff.message}</div>
      )}

      {!isLoading && isFound && (
        <div className="space-y-3">
          <dl className="grid grid-cols-1 gap-2 rounded-lg border border-border bg-surface p-3 text-xs sm:grid-cols-2">
            <div>
              <dt className="text-muted">Branch</dt>
              <dd className="mt-1 font-mono text-secondary break-all">{diff.branchName}</dd>
            </div>
            <div>
              <dt className="text-muted">Compared with</dt>
              <dd className="mt-1 font-mono text-secondary break-all">{diff.baseBranch}</dd>
            </div>
            {diff.worktreePath && (
              <div className="sm:col-span-2">
                <dt className="text-muted">Worktree</dt>
                <dd className="mt-1 font-mono text-secondary break-all">{diff.worktreePath}</dd>
              </div>
            )}
          </dl>

          {diff.status && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted">Working tree status</div>
              <pre className="overflow-auto rounded-lg border border-border bg-void p-3 text-xs text-secondary">
                <code>{diff.status}</code>
              </pre>
            </div>
          )}

          <DiffBlock label="Committed branch diff" diff={diff.branchDiff} />
          <DiffBlock label="Uncommitted worktree diff" diff={diff.worktreeDiff} />

          {!hasDiff && (
            <div className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted">
              The matching branch/worktree has no committed or uncommitted changes to show.
            </div>
          )}
        </div>
      )}
    </section>
  );
}
