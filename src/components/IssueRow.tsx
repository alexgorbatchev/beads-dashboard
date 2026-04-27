import { Circle, Clock, CheckCircle2, Ban, PauseCircle } from "lucide-react";
import type { ISsue, ViewMode, IssueStatus } from "../types";
import { cn } from "@/lib/utils";

interface ISsueRowProps {
  issue: ISsue;
  viewMode: ViewMode;
  onClick: () => void;
  isFocused?: boolean;
}

const STATUS_ICONS: Record<IssueStatus, typeof Circle> = {
  open: Circle,
  in_progress: Clock,
  closed: CheckCircle2,
  blocked: Ban,
  deferred: PauseCircle,
};

const STATUS_COLORS: Record<IssueStatus, string> = {
  open: "text-[var(--color-status-open)]",
  in_progress: "text-[var(--color-status-progress)]",
  closed: "text-[var(--color-status-closed)]",
  blocked: "text-red-500",
  deferred: "text-gray-500",
};

const PRIORITY_CLASSES: Record<number, string> = {
  0: "p0",
  1: "p1",
  2: "p2",
  3: "p3",
  4: "p4",
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function truncateDescription(text: string, maxLength: number = 120): string {
  if (!text) return "";
  const cleaned = text.replace(/\n/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength).trim() + "...";
}

export function IssueRow({ issue, viewMode, onClick, isFocused = false }: ISsueRowProps) {
  const StatusIcon = STATUS_ICONS[issue.status];
  const priorityClass = PRIORITY_CLASSES[issue.priority as keyof typeof PRIORITY_CLASSES] || "p4";

  if (viewMode === "compact") {
    return (
      <button
        onClick={onClick}
        data-testid="IssueRow"
        className={cn(
          "issue-row w-full flex items-center gap-3 px-4 py-2.5 border-b border-border text-left hover:bg-surface/50 transition-colors",
          isFocused && "bg-accent/10 border-l-2 border-l-accent",
        )}
      >
        {/* Priority Bar */}
        <div className="h-4 flex items-center">
          <div className={cn("priority-bar", priorityClass)} />
        </div>

        {/* Status Icon */}
        <StatusIcon
          className={cn(
            "w-4 h-4 shrink-0",
            STATUS_COLORS[issue.status],
            issue.status === "in_progress" && "status-dot active",
          )}
        />

        {/* ID */}
        <span className="font-mono text-xs text-muted max-w-32 shrink-0 truncate" title={issue.id}>
          {issue.id}
        </span>

        {/* Title */}
        <span className="flex-1 text-sm text-primary truncate">{issue.title}</span>

        {/* Project Badge (if showing all) */}
        {issue.project && (
          <span className="text-xs font-mono text-muted bg-surface px-2 py-0.5 rounded shrink-0">{issue.project}</span>
        )}

        {/* Time */}
        <span className="text-xs font-mono text-muted w-12 text-right shrink-0">{formatTimeAgo(issue.updated_at)}</span>
      </button>
    );
  }

  // Comfortable view
  return (
    <button
      onClick={onClick}
      data-testid="IssueRow"
      className={cn(
        "issue-row w-full flex gap-3 px-4 py-3 border-b border-border text-left hover:bg-surface/50 transition-colors",
        isFocused && "bg-accent/10 border-l-2 border-l-accent",
      )}
    >
      {/* Priority Bar */}
      <div className="h-full flex items-stretch py-1">
        <div className={cn("priority-bar h-full", priorityClass)} />
      </div>

      {/* Status Icon */}
      <div className="pt-0.5">
        <StatusIcon
          className={cn("w-4 h-4", STATUS_COLORS[issue.status], issue.status === "in_progress" && "status-dot active")}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted max-w-32 truncate" title={issue.id}>
            {issue.id}
          </span>
          <span className={cn("badge-status", issue.status.replace("_", ""))}>{issue.status.replace("_", " ")}</span>
          {issue.project && (
            <span className="text-xs font-mono text-muted bg-surface px-2 py-0.5 rounded shrink-0">
              {issue.project}
            </span>
          )}
        </div>
        <div className="mt-1 text-sm text-primary">{issue.title}</div>
        {issue.description && (
          <div className="mt-1 text-xs text-secondary leading-relaxed">{truncateDescription(issue.description)}</div>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-xs font-mono text-muted">{formatTimeAgo(issue.updated_at)}</span>
        {issue.issue_type && <span className="text-[10px] font-mono text-muted uppercase">{issue.issue_type}</span>}
      </div>
    </button>
  );
}
