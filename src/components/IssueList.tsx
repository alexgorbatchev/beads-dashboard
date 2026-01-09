import { useState, useMemo } from 'react'
import {
  Search,
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
} from 'lucide-react'
import type { Issue, ViewMode, StatusFilter, IssueStatus, Project } from '../types'
import { Badge } from '@/components/ui/badge'
import { IssueRow } from './IssueRow'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuPositioner,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { CreateIssueDialog } from './CreateIssueDialog'

const KANBAN_COLUMNS: { status: IssueStatus; label: string; icon: typeof Circle; color: string }[] =
  [
    { status: 'open', label: 'Open', icon: Circle, color: 'var(--color-status-open)' },
    {
      status: 'in_progress',
      label: 'In Progress',
      icon: Clock,
      color: 'var(--color-status-progress)',
    },
    { status: 'blocked', label: 'Blocked', icon: Ban, color: '#ef4444' },
    { status: 'deferred', label: 'Deferred', icon: PauseCircle, color: '#6b7280' },
    { status: 'closed', label: 'Closed', icon: CheckCircle2, color: 'var(--color-status-closed)' },
  ]

interface IssueListProps {
  issues: Issue[]
  selectedProject: string | null
  onSelectIssue: (issue: Issue) => void
  onMoveIssue?: (issue: Issue, newStatus: IssueStatus) => void
  isLoading?: boolean
  focusedIndex?: number
  projects?: Project[]
  onIssueCreated?: () => void
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
}: IssueListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('comfortable')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [labelFilters, setLabelFilters] = useState<string[]>([])
  const [draggedIssue, setDraggedIssue] = useState<Issue | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<IssueStatus | null>(null)

  // Extract unique labels from all issues
  const allLabels = useMemo(() => {
    const labelSet = new Set<string>()
    issues.forEach((issue) => {
      if (issue.labels) {
        issue.labels.forEach((label) => labelSet.add(label))
      }
    })
    return Array.from(labelSet).sort()
  }, [issues])

  const toggleLabelFilter = (label: string) => {
    setLabelFilters((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    )
  }

  const clearLabelFilters = () => setLabelFilters([])

  // Helper to check if issue is overdue
  const isOverdue = (issue: Issue) => {
    if (!issue.due_at || issue.status === 'closed') return false
    return new Date(issue.due_at) < new Date()
  }

  // Filter issues
  const filteredIssues = issues.filter((issue) => {
    // Special filters
    if (statusFilter === 'ready') {
      if (!issue.isReady) return false
    } else if (statusFilter === 'overdue') {
      if (!isOverdue(issue)) return false
    } else if (statusFilter !== 'all' && issue.status !== statusFilter) {
      return false
    }

    // Label filter - issue must have ALL selected labels
    if (labelFilters.length > 0) {
      if (!issue.labels) return false
      const issueLabels = new Set(issue.labels)
      if (!labelFilters.every((label) => issueLabels.has(label))) return false
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        issue.title.toLowerCase().includes(query) ||
        issue.id.toLowerCase().includes(query) ||
        issue.description?.toLowerCase().includes(query)
      )
    }
    return true
  })

  // Group by status
  const openIssues = filteredIssues.filter((i) => i.status === 'open')
  const inProgressIssues = filteredIssues.filter((i) => i.status === 'in_progress')
  const blockedIssues = filteredIssues.filter((i) => i.status === 'blocked')
  const deferredIssues = filteredIssues.filter((i) => i.status === 'deferred')
  const closedIssues = filteredIssues.filter((i) => i.status === 'closed')

  const statusCounts: Record<StatusFilter, number> = {
    all: issues.length,
    open: issues.filter((i) => i.status === 'open').length,
    in_progress: issues.filter((i) => i.status === 'in_progress').length,
    blocked: issues.filter((i) => i.status === 'blocked').length,
    ready: issues.filter((i) => i.isReady).length,
    overdue: issues.filter((i) => isOverdue(i)).length,
    closed: issues.filter((i) => i.status === 'closed').length,
  }

  // Get issues for a kanban column
  const getColumnIssues = (status: IssueStatus) => {
    return filteredIssues.filter((i) => i.status === status)
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-void">
      {/* Header */}
      <header className="border-b border-border bg-deep/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Title */}
            <div>
              <h1 className="text-lg font-semibold text-primary">
                {selectedProject || 'All Projects'}
              </h1>
              <p className="text-xs text-muted font-mono mt-0.5">{filteredIssues.length} issues</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  placeholder="Search issues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 h-9 pl-9 pr-3 bg-surface border border-border rounded-lg text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 kbd">/</span>
              </div>

              {/* Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="h-9 px-3 flex items-center gap-2 bg-surface border border-border rounded-lg text-sm hover:bg-elevated transition-colors">
                  <Filter className="w-4 h-4" />
                  <span className="capitalize">
                    {statusFilter === 'all' ? 'All' : statusFilter.replace('_', ' ')}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuPositioner align="end">
                  <DropdownMenuContent className="w-40">
                    <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                      All{' '}
                      <span className="ml-auto font-mono text-xs text-muted">
                        {statusCounts.all}
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('open')}>
                      Open{' '}
                      <span className="ml-auto font-mono text-xs text-muted">
                        {statusCounts.open}
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('in_progress')}>
                      In Progress{' '}
                      <span className="ml-auto font-mono text-xs text-muted">
                        {statusCounts.in_progress}
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('closed')}>
                      Closed{' '}
                      <span className="ml-auto font-mono text-xs text-muted">
                        {statusCounts.closed}
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenuPositioner>
              </DropdownMenu>

              {/* View Toggle */}
              <div className="view-toggle">
                <button
                  onClick={() => setViewMode('compact')}
                  className={cn(viewMode === 'compact' && 'active')}
                  title="Compact view"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('comfortable')}
                  className={cn(viewMode === 'comfortable' && 'active')}
                  title="Comfortable view"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={cn(viewMode === 'kanban' && 'active')}
                  title="Kanban view"
                >
                  <Columns3 className="w-4 h-4" />
                </button>
              </div>

              {/* Create Issue */}
              {projects.length > 0 && onIssueCreated && (
                <CreateIssueDialog
                  project={selectedProject}
                  projects={projects}
                  onCreated={onIssueCreated}
                />
              )}
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="px-4 flex gap-1 overflow-x-auto">
          {(
            [
              'all',
              'open',
              'in_progress',
              'ready',
              'blocked',
              'overdue',
              'closed',
            ] as StatusFilter[]
          ).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                statusFilter === status
                  ? status === 'ready'
                    ? 'border-green-500 text-green-500'
                    : status === 'overdue'
                      ? 'border-red-500 text-red-500'
                      : status === 'blocked'
                        ? 'border-red-400 text-red-400'
                        : 'border-accent text-accent'
                  : 'border-transparent text-muted hover:text-secondary'
              )}
            >
              {status === 'all'
                ? 'All'
                : status === 'in_progress'
                  ? 'In Progress'
                  : status === 'ready'
                    ? 'Ready'
                    : status === 'overdue'
                      ? 'Overdue'
                      : status.charAt(0).toUpperCase() + status.slice(1)}
              <span
                className={cn(
                  'ml-1.5 font-mono opacity-60',
                  status === 'ready' && statusCounts[status] > 0 && 'text-green-500',
                  status === 'overdue' && statusCounts[status] > 0 && 'text-red-500'
                )}
              >
                {statusCounts[status]}
              </span>
            </button>
          ))}
        </div>

        {/* Label Filters */}
        {allLabels.length > 0 && (
          <div className="px-4 py-2 border-t border-border/50 flex items-center gap-2 overflow-x-auto">
            <Tag className="w-3 h-3 text-muted shrink-0" />
            <div className="flex gap-1.5 flex-wrap">
              {allLabels.map((label) => (
                <Badge
                  key={label}
                  variant={labelFilters.includes(label) ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer text-xs transition-colors',
                    labelFilters.includes(label)
                      ? 'bg-accent text-white hover:bg-accent/80'
                      : 'hover:bg-surface'
                  )}
                  onClick={() => toggleLabelFilter(label)}
                >
                  {label}
                </Badge>
              ))}
            </div>
            {labelFilters.length > 0 && (
              <button
                onClick={clearLabelFilters}
                className="ml-auto flex items-center gap-1 text-xs text-muted hover:text-secondary transition-colors shrink-0"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
        )}
      </header>

      {/* Issue List / Kanban */}
      {viewMode === 'kanban' ? (
        <div className="flex-1 min-h-0 overflow-x-auto">
          <div className="flex gap-4 p-4 h-full min-w-max">
            {KANBAN_COLUMNS.map((column) => {
              const columnIssues = getColumnIssues(column.status)
              const Icon = column.icon
              const isDropTarget =
                dragOverColumn === column.status && draggedIssue?.status !== column.status
              return (
                <div
                  key={column.status}
                  className={cn(
                    'w-72 flex flex-col bg-surface/30 rounded-lg transition-all',
                    isDropTarget && 'ring-2 ring-accent/50 bg-accent/5'
                  )}
                  onDragOver={(e) => {
                    if (onMoveIssue) {
                      e.preventDefault()
                      setDragOverColumn(column.status)
                    }
                  }}
                  onDragLeave={() => setDragOverColumn(null)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragOverColumn(null)
                    if (draggedIssue && onMoveIssue && draggedIssue.status !== column.status) {
                      onMoveIssue(draggedIssue, column.status)
                    }
                    setDraggedIssue(null)
                  }}
                >
                  {/* Column Header */}
                  <div className="p-3 border-b border-border flex items-center gap-2">
                    <Icon className="w-4 h-4" style={{ color: column.color }} />
                    <span className="text-sm font-medium text-primary">{column.label}</span>
                    <span className="ml-auto text-xs font-mono text-muted">
                      {columnIssues.length}
                    </span>
                  </div>
                  {/* Column Content */}
                  <ScrollArea className="flex-1 min-h-0">
                    <div className="p-2 space-y-2">
                      {columnIssues.map((issue) => (
                        <div
                          key={issue.id}
                          draggable={!!onMoveIssue}
                          onDragStart={() => {
                            setDraggedIssue(issue)
                          }}
                          onDragEnd={() => {
                            setDraggedIssue(null)
                            setDragOverColumn(null)
                          }}
                          onClick={() => onSelectIssue(issue)}
                          className={cn(
                            'w-full p-3 bg-deep rounded-lg text-left hover:bg-elevated transition-colors border border-transparent hover:border-border cursor-pointer',
                            onMoveIssue && 'cursor-grab active:cursor-grabbing',
                            draggedIssue?.id === issue.id && 'opacity-50'
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <div
                              className="w-1 h-full min-h-[40px] rounded-full shrink-0"
                              style={{
                                backgroundColor:
                                  issue.priority === 0
                                    ? 'var(--color-priority-urgent)'
                                    : issue.priority === 1
                                      ? 'var(--color-priority-high)'
                                      : issue.priority === 2
                                        ? 'var(--color-priority-medium)'
                                        : issue.priority === 3
                                          ? 'var(--color-priority-low)'
                                          : 'var(--color-muted)',
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-mono text-xs text-muted mb-1 truncate" title={issue.id}>
                                {issue.id}
                              </div>
                              <div className="text-sm text-primary line-clamp-2">{issue.title}</div>
                              {issue.project && (
                                <div className="mt-2">
                                  <span className="text-xs font-mono text-muted bg-surface px-1.5 py-0.5 rounded">
                                    {issue.project}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {columnIssues.length === 0 && (
                        <div
                          className={cn(
                            'text-xs text-muted text-center py-8',
                            isDropTarget && 'text-accent'
                          )}
                        >
                          {isDropTarget ? 'Drop here' : 'No issues'}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-sm text-muted">Loading issues...</div>
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center mb-3">
                <List className="w-6 h-6 text-muted" />
              </div>
              <div className="text-sm text-secondary">No issues found</div>
              <div className="text-xs text-muted mt-1">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Create your first issue to get started'}
              </div>
            </div>
          ) : statusFilter === 'all' ? (
            <div>
              {/* In Progress Section */}
              {inProgressIssues.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-surface/30 border-b border-border">
                    <span className="text-xs font-medium text-[var(--color-status-progress)] uppercase tracking-wider">
                      In Progress
                    </span>
                    <span className="ml-2 font-mono text-xs text-muted">
                      {inProgressIssues.length}
                    </span>
                  </div>
                  {inProgressIssues.map((issue) => (
                    <IssueRow
                      key={issue.id}
                      issue={issue}
                      viewMode={viewMode}
                      onClick={() => onSelectIssue(issue)}
                      isFocused={focusedIndex >= 0 && issues[focusedIndex]?.id === issue.id}
                    />
                  ))}
                </div>
              )}

              {/* Blocked Section */}
              {blockedIssues.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-surface/30 border-b border-border">
                    <span className="text-xs font-medium text-red-500 uppercase tracking-wider">
                      Blocked
                    </span>
                    <span className="ml-2 font-mono text-xs text-muted">
                      {blockedIssues.length}
                    </span>
                  </div>
                  {blockedIssues.map((issue) => (
                    <IssueRow
                      key={issue.id}
                      issue={issue}
                      viewMode={viewMode}
                      onClick={() => onSelectIssue(issue)}
                      isFocused={focusedIndex >= 0 && issues[focusedIndex]?.id === issue.id}
                    />
                  ))}
                </div>
              )}

              {/* Open Section */}
              {openIssues.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-surface/30 border-b border-border">
                    <span className="text-xs font-medium text-[var(--color-status-open)] uppercase tracking-wider">
                      Open
                    </span>
                    <span className="ml-2 font-mono text-xs text-muted">{openIssues.length}</span>
                  </div>
                  {openIssues.map((issue) => (
                    <IssueRow
                      key={issue.id}
                      issue={issue}
                      viewMode={viewMode}
                      onClick={() => onSelectIssue(issue)}
                      isFocused={focusedIndex >= 0 && issues[focusedIndex]?.id === issue.id}
                    />
                  ))}
                </div>
              )}

              {/* Deferred Section */}
              {deferredIssues.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-surface/30 border-b border-border">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deferred
                    </span>
                    <span className="ml-2 font-mono text-xs text-muted">
                      {deferredIssues.length}
                    </span>
                  </div>
                  {deferredIssues.map((issue) => (
                    <IssueRow
                      key={issue.id}
                      issue={issue}
                      viewMode={viewMode}
                      onClick={() => onSelectIssue(issue)}
                      isFocused={focusedIndex >= 0 && issues[focusedIndex]?.id === issue.id}
                    />
                  ))}
                </div>
              )}

              {/* Closed Section */}
              {closedIssues.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-surface/30 border-b border-border">
                    <span className="text-xs font-medium text-[var(--color-status-closed)] uppercase tracking-wider">
                      Closed
                    </span>
                    <span className="ml-2 font-mono text-xs text-muted">{closedIssues.length}</span>
                  </div>
                  {closedIssues.map((issue) => (
                    <IssueRow
                      key={issue.id}
                      issue={issue}
                      viewMode={viewMode}
                      onClick={() => onSelectIssue(issue)}
                      isFocused={focusedIndex >= 0 && issues[focusedIndex]?.id === issue.id}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {filteredIssues.map((issue) => (
                <IssueRow
                  key={issue.id}
                  issue={issue}
                  viewMode={viewMode}
                  onClick={() => onSelectIssue(issue)}
                  isFocused={focusedIndex >= 0 && issues[focusedIndex]?.id === issue.id}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      )}
    </div>
  )
}
