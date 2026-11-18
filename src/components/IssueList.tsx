import { useState, useMemo, type JSX } from "react";
import {
  List,
  LayoutList,
  Filter,
  Columns3,
  Circle,
  Clock,
  CheckCircle2,
  Ban,
  PauseCircle,
  Tag,
  X,
} from "lucide-react";
import type { ISsue, ViewMode, StatusFilter, IssueStatus, IProject } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Icon,
  KanbanColumnPanel,
  KanbanIssueCard,
  Panel,
  Pill,
  PriorityBar,
  SearchInput,
  Stack,
  StatusCount,
  Text,
} from "@/components/ui/appPrimitives";
import { IssueRow } from "./IssueRow";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  DropdownMenuPositioner,
} from "@/components/ui/dropdown-menu";
import { CreateIssueDialog } from "./CreateIssueDialog";

type KanbanColumn = {
  status: IssueStatus;
  label: string;
  icon: typeof Circle;
  tone: IssueStatus;
};

const KANBAN_COLUMNS: KanbanColumn[] = [
  { status: "open", label: "Open", icon: Circle, tone: "open" },
  {
    status: "in_progress",
    label: "In Progress",
    icon: Clock,
    tone: "in_progress",
  },
  { status: "blocked", label: "Blocked", icon: Ban, tone: "blocked" },
  { status: "deferred", label: "Deferred", icon: PauseCircle, tone: "deferred" },
  { status: "closed", label: "Closed", icon: CheckCircle2, tone: "closed" },
];

const STATUS_FILTERS: StatusFilter[] = ["all", "open", "in_progress", "ready", "blocked", "overdue", "closed"];

const STATUS_DROPDOWN_FILTERS: StatusFilter[] = ["all", "open", "in_progress", "closed"];

type StatusLabelKey = StatusFilter | IssueStatus;

const STATUS_LABELS: Record<StatusLabelKey, string> = {
  all: "All",
  open: "Open",
  in_progress: "In Progress",
  blocked: "Blocked",
  deferred: "Deferred",
  ready: "Ready",
  overdue: "Overdue",
  closed: "Closed",
};

type StatusFilterButtonTone = "default" | "accent" | "progress" | "ready" | "overdue" | "blocked";
type SectionLabelVariant = "sectionLabelOpen" | "sectionLabelProgress" | "sectionLabelBlocked" | "sectionLabelDeferred" | "sectionLabelClosed";

interface IStatusFilterCountProps {
  status: StatusFilter;
  count: number;
}

interface IIssueSectionProps {
  status: IssueStatus;
  issues: ISsue[];
  viewMode: ViewMode;
  focusedIssueId?: string;
  onSelectIssue: (issue: ISsue) => void;
}

function getStatusFilterButtonTone(status: StatusFilter): StatusFilterButtonTone {
  if (status === "all" || status === "open") {
    return "accent";
  }

  if (status === "in_progress") {
    return "progress";
  }

  if (status === "ready" || status === "overdue" || status === "blocked") {
    return status;
  }

  return "default";
}

function StatusFilterCount({ status, count }: IStatusFilterCountProps): JSX.Element {
  if (status === "all") {
    return <Text variant="monoMuted">{count}</Text>;
  }

  return <StatusCount status={status} count={count} />;
}

function sectionLabelVariant(status: IssueStatus): SectionLabelVariant {
  if (status === "open") {
    return "sectionLabelOpen";
  }

  if (status === "in_progress") {
    return "sectionLabelProgress";
  }

  if (status === "blocked") {
    return "sectionLabelBlocked";
  }

  if (status === "deferred") {
    return "sectionLabelDeferred";
  }

  return "sectionLabelClosed";
}

function IssueSection({
  status,
  issues,
  viewMode,
  focusedIssueId,
  onSelectIssue,
}: IIssueSectionProps): JSX.Element | null {
  if (issues.length === 0) {
    return null;
  }

  return (
    <Stack>
      <Panel variant="issueSectionHeader">
        <Text variant={sectionLabelVariant(status)}>{STATUS_LABELS[status]}</Text>
        <Text variant="monoMuted"> {issues.length}</Text>
      </Panel>
      {issues.map((issue) => (
        <IssueRow
          key={issue.id}
          issue={issue}
          viewMode={viewMode}
          onClick={() => onSelectIssue(issue)}
          isFocused={focusedIssueId === issue.id}
        />
      ))}
    </Stack>
  );
}

