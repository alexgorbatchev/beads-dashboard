import { useState } from "react";
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
import type { ISsue, IssueStatus, ISsueEvent } from "../types";
import { cn } from "@/lib/utils";
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
import { MarkdownContent } from "@/components/MarkdownContent";

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
  onDelete: () => void;
  onTogglePin?: () => void;
  onSelectIssue?: (issueId: string) => void;
}

interface IStatusConfigItem {
  icon: typeof Circle;
  label: string;
  color: string;
  bg: string;
}

type StatusConfigEntry = [IssueStatus, IStatusConfigItem];
type PriorityConfigEntry = [string, IPriorityConfigItem];

const STATUS_CONFIG: Record<IssueStatus, IStatusConfigItem> = {
  open: {
    icon: Circle,
    label: "Open",
    color: "text-[var(--color-status-open)]",
    bg: "bg-[var(--color-status-open)]/10",
  },
  in_progress: {
    icon: Clock,
    label: "In Progress",
    color: "text-[var(--color-status-progress)]",
    bg: "bg-[var(--color-status-progress)]/10",
  },
  closed: {
    icon: CheckCircle2,
    label: "Closed",
    color: "text-[var(--color-status-closed)]",
    bg: "bg-[var(--color-status-closed)]/10",
  },
  blocked: {
    icon: Ban,
    label: "Blocked",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  deferred: {
    icon: PauseCircle,
    label: "Deferred",
    color: "text-gray-500",
    bg: "bg-gray-500/10",
  },
};

interface IPriorityConfigItem {
  icon: typeof AlertTriangle;
  label: string;
  color: string;
}

const PRIORITY_CONFIG: Record<number, IPriorityConfigItem> = {
  0: {
    icon: AlertTriangle,
    label: "Critical",
    color: "text-[var(--color-priority-urgent)]",
  },
  1: {
    icon: AlertTriangle,
    label: "High",
    color: "text-[var(--color-priority-high)]",
  },
  2: {
    icon: ArrowUp,
    label: "Medium",
    color: "text-[var(--color-priority-medium)]",
  },
  3: {
    icon: Minus,
    label: "Low",
    color: "text-[var(--color-priority-low)]",
  },
  4: {
    icon: ArrowDown,
    label: "Backlog",
    color: "text-muted",
  },
};

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
  onDelete,
  onTogglePin,
  onSelectIssue,
}: IIssueDetailProps) {
  type EditField = "title" | "description" | "notes";
  const [editingField, setEditingField] = useState<EditField | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
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

  const handleDelete = () => {
    if (isDeleting) {
      onDelete();
      setIsDeleting(false);
    } else {
      setIsDeleting(true);
      // Reset after 3 seconds
      setTimeout(() => setIsDeleting(false), 3000);
    }
  };

  const hasDependencies =
    (issue.dependencies && issue.dependencies.length > 0) || (issue.blockedBy && issue.blockedBy.length > 0);
  const hasLabels = issue.labels && issue.labels.length > 0;
  const hasEvents = issue.events && issue.events.length > 0;
  const hasComments = issue.comments && issue.comments.length > 0;
  const hasDueDate = issue.due_at || issue.defer_until;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-[500px] sm:max-w-[500px] bg-deep border-l border-border p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="p-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-xs text-muted" title={issue.id}>
                  {issue.id}
                </span>
                {issue.project && (
                  <span className="text-xs font-mono text-muted bg-surface px-2 py-0.5 rounded">{issue.project}</span>
                )}
              </div>
              {editingField === "title" ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={saveField}
                    autoFocus
                    className="flex-1 text-lg font-semibold text-primary bg-surface border border-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
              ) : (
                <SheetTitle
                  className="text-lg font-semibold text-primary text-left group cursor-pointer hover:text-accent"
                  onClick={() => onUpdateField && startEditing("title", issue.title)}
                >
                  {issue.title}
                  {onUpdateField && <Pencil className="inline-block w-3 h-3 ml-2 opacity-0 group-hover:opacity-50" />}
                </SheetTitle>
              )}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-surface transition-colors">
              <X className="w-4 h-4 text-muted" />
            </button>
          </div>
        </SheetHeader>

        {/* Controls */}
        <div className="p-4 border-b border-border flex items-center gap-3">
          {/* Status Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "h-8 px-3 flex items-center gap-2 rounded-lg text-sm font-medium transition-colors",
                statusConfig.bg,
                statusConfig.color,
              )}
            >
              <StatusIcon className="w-4 h-4" />
              {statusConfig.label}
              <ChevronDown className="w-3 h-3 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuPositioner align="start">
              <DropdownMenuContent>
                {(Object.entries(STATUS_CONFIG) as StatusConfigEntry[]).map(([status, config]) => {
                  const Icon = config.icon;
                  return (
                    <DropdownMenuItem
                      key={status}
                      onClick={() => onUpdateStatus(status)}
                      className={cn("gap-2", issue.status === status && "bg-surface")}
                    >
                      <Icon className={cn("w-4 h-4", config.color)} />
                      {config.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenuPositioner>
          </DropdownMenu>

          {/* Priority Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 px-3 flex items-center gap-2 bg-surface rounded-lg text-sm transition-colors hover:bg-elevated">
              <PriorityIcon className={cn("w-4 h-4", priorityConfig.color)} />
              {priorityConfig.label}
              <ChevronDown className="w-3 h-3 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuPositioner align="start">
              <DropdownMenuContent>
                {(Object.entries(PRIORITY_CONFIG) as PriorityConfigEntry[]).map(([priority, config]) => {
                  const Icon = config.icon;
                  return (
                    <DropdownMenuItem
                      key={priority}
                      onClick={() => onUpdatePriority(Number(priority))}
                      className={cn("gap-2", issue.priority === Number(priority) && "bg-surface")}
                    >
                      <Icon className={cn("w-4 h-4", config.color)} />
                      {config.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenuPositioner>
          </DropdownMenu>

          <div className="flex-1" />

          {/* Pin */}
          {onTogglePin && (
            <button
              onClick={onTogglePin}
              className={cn(
                "h-8 px-3 flex items-center gap-2 rounded-lg text-sm transition-colors",
                issue.pinned ? "bg-accent/20 text-accent" : "text-muted hover:text-accent hover:bg-accent/10",
              )}
              title={issue.pinned ? "Unpin issue" : "Pin issue"}
            >
              {issue.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </button>
          )}

          {/* Delete */}
          <button
            onClick={handleDelete}
            className={cn(
              "h-8 px-3 flex items-center gap-2 rounded-lg text-sm transition-colors",
              isDeleting ? "bg-destructive text-white" : "text-muted hover:text-destructive hover:bg-destructive/10",
            )}
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? "Confirm?" : "Delete"}
          </button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* Description */}
            {(issue.description || onUpdateField) && (
              <div>
                <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                  Description
                  {onUpdateField && editingField !== "description" && (
                    <button
                      onClick={() => startEditing("description", issue.description || "")}
                      className="p-1 rounded hover:bg-surface transition-colors"
                    >
                      <Pencil className="w-3 h-3 text-muted hover:text-secondary" />
                    </button>
                  )}
                </h3>
                {editingField === "description" ? (
                  <div className="space-y-2">
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      rows={6}
                      className="w-full text-sm text-primary bg-surface border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                      placeholder="Add a description..."
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={cancelEditing}
                        className="px-3 py-1.5 text-xs text-muted hover:text-secondary transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveField}
                        className="px-3 py-1.5 text-xs bg-accent text-white rounded hover:bg-accent/80 transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        Save
                      </button>
                    </div>
                  </div>
                ) : issue.description ? (
                  <MarkdownContent content={issue.description} />
                ) : (
                  <button
                    onClick={() => startEditing("description", "")}
                    className="text-sm text-muted hover:text-secondary transition-colors"
                  >
                    + Add description
                  </button>
                )}
              </div>
            )}

            {/* Acceptance Criteria */}
            {issue.acceptance_criteria && (
              <div>
                <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Acceptance Criteria</h3>
                <MarkdownContent content={issue.acceptance_criteria} />
              </div>
            )}

            {/* Design */}
            {issue.design && (
              <div>
                <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Design</h3>
                <MarkdownContent
                  content={issue.design}
                  className="text-xs font-mono bg-surface p-3 rounded-lg overflow-x-auto"
                />
              </div>
            )}

            {/* Notes */}
            {(issue.notes || onUpdateField) && (
              <div>
                <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                  Notes
                  {onUpdateField && editingField !== "notes" && (
                    <button
                      onClick={() => startEditing("notes", issue.notes || "")}
                      className="p-1 rounded hover:bg-surface transition-colors"
                    >
                      <Pencil className="w-3 h-3 text-muted hover:text-secondary" />
                    </button>
                  )}
                </h3>
                {editingField === "notes" ? (
                  <div className="space-y-2">
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      rows={4}
                      className="w-full text-sm text-primary bg-surface border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                      placeholder="Add notes..."
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={cancelEditing}
                        className="px-3 py-1.5 text-xs text-muted hover:text-secondary transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveField}
                        className="px-3 py-1.5 text-xs bg-accent text-white rounded hover:bg-accent/80 transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        Save
                      </button>
                    </div>
                  </div>
                ) : issue.notes ? (
                  <MarkdownContent content={issue.notes} />
                ) : (
                  <button
                    onClick={() => startEditing("notes", "")}
                    className="text-sm text-muted hover:text-secondary transition-colors"
                  >
                    + Add notes
                  </button>
                )}
              </div>
            )}

            {/* Labels */}
            {(hasLabels || onAddLabel) && (
              <div>
                <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Tag className="w-3 h-3" />
                  Labels
                </h3>
                <div className="flex flex-wrap gap-2 items-center">
                  {issue.labels?.map((label) => (
                    <Badge key={label} variant="secondary" className={cn("text-xs", onRemoveLabel && "group pr-1")}>
                      {label}
                      {onRemoveLabel && (
                        <button
                          onClick={() => onRemoveLabel(label)}
                          className="ml-1 p-0.5 rounded-full hover:bg-surface transition-colors opacity-60 hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                  {onAddLabel &&
                    (isAddingLabel ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
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
                          className="w-24 h-6 px-2 text-xs bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent/50"
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsAddingLabel(true)}
                        className="h-6 px-2 flex items-center gap-1 text-xs text-muted hover:text-secondary border border-dashed border-border rounded hover:border-accent/50 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Add
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Due Date / Defer Until */}
            {(hasDueDate || onUpdateDueDate) && (
              <div>
                <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  Schedule
                  {onUpdateDueDate && !isEditingDueDate && (
                    <button
                      onClick={() => setIsEditingDueDate(true)}
                      className="p-1 rounded hover:bg-surface transition-colors"
                    >
                      <Pencil className="w-3 h-3 text-muted hover:text-secondary" />
                    </button>
                  )}
                </h3>
                <div className="space-y-2">
                  {isEditingDueDate ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted">Due:</span>
                        <input
                          type="datetime-local"
                          defaultValue={issue.due_at ? new Date(issue.due_at).toISOString().slice(0, 16) : ""}
                          onChange={(e) => {
                            if (e.target.value) {
                              onUpdateDueDate?.(new Date(e.target.value).toISOString());
                            }
                          }}
                          className="h-7 px-2 text-xs bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent/50"
                        />
                      </div>
                      <div className="flex gap-2">
                        {issue.due_at && (
                          <button
                            onClick={() => {
                              onUpdateDueDate?.(null);
                              setIsEditingDueDate(false);
                            }}
                            className="text-xs text-red-500 hover:text-red-400 transition-colors"
                          >
                            Remove
                          </button>
                        )}
                        <button
                          onClick={() => setIsEditingDueDate(false)}
                          className="text-xs text-muted hover:text-secondary transition-colors"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {issue.due_at ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted">Due:</span>
                          <span
                            className={cn(
                              "text-sm font-mono",
                              new Date(issue.due_at) < new Date() ? "text-red-500" : "text-secondary",
                            )}
                          >
                            {formatRelativeDate(issue.due_at)}
                          </span>
                        </div>
                      ) : (
                        onUpdateDueDate && (
                          <button
                            onClick={() => setIsEditingDueDate(true)}
                            className="text-sm text-muted hover:text-secondary transition-colors"
                          >
                            + Set due date
                          </button>
                        )
                      )}
                    </>
                  )}
                  {issue.defer_until && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted">Deferred until:</span>
                      <span className="text-sm font-mono text-gray-400">{formatDate(issue.defer_until)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dependencies */}
            {hasDependencies && (
              <div>
                <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                  <GitBranch className="w-3 h-3" />
                  Dependencies
                </h3>
                <div className="space-y-3">
                  {/* Blocked By */}
                  {issue.blockedBy && issue.blockedBy.length > 0 && (
                    <div>
                      <div className="text-xs text-red-500 mb-1">Blocked by:</div>
                      <div className="space-y-1">
                        {issue.blockedBy.map((dep) => (
                          <button
                            key={dep.depends_on_id}
                            onClick={() => onSelectIssue?.(dep.depends_on_id)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 bg-red-500/10 rounded text-left hover:bg-red-500/20 transition-colors"
                          >
                            <Link2 className="w-3 h-3 text-red-500 shrink-0" />
                            <span className="font-mono text-xs text-muted truncate max-w-24" title={dep.depends_on_id}>
                              {dep.depends_on_id}
                            </span>
                            <span className="text-sm text-secondary truncate flex-1">{dep.title || "Unknown"}</span>
                            {dep.status && (
                              <span
                                className={cn(
                                  "text-xs px-1.5 py-0.5 rounded",
                                  dep.status === "closed" ? "bg-green-500/20 text-green-500" : "bg-surface text-muted",
                                )}
                              >
                                {dep.status}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Blocks (this issue blocks) */}
                  {issue.dependencies && issue.dependencies.length > 0 && (
                    <div>
                      <div className="text-xs text-amber-500 mb-1">Blocks:</div>
                      <div className="space-y-1">
                        {issue.dependencies.map((dep) => (
                          <button
                            key={dep.issue_id}
                            onClick={() => onSelectIssue?.(dep.issue_id)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 bg-surface rounded text-left hover:bg-elevated transition-colors"
                          >
                            <ArrowRight className="w-3 h-3 text-amber-500 shrink-0" />
                            <span className="font-mono text-xs text-muted truncate max-w-24" title={dep.issue_id}>
                              {dep.issue_id}
                            </span>
                            <span className="text-sm text-secondary truncate flex-1">{dep.title || "Unknown"}</span>
                            {dep.status && (
                              <span
                                className={cn(
                                  "text-xs px-1.5 py-0.5 rounded",
                                  dep.status === "closed" ? "bg-green-500/20 text-green-500" : "bg-surface text-muted",
                                )}
                              >
                                {dep.status}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Events Timeline */}
            {hasEvents && (
              <div>
                <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                  <History className="w-3 h-3" />
                  Activity
                </h3>
                <div className="space-y-2">
                  {issue.events!.slice(0, 10).map((event) => (
                    <div key={event.id} className="flex items-start gap-2 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-border mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-secondary">{formatEventDescription(event)}</span>
                        {event.comment && <span className="text-muted ml-1">- {event.comment}</span>}
                      </div>
                      <span className="text-muted shrink-0 font-mono">
                        {new Date(event.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  ))}
                  {issue.events!.length > 10 && (
                    <div className="text-xs text-muted text-center pt-1">+{issue.events!.length - 10} more events</div>
                  )}
                </div>
              </div>
            )}

            {/* Comments */}
            {hasComments && (
              <div>
                <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                  <MessageCircle className="w-3 h-3" />
                  Comments ({issue.comments!.length})
                </h3>
                <div className="space-y-3">
                  {issue.comments!.map((comment) => (
                    <div key={comment.id} className="bg-surface rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-secondary">{comment.author}</span>
                        <span className="text-xs text-muted font-mono">
                          {new Date(comment.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <MarkdownContent content={comment.text} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Metadata */}
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-muted uppercase tracking-wider">Details</h3>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted">Type</span>
                  <div className="font-mono text-xs text-secondary mt-1">{issue.issue_type || "task"}</div>
                </div>
                <div>
                  <span className="text-muted">Assignee</span>
                  <div className="text-secondary mt-1">{issue.assignee || "Unassigned"}</div>
                </div>
                <div>
                  <span className="text-muted">Created</span>
                  <div className="font-mono text-xs text-secondary mt-1">{formatDate(issue.created_at)}</div>
                </div>
                <div>
                  <span className="text-muted">Updated</span>
                  <div className="font-mono text-xs text-secondary mt-1">{formatDate(issue.updated_at)}</div>
                </div>
                {issue.closed_at && (
                  <div className="col-span-2">
                    <span className="text-muted">Closed</span>
                    <div className="font-mono text-xs text-secondary mt-1">{formatDate(issue.closed_at)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Full ID */}
            <div>
              <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Issue ID</h3>
              <code className="text-xs font-mono text-muted bg-surface px-2 py-1 rounded block overflow-x-auto">
                {issue.id}
              </code>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
