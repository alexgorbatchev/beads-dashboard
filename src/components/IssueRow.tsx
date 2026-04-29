import { Circle, Clock, CheckCircle2, Ban, PauseCircle, UserRound } from "lucide-react";
import type { ISsue, ViewMode, IssueStatus } from "../types";
import { formatIssueAssignee } from "@/lib/formatIssueAssignee";
import { Icon, Pill, PriorityBar, Stack, Text } from "@/components/ui/appPrimitives";
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
  const assigneeLabel = formatIssueAssignee(issue.assignee);

  if (viewMode === "compact") {
    return (
      <Button onClick={onClick} data-testid="IssueRow" variant="issue" size="compact" isActive={isFocused}>
        {/* Priority Bar */}
        <Stack variant="priorityCompact">
          <PriorityBar priority={issue.priority} />
        </Stack>

        {/* Status Icon */}
        <Icon icon={StatusIcon} tone={issue.status} />

        {/* ID */}
        <Text variant="issueRowId" wrap="truncate" title={issue.id}>
          {issue.id}
        </Text>

        {/* Title */}
        <Text variant="issueRowTitle" wrap="truncate">{issue.title}</Text>

        {/* Assignee */}
        <Stack variant="inlineChip">
          <Icon icon={UserRound} size="xs" />
          <Text wrap="noWrap">{assigneeLabel}</Text>
        </Stack>

        {/* Project Badge (if showing all) */}
        {issue.project && (
          <Pill>{issue.project}</Pill>
        )}

        {/* Time */}
        <Text variant="issueRowTime">{formatTimeAgo(issue.updated_at)}</Text>
      </Button>
    );
  }

  // Comfortable view
  return (
    <Button onClick={onClick} data-testid="IssueRow" variant="issue" size="comfortable" isActive={isFocused}>
      {/* Priority Bar */}
      <Stack variant="priorityFull">
        <PriorityBar priority={issue.priority} fullHeight />
      </Stack>

      {/* Status Icon */}
      <Stack variant="issueIconTop">
        <Icon icon={StatusIcon} tone={issue.status} />
      </Stack>

      {/* Content */}
      <Stack variant="issueRowContent">
        <Stack variant="issueRowHeader">
          <Text variant="issueRowId" wrap="truncate" title={issue.id}>
            {issue.id}
          </Text>
          <Badge state={STATUS_BADGE_STATES[issue.status]}>{STATUS_LABELS[issue.status]}</Badge>
          {issue.project && (
            <Pill>{issue.project}</Pill>
          )}
        </Stack>
        <Text as="div" variant="navTitle">{issue.title}</Text>
        {issue.description && (
          <Text as="div" variant="issueRowDescription">{truncateDescription(issue.description)}</Text>
        )}
      </Stack>

      {/* Meta */}
      <Stack variant="issueRowMeta">
        <Text variant="monoMuted">{formatTimeAgo(issue.updated_at)}</Text>
        {issue.issue_type && <Text variant="issueType">{issue.issue_type}</Text>}
        <Stack variant="row">
          <Icon icon={UserRound} size="xs" />
          <Text wrap="noWrap">{assigneeLabel}</Text>
        </Stack>
      </Stack>
    </Button>
  );
}
