import { Circle, Clock, CheckCircle2, Ban, PauseCircle, UserRound } from "lucide-react";
import type { ISsue, ViewMode, IssueStatus } from "../types";
import { formatIssueAssignee } from "@/lib/formatIssueAssignee";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

type StatusBadgeState = "statusOpen" | "statusProgress" | "statusClosed" | "statusBlocked" | "statusDeferred";

const STATUS_BADGE_STATES: Record<IssueStatus, StatusBadgeState> = {
  open: "statusOpen",
  in_progress: "statusProgress",
  closed: "statusClosed",
  blocked: "statusBlocked",
  deferred: "statusDeferred",
};

const STATUS_LABELS: Record<IssueStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  closed: "Closed",
  blocked: "Blocked",
  deferred: "Deferred",
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
  const assigneeLabel = formatIssueAssignee(issue.assignee);

  if (viewMode === "compact") {
    return (
      <Button onClick={onClick} data-testid="IssueRow" variant="issue" size="compact" isActive={isFocused}>
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

        {/* Assignee */}
        <span
          className="inline-flex items-center gap-1 text-xs text-muted bg-surface px-2 py-0.5 rounded shrink-0"
          title={`Assignee: ${assigneeLabel}`}
        >
          <UserRound className="h-3 w-3" />
          <span className="whitespace-nowrap">{assigneeLabel}</span>
        </span>

        {/* Project Badge (if showing all) */}
        {issue.project && (
          <span className="text-xs font-mono text-muted bg-surface px-2 py-0.5 rounded shrink-0">{issue.project}</span>
        )}

        {/* Time */}
        <span className="text-xs font-mono text-muted w-12 text-right shrink-0">{formatTimeAgo(issue.updated_at)}</span>
      </Button>
    );
  }

  // Comfortable view
  return (
    <Button onClick={onClick} data-testid="IssueRow" variant="issue" size="comfortable" isActive={isFocused}>
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
          <Badge state={STATUS_BADGE_STATES[issue.status]}>{STATUS_LABELS[issue.status]}</Badge>
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
        <span className="inline-flex items-center gap-1 text-xs text-muted" title={`Assignee: ${assigneeLabel}`}>
          <UserRound className="h-3 w-3 shrink-0" />
          <span className="whitespace-nowrap">{assigneeLabel}</span>
        </span>
      </div>
    </Button>
  );
}
