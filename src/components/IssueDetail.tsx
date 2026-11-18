import { useState, type JSX, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  X,
  Circle,
  Clock,
  CheckCircle2,
  ChevronDown,
  Trash2,
  AlertTriangle,
  ArrowUp,
  Minus,
  ArrowDown,
  Ban,
  PauseCircle,
  Pin,
  PinOff,
  GitBranch,
  Tag,
  Calendar,
  History,
  ArrowRight,
  Link2,
  MessageCircle,
  Pencil,
  Check,
  Plus,
} from "lucide-react";
import type { ISsue, IssueGitDiff, IssueStatus, ISsueEvent } from "../types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuPositioner,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon, Panel, Pill, SectionHeading, Stack, Text, TimelineDot } from "@/components/ui/appPrimitives";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/Textarea";
import { MarkdownContent } from "@/components/MarkdownContent";
import { IssueGitDiffPanel } from "@/components/IssueGitDiffPanel";
import { formatIssueAssignee } from "@/lib/formatIssueAssignee";

interface IIssueDetailProps {
  issue: ISsue | null;
  open: boolean;
  onClose: () => void;
  onUpdateStatus: (status: IssueStatus) => void;
  onUpdatePriority: (priority: number) => void;
  onUpdateField?: (field: "title" | "description" | "notes", value: string) => void;
  onAddLabel?: (label: string) => void;
  onRemoveLabel?: (label: string) => void;
  onUpdateDueDate?: (dueDate: string | null) => void;
  isDeleteConfirmationOpen: boolean;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onTogglePin?: () => void;
  onSelectIssue?: (issueId: string) => void;
  gitDiff?: IssueGitDiff | null;
  isLoadingGitDiff?: boolean;
  gitDiffError?: string | null;
  onLoadGitDiff?: () => void;
}

interface IStatusConfigItem {
  icon: typeof Circle;
  label: string;
  iconTone: "open" | "in_progress" | "closed" | "blocked" | "deferred";
  badgeState: "statusOpen" | "statusProgress" | "statusClosed" | "statusBlocked" | "statusDeferred";
}

type StatusConfigEntry = [IssueStatus, IStatusConfigItem];
type PriorityConfigEntry = [string, IPriorityConfigItem];
type EditKeyDownEvent = ReactKeyboardEvent<HTMLInputElement | HTMLTextAreaElement>;
type StatusButtonTone = "open" | "progress" | "closed" | "blocked" | "deferred";

const STATUS_CONFIG: Record<IssueStatus, IStatusConfigItem> = {
  open: {
    icon: Circle,
    label: "Open",
    iconTone: "open",
    badgeState: "statusOpen",
  },
  in_progress: {
    icon: Clock,
    label: "In Progress",
    iconTone: "in_progress",
    badgeState: "statusProgress",
  },
  closed: {
    icon: CheckCircle2,
    label: "Closed",
    iconTone: "closed",
    badgeState: "statusClosed",
  },
  blocked: {
    icon: Ban,
    label: "Blocked",
    iconTone: "blocked",
    badgeState: "statusBlocked",
  },
  deferred: {
    icon: PauseCircle,
    label: "Deferred",
    iconTone: "deferred",
    badgeState: "statusDeferred",
  },
};

interface IPriorityConfigItem {
  icon: typeof AlertTriangle;
  label: string;
  iconTone: "priorityUrgent" | "priorityHigh" | "priorityMedium" | "priorityLow" | "muted";
}

const PRIORITY_CONFIG: Record<number, IPriorityConfigItem> = {
  0: {
    icon: AlertTriangle,
    label: "Critical",
    iconTone: "priorityUrgent",
  },
  1: {
    icon: AlertTriangle,
    label: "High",
    iconTone: "priorityHigh",
  },
  2: {
    icon: ArrowUp,
    label: "Medium",
    iconTone: "priorityMedium",
  },
  3: {
    icon: Minus,
    label: "Low",
    iconTone: "priorityLow",
  },
  4: {
    icon: ArrowDown,
    label: "Backlog",
    iconTone: "muted",
  },
};

