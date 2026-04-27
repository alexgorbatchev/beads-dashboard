export interface IProject {
  name: string;
  path: string;
  database: string;
  issueCount?: number;
}

export interface IConfiguredProjectSetting {
  path: string;
  resolvedPath: string;
  name: string | null;
  issueCount?: number;
  isValid: boolean;
  error: string | null;
}

export interface IProjectSettings {
  exists: boolean;
  projects: IConfiguredProjectSetting[];
}

export interface ISsue {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: number;
  issue_type: string;
  assignee: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  project?: string;
  // Extended fields
  design?: string;
  acceptance_criteria?: string;
  notes?: string;
  estimated_minutes?: number | null;
  due_at?: string | null;
  defer_until?: string | null;
  close_reason?: string;
  pinned?: number;
  external_ref?: string | null;
  // Related data
  labels?: string[];
  dependencies?: IDependency[];
  blockedBy?: IDependency[];
  events?: ISsueEvent[];
  comments?: IComment[];
  isReady?: boolean;
  blockedByCount?: number;
}

export type IssueStatus = "open" | "in_progress" | "closed" | "blocked" | "deferred";

export interface IDependency {
  issue_id: string;
  depends_on_id: string;
  type: DependencyType;
  created_at: string;
  created_by: string;
  // Joined issue info
  title?: string;
  status?: string;
  priority?: number;
}

export type DependencyType = "blocks" | "related" | "parent-child" | "discovered-from";

export interface ISsueEvent {
  id: number;
  issue_id: string;
  event_type: string;
  actor: string;
  old_value: string | null;
  new_value: string | null;
  comment: string | null;
  created_at: string;
}

export interface IComment {
  id: number;
  issue_id: string;
  author: string;
  text: string;
  created_at: string;
}

export interface IProjectStats {
  total: number;
  open: number;
  in_progress: number;
  closed: number;
  blocked: number;
  ready: number;
  overdue: number;
  byPriority: Record<number, number>;
  byType: Record<string, number>;
}

export interface IAggregatedStats {
  total: number;
  open: number;
  in_progress: number;
  closed: number;
  blocked: number;
  ready: number;
  overdue: number;
  byProject: Record<string, { total: number; open: number; ready: number }>;
}

export interface ILabelCount {
  label: string;
  count: number;
}

export type ViewMode = "compact" | "comfortable" | "kanban";
export type StatusFilter = "all" | "open" | "in_progress" | "closed" | "ready" | "blocked" | "overdue";

export type IssueUpdate = Partial<Pick<ISsue, "status" | "priority" | "title" | "description" | "notes" | "due_at">>;

export interface IFetchIssuesParams {
  project?: string;
  status?: string;
  limit?: number;
  label?: string;
}

export interface ICreateIssueData {
  id: string;
  title: string;
  description?: string;
  priority?: number;
  issue_type?: string;
  assignee?: string;
}

export interface IDependenciesResponse {
  dependencies: IDependency[];
  blockedBy: IDependency[];
}