interface ISsueListProps {
  issues: ISsue[];
  selectedProject: string | null;
  onSelectIssue: (issue: ISsue) => void;
  onMoveIssue?: (issue: ISsue, newStatus: IssueStatus) => void;
  isLoading?: boolean;
  focusedIndex?: number;
  projects?: IProject[];
  onIssueCreated?: () => void;
}

export function IssueList({
  issues,
  selectedProject,
  onSelectIssue,
  onMoveIssue,
  isLoading,
  focusedIndex = -1,
  projects = [],
  onIssueCreated,
}: ISsueListProps): JSX.Element {
  const [viewMode, setViewMode] = useState<ViewMode>("comfortable");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [labelFilters, setLabelFilters] = useState<string[]>([]);
  const [draggedIssue, setDraggedIssue] = useState<ISsue | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<IssueStatus | null>(null);

  // Extract unique labels from all issues
  const allLabels = useMemo(() => {
    const labelSet = new Set<string>();
    issues.forEach((issue) => {
      if (issue.labels) {
        issue.labels.forEach((label) => labelSet.add(label));
      }
    });
    return Array.from(labelSet).sort();
  }, [issues]);

  const toggleLabelFilter = (label: string) => {
    setLabelFilters((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]));
  };

  const clearLabelFilters = () => setLabelFilters([]);

  // Helper to check if issue is overdue
  const isOverdue = (issue: ISsue) => {
    if (!issue.due_at || issue.status === "closed") return false;
    return new Date(issue.due_at) < new Date();
  };

  // Filter issues
  const filteredIssues = issues.filter((issue) => {
    // Special filters
    if (statusFilter === "ready") {
      if (!issue.isReady) return false;
    } else if (statusFilter === "overdue") {
      if (!isOverdue(issue)) return false;
    } else if (statusFilter !== "all" && issue.status !== statusFilter) {
      return false;
    }

    // Label filter - issue must have ALL selected labels
    if (labelFilters.length > 0) {
      if (!issue.labels) return false;
      const issueLabels = new Set(issue.labels);
      if (!labelFilters.every((label) => issueLabels.has(label))) return false;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        issue.title.toLowerCase().includes(query) ||
        issue.id.toLowerCase().includes(query) ||
        issue.description?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Group by status
  const openIssues = filteredIssues.filter((i) => i.status === "open");
  const inProgressIssues = filteredIssues.filter((i) => i.status === "in_progress");
  const blockedIssues = filteredIssues.filter((i) => i.status === "blocked");
  const deferredIssues = filteredIssues.filter((i) => i.status === "deferred");
  const closedIssues = filteredIssues.filter((i) => i.status === "closed");

  const statusCounts: Record<StatusFilter, number> = {
    all: issues.length,
    open: issues.filter((i) => i.status === "open").length,
    in_progress: issues.filter((i) => i.status === "in_progress").length,
    blocked: issues.filter((i) => i.status === "blocked").length,
    ready: issues.filter((i) => i.isReady).length,
    overdue: issues.filter((i) => isOverdue(i)).length,
    closed: issues.filter((i) => i.status === "closed").length,
  };

  const focusedIssueId = focusedIndex >= 0 ? issues[focusedIndex]?.id : undefined;

  // Get issues for a kanban column
  const getColumnIssues = (status: IssueStatus) => {
    return filteredIssues.filter((i) => i.status === status);
  };

  return (
    <Stack variant="page" testId="IssueList">
      {/* Header */}
      <Stack as="header" variant="issueListHeader">
        <Stack variant="issueListHeaderContent">
          <Stack variant="rowWide">
            {/* Title */}
            <Stack>
              <Text as="h1" variant="title">{selectedProject || "All Projects"}</Text>
              <Text as="p" variant="monoMuted">{filteredIssues.length} issues</Text>
            </Stack>

            {/* Actions */}
            <Stack variant="row">
              {/* Search */}
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search issues..."
                shortcutHint="/"
              />

              {/* Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  variant="outline"
                  size="default"
                  tone="accent"
                >
                  <Icon icon={Filter} dataIcon="inline-start" />
                  {STATUS_LABELS[statusFilter]}
                </DropdownMenuTrigger>
                <DropdownMenuPositioner align="end">
                  <DropdownMenuContent width="narrow">
                    {STATUS_DROPDOWN_FILTERS.map((status) => (
                      <DropdownMenuItem
                        key={status}
                        selected={statusFilter === status}
                        onClick={() => setStatusFilter(status)}
                      >
                        {STATUS_LABELS[status]}
                        <DropdownMenuShortcut>{statusCounts[status]}</DropdownMenuShortcut>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenuPositioner>
              </DropdownMenu>

              {/* View Toggle */}
              <Stack variant="viewToggle">
                <Button
                  onClick={() => setViewMode("compact")}
                  variant="segment"
                  size="sm"
                  isActive={viewMode === "compact"}
                  title="Compact view"
                >
                  <Icon icon={List} dataIcon="inline-start" />
                </Button>
                <Button
                  onClick={() => setViewMode("comfortable")}
                  variant="segment"
                  size="sm"
                  isActive={viewMode === "comfortable"}
                  title="Comfortable view"
                >
                  <Icon icon={LayoutList} dataIcon="inline-start" />
                </Button>
                <Button
                  onClick={() => setViewMode("kanban")}
                  variant="segment"
                  size="sm"
                  isActive={viewMode === "kanban"}
                  title="Kanban view"
                >
                  <Icon icon={Columns3} dataIcon="inline-start" />
                </Button>
              </Stack>

              {/* Create Issue */}
              {projects.length > 0 && onIssueCreated && (
                <CreateIssueDialog
                  key={selectedProject ?? "__ALL__"}
                  project={selectedProject}
                  projects={projects}
                  onCreated={onIssueCreated}
                />
              )}
            </Stack>
          </Stack>
        </Stack>

        {/* Status Tabs */}
        <Stack variant="statusTabs">
          {STATUS_FILTERS.map((status) => (
            <Button
              key={status}
              onClick={() => setStatusFilter(status)}
              variant="tab"
              size="tab"
              tone={getStatusFilterButtonTone(status)}
              isActive={statusFilter === status}
            >
              {STATUS_LABELS[status]}
              <StatusFilterCount status={status} count={statusCounts[status]} />
            </Button>
          ))}
        </Stack>

        {/* Label Filters */}
        {allLabels.length > 0 && (
          <Stack variant="labelFilterBar">
            <Icon icon={Tag} size="xs" tone="muted" />
            <Stack variant="labelFilterItems">
              {allLabels.map((label) => (
                <Badge
                  key={label}
                  isAction
                  state={labelFilters.includes(label) ? "filterActive" : "filter"}
                  aria-pressed={labelFilters.includes(label)}
                  onClick={() => toggleLabelFilter(label)}
                >
                  {label}
                </Badge>
              ))}
            </Stack>
            {labelFilters.length > 0 && (
              <Button
                onClick={clearLabelFilters}
                variant="inline"
                size="xs"
              >
                <Icon icon={X} size="xs" dataIcon="inline-start" />
                Clear
              </Button>
            )}
          </Stack>
        )}
      </Stack>

      {/* Issue List / Kanban */}
      {viewMode === "kanban" ? (
        <Stack variant="kanbanViewport">
          <Stack variant="kanbanBoard">
            {KANBAN_COLUMNS.map((column) => {
              const columnIssues = getColumnIssues(column.status);
              const ColumnIcon = column.icon;
              const isDropTarget = dragOverColumn === column.status && draggedIssue?.status !== column.status;
              return (
                <KanbanColumnPanel
                  key={column.status}
                  isDropTarget={isDropTarget}
                  onDragOver={(e) => {
                    if (onMoveIssue) {
                      e.preventDefault();
                      setDragOverColumn(column.status);
                    }
                  }}
                  onDragLeave={() => setDragOverColumn(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverColumn(null);
                    if (draggedIssue && onMoveIssue && draggedIssue.status !== column.status) {
                      onMoveIssue(draggedIssue, column.status);
                    }
                    setDraggedIssue(null);
                  }}
                >
                  {/* Column Header */}
                  <Stack variant="kanbanColumnHeader">
                    <Icon icon={ColumnIcon} tone={column.tone} />
                    <Text variant="navTitleStrong">{column.label}</Text>
                    <Text variant="kanbanCount">{columnIssues.length}</Text>
                  </Stack>
                  {/* Column Content */}
                  <ScrollArea layout="fill">
                    <Stack variant="kanbanColumnContent">
                      {columnIssues.map((issue) => (
                        <KanbanIssueCard
                          key={issue.id}
                          draggable={!!onMoveIssue}
                          isMovable={!!onMoveIssue}
                          isDragging={draggedIssue?.id === issue.id}
                          onDragStart={() => {
                            setDraggedIssue(issue);
                          }}
                          onDragEnd={() => {
                            setDraggedIssue(null);
                            setDragOverColumn(null);
                          }}
                          onClick={() => onSelectIssue(issue)}
                        >
                          <Stack variant="kanbanCardContent">
                            <Stack variant="priorityFull">
                              <PriorityBar priority={issue.priority} fullHeight />
                            </Stack>
                            <Stack variant="kanbanCardBody">
                              <Text as="div" variant="monoMuted" wrap="truncate" title={issue.id}>
                                {issue.id}
                              </Text>
                              <Text as="div" variant="kanbanTitle">{issue.title}</Text>
                              {issue.project && (
                                <Stack variant="kanbanProject">
                                  <Pill variant="compact">{issue.project}</Pill>
                                </Stack>
                              )}
                            </Stack>
                          </Stack>
                        </KanbanIssueCard>
                      ))}
                      {columnIssues.length === 0 && (
                        <Text as="div" variant={isDropTarget ? "kanbanDropHint" : "kanbanEmpty"}>
                          {isDropTarget ? "Drop here" : "No issues"}
                        </Text>
                      )}
                    </Stack>
                  </ScrollArea>
                </KanbanColumnPanel>
              );
            })}
          </Stack>
        </Stack>
      ) : (
        <ScrollArea layout="fill">
          {isLoading ? (
            <Stack variant="loadingState">
              <Text variant="muted">Loading issues...</Text>
            </Stack>
          ) : filteredIssues.length === 0 ? (
            <Stack variant="emptyState">
              <Panel variant="emptyIcon">
                <Icon icon={List} size="xl" tone="muted" />
              </Panel>
              <Text as="div" variant="body">No issues found</Text>
              <Text as="div" variant="muted">
                {searchQuery ? "Try a different search term" : "Create your first issue to get started"}
              </Text>
            </Stack>
          ) : statusFilter === "all" ? (
            <Stack>
              <IssueSection
                status="in_progress"
                issues={inProgressIssues}
                viewMode={viewMode}
                focusedIssueId={focusedIssueId}
                onSelectIssue={onSelectIssue}
              />
              <IssueSection
                status="blocked"
                issues={blockedIssues}
                viewMode={viewMode}
                focusedIssueId={focusedIssueId}
                onSelectIssue={onSelectIssue}
              />
              <IssueSection
                status="open"
                issues={openIssues}
                viewMode={viewMode}
                focusedIssueId={focusedIssueId}
                onSelectIssue={onSelectIssue}
              />
              <IssueSection
                status="deferred"
                issues={deferredIssues}
                viewMode={viewMode}
                focusedIssueId={focusedIssueId}
                onSelectIssue={onSelectIssue}
              />
              <IssueSection
                status="closed"
                issues={closedIssues}
                viewMode={viewMode}
                focusedIssueId={focusedIssueId}
                onSelectIssue={onSelectIssue}
              />
            </Stack>
          ) : (
            <Stack>
              {filteredIssues.map((issue) => (
                <IssueRow
                  key={issue.id}
                  issue={issue}
                  viewMode={viewMode}
                  onClick={() => onSelectIssue(issue)}
                  isFocused={focusedIssueId === issue.id}
                />
              ))}
            </Stack>
          )}
        </ScrollArea>
      )}
    </Stack>
  );
}