function getStatusButtonTone(status: IssueStatus): StatusButtonTone {
  if (status === "in_progress") {
    return "progress";
  }

  return status;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `${Math.abs(diffDays)} days overdue`;
  } else if (diffDays === 0) {
    return "Due today";
  } else if (diffDays === 1) {
    return "Due tomorrow";
  } else if (diffDays <= 7) {
    return `Due in ${diffDays} days`;
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}

function formatEventDescription(event: ISsueEvent): string {
  switch (event.event_type) {
    case "status_change":
      return `Status changed from ${event.old_value || "none"} to ${event.new_value || "none"}`;
    case "priority_change":
      return `Priority changed from ${event.old_value || "none"} to ${event.new_value || "none"}`;
    case "created":
      return "Issue created";
    case "closed":
      return "Issue closed";
    case "reopened":
      return "Issue reopened";
    case "assigned":
      return `Assigned to ${event.new_value || "unassigned"}`;
    case "label_added":
      return `Label "${event.new_value}" added`;
    case "label_removed":
      return `Label "${event.old_value}" removed`;
    default:
      return event.event_type.replace(/_/g, " ");
  }
}

export function IssueDetail({
  issue,
  open,
  onClose,
  onUpdateStatus,
  onUpdatePriority,
  onUpdateField,
  onAddLabel,
  onRemoveLabel,
  onUpdateDueDate,
  isDeleteConfirmationOpen,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
  onTogglePin,
  onSelectIssue,
  gitDiff = null,
  isLoadingGitDiff = false,
  gitDiffError = null,
  onLoadGitDiff,
}: IIssueDetailProps): JSX.Element | null {
  type EditField = "title" | "description" | "notes";
  const [editingField, setEditingField] = useState<EditField | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);

  const startEditing = (field: EditField, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue("");
  };

  const saveField = () => {
    if (editingField && onUpdateField) {
      onUpdateField(editingField, editValue);
    }
    setEditingField(null);
    setEditValue("");
  };

  const handleKeyDown = (e: EditKeyDownEvent) => {
    if (e.key === "Escape") {
      cancelEditing();
    } else if (e.key === "Enter" && !e.shiftKey && editingField === "title") {
      e.preventDefault();
      saveField();
    } else if (e.key === "Enter" && e.metaKey) {
      e.preventDefault();
      saveField();
    }
  };

  if (!issue) return null;

  const statusConfig = STATUS_CONFIG[issue.status];
  const priorityConfig = PRIORITY_CONFIG[issue.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG[3];
  const StatusIcon = statusConfig.icon;
  const PriorityIcon = priorityConfig.icon;

  const hasDependencies =
    (issue.dependencies && issue.dependencies.length > 0) || (issue.blockedBy && issue.blockedBy.length > 0);
  const hasLabels = issue.labels && issue.labels.length > 0;
  const hasEvents = issue.events && issue.events.length > 0;
  const hasComments = issue.comments && issue.comments.length > 0;
  const hasDueDate = issue.due_at || issue.defer_until;
  const assigneeLabel = formatIssueAssignee(issue.assignee);
  const isIssuePinned = Boolean(issue.pinned);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      return;
    }

    if (isDeleteConfirmationOpen) {
      onCancelDelete();
      return;
    }

    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent size="detail" surface="deep">
        {/* Header */}
        <SheetHeader variant="detail">
          <Stack variant="panelHeader">
            <Stack variant="navTextBlock">
              <Stack variant="issueRowHeader">
                <Text variant="monoMuted" title={issue.id}>
                  {issue.id}
                </Text>
                {issue.project && <Pill>{issue.project}</Pill>}
              </Stack>
              {editingField === "title" ? (
                <Stack variant="row">
                  <Input
                    type="text"
                    variant="title"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={saveField}
                    autoFocus
                  />
                </Stack>
              ) : (
                <SheetTitle
                  tone="primary"
                  size="lg"
                  align="left"
                  interaction="editable"
                  onClick={() => onUpdateField && startEditing("title", issue.title)}
                >
                  {issue.title}
                  {onUpdateField && <Icon icon={Pencil} size="xs" />}
                </SheetTitle>
              )}
            </Stack>
          </Stack>
        </SheetHeader>

        {/* Controls */}
        <Stack variant="sidebarHeader">
          <Stack variant="spaciousSection">
            <Stack variant="rowWide">
              <Stack variant="row">
                {/* Status Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger variant="status" size="sm" tone={getStatusButtonTone(issue.status)}>
                    <Icon icon={StatusIcon} />
                    {statusConfig.label}
                    <Icon icon={ChevronDown} size="xs" tone="muted" />
                  </DropdownMenuTrigger>
                  <DropdownMenuPositioner align="start">
                    <DropdownMenuContent>
                      {(Object.entries(STATUS_CONFIG) as StatusConfigEntry[]).map(([status, config]) => {
                        const StatusOptionIcon = config.icon;
                        return (
                          <DropdownMenuItem
                            key={status}
                            onClick={() => onUpdateStatus(status)}
                            selected={issue.status === status}
                          >
                            <Icon icon={StatusOptionIcon} tone={config.iconTone} />
                            {config.label}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenuPositioner>
                </DropdownMenu>

                {/* Priority Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger variant="surface" size="sm">
                    <Icon icon={PriorityIcon} tone={priorityConfig.iconTone} />
                    {priorityConfig.label}
                    <Icon icon={ChevronDown} size="xs" tone="muted" />
                  </DropdownMenuTrigger>
                  <DropdownMenuPositioner align="start">
                    <DropdownMenuContent>
                      {(Object.entries(PRIORITY_CONFIG) as PriorityConfigEntry[]).map(([priority, config]) => {
                        const PriorityOptionIcon = config.icon;
                        return (
                          <DropdownMenuItem
                            key={priority}
                            onClick={() => onUpdatePriority(Number(priority))}
                            selected={issue.priority === Number(priority)}
                          >
                            <Icon icon={PriorityOptionIcon} tone={config.iconTone} />
                            {config.label}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenuPositioner>
                </DropdownMenu>
              </Stack>

              <Stack variant="row">
                {/* Pin */}
                {onTogglePin && (
                  <Button
                    onClick={onTogglePin}
                    variant="toolbar"
                    size="sm"
                    tone="pinned"
                    isActive={isIssuePinned}
                    title={isIssuePinned ? "Unpin issue" : "Pin issue"}
                  >
                    <Icon icon={isIssuePinned ? PinOff : Pin} />
                  </Button>
                )}

                {/* Delete */}
                <Button onClick={onRequestDelete} aria-expanded={isDeleteConfirmationOpen} variant="danger" size="sm">
                  <Icon icon={Trash2} />
                  Delete
                </Button>
              </Stack>
            </Stack>

            {isDeleteConfirmationOpen && (
              <Panel role="alert" variant="destructive">
                <Stack variant="settingsRow">
                  <Icon icon={AlertTriangle} tone="danger" />
                  <Stack variant="spaciousSection">
                    <div>
                      <Text as="div" variant="navTitleStrong">
                        Delete this issue?
                      </Text>
                      <Text as="p" variant="muted">
                        This action cannot be undone.
                      </Text>
                    </div>
                    <Stack variant="row">
                      <Button onClick={onCancelDelete} variant="outline" size="sm">
                        Cancel
                      </Button>
                      <Button onClick={onConfirmDelete} variant="destructive" size="sm">
                        Delete issue
                      </Button>
                    </Stack>
                  </Stack>
                </Stack>
              </Panel>
            )}
          </Stack>
        </Stack>

        {/* Content */}
        <ScrollArea layout="fill" overflow="hidden">
          <Stack variant="contentPadded">
            {/* Description */}
            {(issue.description || onUpdateField) && (
              <Stack as="section" variant="section">
                <SectionHeading
                  action={
                    onUpdateField && editingField !== "description" ? (
                      <Button
                        onClick={() => startEditing("description", issue.description || "")}
                        variant="toolbar"
                        size="icon-xs"
                        aria-label="Edit description"
                      >
                        <Icon icon={Pencil} size="xs" tone="muted" />
                      </Button>
                    ) : null
                  }
                >
                  Description
                </SectionHeading>
                {editingField === "description" ? (
                  <Stack variant="section">
                    <Textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      rows={6}
                      placeholder="Add a description..."
                    />
                    <Stack variant="actions">
                      <Button onClick={cancelEditing} variant="inline" size="xs">
                        Cancel
                      </Button>
                      <Button onClick={saveField} size="xs">
                        <Icon icon={Check} size="xs" />
                        Save
                      </Button>
                    </Stack>
                  </Stack>
                ) : issue.description ? (
                  <MarkdownContent content={issue.description} />
                ) : (
                  <Button onClick={() => startEditing("description", "")} variant="subtle" size="xs">
                    + Add description
                  </Button>
                )}
              </Stack>
            )}

            {/* Acceptance Criteria */}
            {issue.acceptance_criteria && (
              <Stack as="section" variant="section">
                <SectionHeading>Acceptance Criteria</SectionHeading>
                <MarkdownContent content={issue.acceptance_criteria} />
              </Stack>
            )}

            {/* Design */}
            {issue.design && (
              <Stack as="section" variant="section">
                <SectionHeading>Design</SectionHeading>
                <MarkdownContent content={issue.design} variant="codePanel" />
              </Stack>
            )}

            {/* Notes */}
            {(issue.notes || onUpdateField) && (
              <Stack as="section" variant="section">
                <SectionHeading
                  action={
                    onUpdateField && editingField !== "notes" ? (
                      <Button
                        onClick={() => startEditing("notes", issue.notes || "")}
                        variant="toolbar"
                        size="icon-xs"
                        aria-label="Edit notes"
                      >
                        <Icon icon={Pencil} size="xs" tone="muted" />
                      </Button>
                    ) : null
                  }
                >
                  Notes
                </SectionHeading>
                {editingField === "notes" ? (
                  <Stack variant="section">
                    <Textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      rows={4}
                      variant="compact"
                      placeholder="Add notes..."
                    />
                    <Stack variant="actions">
                      <Button onClick={cancelEditing} variant="inline" size="xs">
                        Cancel
                      </Button>
                      <Button onClick={saveField} size="xs">
                        <Icon icon={Check} size="xs" />
                        Save
                      </Button>
                    </Stack>
                  </Stack>
                ) : issue.notes ? (
                  <MarkdownContent content={issue.notes} />
                ) : (
                  <Button onClick={() => startEditing("notes", "")} variant="subtle" size="xs">
                    + Add notes
                  </Button>
                )}
              </Stack>
            )}

            {/* Labels */}
            {(hasLabels || onAddLabel) && (
              <Stack as="section" variant="section">
                <SectionHeading icon={Tag}>Labels</SectionHeading>
                <Stack variant="wrap">
                  {issue.labels?.map((label) => (
                    <Badge key={label} state={onRemoveLabel ? "removableLabel" : "label"}>
                      {label}
                      {onRemoveLabel && (
                        <Button
                          onClick={() => onRemoveLabel(label)}
                          variant="toolbar"
                          size="icon-xs"
                          aria-label={`Remove ${label}`}
                        >
                          <Icon icon={X} size="xs" />
                        </Button>
                      )}
                    </Badge>
                  ))}
                  {onAddLabel &&
                    (isAddingLabel ? (
                      <Stack variant="row">
                        <Input
                          type="text"
                          variant="compact"
                          value={newLabel}
                          onChange={(e) => setNewLabel(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newLabel.trim()) {
                              onAddLabel(newLabel.trim());
                              setNewLabel("");
                              setIsAddingLabel(false);
                            } else if (e.key === "Escape") {
                              setNewLabel("");
                              setIsAddingLabel(false);
                            }
                          }}
                          onBlur={() => {
                            if (newLabel.trim()) {
                              onAddLabel(newLabel.trim());
                            }
                            setNewLabel("");
                            setIsAddingLabel(false);
                          }}
                          autoFocus
                          placeholder="Label name..."
                        />
                      </Stack>
                    ) : (
                      <Button onClick={() => setIsAddingLabel(true)} variant="subtle" size="xs">
                        <Icon icon={Plus} size="xs" />
                        Add
                      </Button>
                    ))}
                </Stack>
              </Stack>
            )}

            {/* Due Date / Defer Until */}
            {(hasDueDate || onUpdateDueDate) && (
              <Stack as="section" variant="section">
                <SectionHeading
                  icon={Calendar}
                  action={
                    onUpdateDueDate && !isEditingDueDate ? (
                      <Button
                        onClick={() => setIsEditingDueDate(true)}
                        variant="toolbar"
                        size="icon-xs"
                        aria-label="Edit schedule"
                      >
                        <Icon icon={Pencil} size="xs" tone="muted" />
                      </Button>
                    ) : null
                  }
                >
                  Schedule
                </SectionHeading>
                <Stack variant="section">
                  {isEditingDueDate ? (
                    <Stack variant="section">
                      <Stack variant="row">
                        <Text variant="muted">Due:</Text>
                        <Input
                          type="datetime-local"
                          variant="dateTime"
                          defaultValue={issue.due_at ? new Date(issue.due_at).toISOString().slice(0, 16) : ""}
                          onChange={(e) => {
                            if (e.target.value) {
                              onUpdateDueDate?.(new Date(e.target.value).toISOString());
                            }
                          }}
                        />
                      </Stack>
                      <Stack variant="row">
                        {issue.due_at && (
                          <Button
                            onClick={() => {
                              onUpdateDueDate?.(null);
                              setIsEditingDueDate(false);
                            }}
                            variant="danger"
                            size="xs"
                          >
                            Remove
                          </Button>
                        )}
                        <Button onClick={() => setIsEditingDueDate(false)} variant="inline" size="xs">
                          Done
                        </Button>
                      </Stack>
                    </Stack>
                  ) : (
                    <>
                      {issue.due_at ? (
                        <Stack variant="row">
                          <Text variant="muted">Due:</Text>
                          <Text variant={new Date(issue.due_at) < new Date() ? "danger" : "monoSecondary"}>
                            {formatRelativeDate(issue.due_at)}
                          </Text>
                        </Stack>
                      ) : (
                        onUpdateDueDate && (
                          <Button onClick={() => setIsEditingDueDate(true)} variant="subtle" size="xs">
                            + Set due date
                          </Button>
                        )
                      )}
                    </>
                  )}
                  {issue.defer_until && (
                    <Stack variant="row">
                      <Text variant="muted">Deferred until:</Text>
                      <Text variant="monoMuted">{formatDate(issue.defer_until)}</Text>
                    </Stack>
                  )}
                </Stack>
              </Stack>
            )}

            {onLoadGitDiff && (
              <IssueGitDiffPanel
                diff={gitDiff}
                isLoading={isLoadingGitDiff}
                error={gitDiffError}
                onLoad={onLoadGitDiff}
              />
            )}

            {/* Dependencies */}
            {hasDependencies && (
              <Stack as="section" variant="section">
                <SectionHeading icon={GitBranch}>Dependencies</SectionHeading>
                <Stack variant="cardList">
                  {/* Blocked By */}
                  {issue.blockedBy && issue.blockedBy.length > 0 && (
                    <Stack variant="section">
                      <Text variant="danger">Blocked by:</Text>
                      <Stack variant="list">
                        {issue.blockedBy.map((dep) => (
                          <Button
                            key={dep.depends_on_id}
                            onClick={() => onSelectIssue?.(dep.depends_on_id)}
                            variant="blockedDependency"
                            size="dependency"
                          >
                            <Icon icon={Link2} size="xs" tone="danger" />
                            <Text variant="issueRowId" wrap="truncate" title={dep.depends_on_id}>
                              {dep.depends_on_id}
                            </Text>
                            <Text variant="body" wrap="truncate">
                              {dep.title || "Unknown"}
                            </Text>
                            {dep.status && (
                              <Badge state={dep.status === "closed" ? "statusClosed" : "secondary"}>{dep.status}</Badge>
                            )}
                          </Button>
                        ))}
                      </Stack>
                    </Stack>
                  )}
                  {/* Blocks (this issue blocks) */}
                  {issue.dependencies && issue.dependencies.length > 0 && (
                    <Stack variant="section">
                      <Text variant="warning">Blocks:</Text>
                      <Stack variant="list">
                        {issue.dependencies.map((dep) => (
                          <Button
                            key={dep.issue_id}
                            onClick={() => onSelectIssue?.(dep.issue_id)}
                            variant="dependency"
                            size="dependency"
                          >
                            <Icon icon={ArrowRight} size="xs" tone="warning" />
                            <Text variant="issueRowId" wrap="truncate" title={dep.issue_id}>
                              {dep.issue_id}
                            </Text>
                            <Text variant="body" wrap="truncate">
                              {dep.title || "Unknown"}
                            </Text>
                            {dep.status && (
                              <Badge state={dep.status === "closed" ? "statusClosed" : "secondary"}>{dep.status}</Badge>
                            )}
                          </Button>
                        ))}
                      </Stack>
                    </Stack>
                  )}
                </Stack>
              </Stack>
            )}

            {/* Events Timeline */}
            {hasEvents && (
              <Stack as="section" variant="section">
                <SectionHeading icon={History}>Activity</SectionHeading>
                <Stack variant="section">
                  {issue.events!.slice(0, 10).map((event) => (
                    <Stack key={event.id} variant="settingsRow">
                      <TimelineDot />
                      <Stack variant="navTextBlock">
                        <Text variant="body">{formatEventDescription(event)}</Text>
                        {event.comment && <Text variant="muted">- {event.comment}</Text>}
                      </Stack>
                      <Text variant="monoMuted">
                        {new Date(event.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                    </Stack>
                  ))}
                  {issue.events!.length > 10 && (
                    <Text as="div" variant="muted" align="center">
                      +{issue.events!.length - 10} more events
                    </Text>
                  )}
                </Stack>
              </Stack>
            )}

            {/* Comments */}
            {hasComments && (
              <Stack as="section" variant="section">
                <SectionHeading icon={MessageCircle}>Comments ({issue.comments!.length})</SectionHeading>
                <Stack variant="cardList">
                  {issue.comments!.map((comment) => (
                    <Panel key={comment.id} variant="subtle">
                      <Stack variant="rowWide">
                        <Text variant="statHeader">{comment.author}</Text>
                        <Text variant="monoMuted">
                          {new Date(comment.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </Stack>
                      <MarkdownContent content={comment.text} />
                    </Panel>
                  ))}
                </Stack>
              </Stack>
            )}

            <Separator />

            {/* Metadata */}
            <Stack as="section" variant="spaciousSection">
              <SectionHeading>Details</SectionHeading>

              <Stack variant="fieldGrid">
                <div>
                  <Text variant="muted">Type</Text>
                  <Text as="div" variant="monoSecondary">
                    {issue.issue_type || "task"}
                  </Text>
                </div>
                <div>
                  <Text variant="muted">Assignee</Text>
                  <Text as="div" variant="body">
                    {assigneeLabel}
                  </Text>
                </div>
                <div>
                  <Text variant="muted">Created</Text>
                  <Text as="div" variant="monoSecondary">
                    {formatDate(issue.created_at)}
                  </Text>
                </div>
                <div>
                  <Text variant="muted">Updated</Text>
                  <Text as="div" variant="monoSecondary">
                    {formatDate(issue.updated_at)}
                  </Text>
                </div>
                {issue.closed_at && (
                  <div>
                    <Text variant="muted">Closed</Text>
                    <Text as="div" variant="monoSecondary">
                      {formatDate(issue.closed_at)}
                    </Text>
                  </div>
                )}
              </Stack>
            </Stack>

            {/* Full ID */}
            <Stack as="section" variant="section">
              <SectionHeading>Issue ID</SectionHeading>
              <Text as="code" variant="monoMuted">
                {issue.id}
              </Text>
            </Stack>
          </Stack>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
