export interface Project {
  name: string
  path: string
  database: string
  issueCount?: number
}

export interface ConfiguredProjectSetting {
  path: string
  resolvedPath: string
  name: string | null
  issueCount?: number
  isValid: boolean
  error: string | null
}

export interface ProjectSettings {
  exists: boolean
  projects: ConfiguredProjectSetting[]
}

export interface Issue {
  id: string
  title: string
  description: string
  status: IssueStatus
  priority: number
  issue_type: string
  assignee: string | null
  created_at: string
  updated_at: string
  closed_at: string | null
  project?: string
  // Extended fields
  design?: string
  acceptance_criteria?: string
  notes?: string
  estimated_minutes?: number | null
  due_at?: string | null
  defer_until?: string | null
  close_reason?: string
  pinned?: number
  external_ref?: string | null
  // Related data
  labels?: string[]
  dependencies?: Dependency[]
  blockedBy?: Dependency[]
  events?: IssueEvent[]
  comments?: Comment[]
  isReady?: boolean
  blockedByCount?: number
}

export type IssueStatus = 'open' | 'in_progress' | 'closed' | 'blocked' | 'deferred'

export interface Dependency {
  issue_id: string
  depends_on_id: string
  type: DependencyType
  created_at: string
  created_by: string
  // Joined issue info
  title?: string
  status?: string
  priority?: number
}

export type DependencyType = 'blocks' | 'related' | 'parent-child' | 'discovered-from'

export interface IssueEvent {
  id: number
  issue_id: string
  event_type: string
  actor: string
  old_value: string | null
  new_value: string | null
  comment: string | null
  created_at: string
}

export interface Comment {
  id: number
  issue_id: string
  author: string
  text: string
  created_at: string
}

export interface ProjectStats {
  total: number
  open: number
  in_progress: number
  closed: number
  blocked: number
  ready: number
  overdue: number
  byPriority: Record<number, number>
  byType: Record<string, number>
}

export interface AggregatedStats {
  total: number
  open: number
  in_progress: number
  closed: number
  blocked: number
  ready: number
  overdue: number
  byProject: Record<string, { total: number; open: number; ready: number }>
}

export interface LabelCount {
  label: string
  count: number
}

export type ViewMode = 'compact' | 'comfortable' | 'kanban'
export type StatusFilter =
  | 'all'
  | 'open'
  | 'in_progress'
  | 'closed'
  | 'ready'
  | 'blocked'
  | 'overdue'

// Priority constants
export const PRIORITY_LABELS: Record<number, string> = {
  0: 'Critical',
  1: 'High',
  2: 'Medium',
  3: 'Low',
  4: 'Backlog',
}

export const PRIORITY_COLORS: Record<number, string> = {
  0: 'var(--color-priority-urgent)',
  1: 'var(--color-priority-high)',
  2: 'var(--color-priority-medium)',
  3: 'var(--color-priority-low)',
  4: 'var(--color-muted)',
}

// Issue type labels
export const ISSUE_TYPE_LABELS: Record<string, string> = {
  bug: 'Bug',
  feature: 'Feature',
  task: 'Task',
  epic: 'Epic',
  chore: 'Chore',
}
