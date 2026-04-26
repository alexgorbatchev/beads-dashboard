import type {
  Project,
  Issue,
  Dependency,
  IssueEvent,
  Comment,
  ProjectStats,
  AggregatedStats,
  LabelCount,
} from '../types'

const DEFAULT_API_BASE = '/api'
const apiBase = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE

function getWebSocketUrl(): string {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws`
}

interface ApiResponse<T> {
  ok: boolean
  error?: string
  projects?: T
  issues?: T
  issue?: T
  project?: T
  labels?: T
  stats?: T
  events?: T
  comments?: T
  dependencies?: Dependency[]
  blockedBy?: Dependency[]
}

// ============================================================================
// Projects
// ============================================================================

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${apiBase}/projects`)
  const data: ApiResponse<Project[]> = await res.json()
  if (!data.ok) throw new Error(data.error || 'Failed to fetch projects')
  return data.projects || []
}

// ============================================================================
// Issues
// ============================================================================

export async function fetchIssues(params?: {
  project?: string
  status?: string
  limit?: number
  label?: string
}): Promise<Issue[]> {
  const searchParams = new URLSearchParams()
  if (params?.project) searchParams.set('project', params.project)
  if (params?.status) searchParams.set('status', params.status)
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.label) searchParams.set('label', params.label)

  const url = `${apiBase}/issues?${searchParams.toString()}`
  const res = await fetch(url)
  const data: ApiResponse<Issue[]> = await res.json()
  if (!data.ok) throw new Error(data.error || 'Failed to fetch issues')
  return data.issues || []
}

export async function fetchIssue(
  project: string,
  issueId: string,
  options?: { includeRelated?: boolean }
): Promise<Issue> {
  const params = options?.includeRelated ? '?includeRelated=true' : ''
  const res = await fetch(
    `${apiBase}/projects/${encodeURIComponent(project)}/issues/${encodeURIComponent(issueId)}${params}`
  )
  const data: ApiResponse<Issue> = await res.json()
  if (!data.ok) throw new Error(data.error || 'Failed to fetch issue')
  return data.issue as Issue
}

export async function updateIssue(
  project: string,
  issueId: string,
  updates: Partial<
    Pick<Issue, 'status' | 'priority' | 'title' | 'description' | 'notes' | 'due_at'>
  >
): Promise<void> {
  const res = await fetch(
    `${apiBase}/projects/${encodeURIComponent(project)}/issues/${encodeURIComponent(issueId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }
  )
  const data: ApiResponse<void> = await res.json()
  if (!data.ok) throw new Error(data.error || 'Failed to update issue')
}

export async function createIssue(
  project: string,
  issue: {
    id: string
    title: string
    description?: string
    priority?: number
    issue_type?: string
    assignee?: string
  }
): Promise<void> {
  const res = await fetch(`${apiBase}/projects/${encodeURIComponent(project)}/issues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(issue),
  })
  const data: ApiResponse<void> = await res.json()
  if (!data.ok) throw new Error(data.error || 'Failed to create issue')
}

export async function deleteIssue(project: string, issueId: string): Promise<void> {
  const res = await fetch(
    `${apiBase}/projects/${encodeURIComponent(project)}/issues/${encodeURIComponent(issueId)}`,
    { method: 'DELETE' }
  )
  const data: ApiResponse<void> = await res.json()
  if (!data.ok) throw new Error(data.error || 'Failed to delete issue')
}

// ============================================================================
// Ready & Blocked Issues
// ============================================================================

export async function fetchReadyIssues(project?: string): Promise<Issue[]> {
  const url = project
    ? `${apiBase}/projects/${encodeURIComponent(project)}/ready`
    : `${apiBase}/ready`
  const res = await fetch(url)
  const data: ApiResponse<Issue[]> = await res.json()
  if (!data.ok) throw new Error(data.error || 'Failed to fetch ready issues')
  return data.issues || []
}

export async function fetchBlockedIssues(project: string): Promise<Issue[]> {
  const res = await fetch(`${apiBase}/projects/${encodeURIComponent(project)}/blocked`)
  const data: ApiResponse<Issue[]> = await res.json()
  if (!data.ok) throw new Error(data.error || 'Failed to fetch blocked issues')
  return data.issues || []
}

// ============================================================================
// Dependencies
// ============================================================================

export async function fetchIssueDependencies(
  project: string,
  issueId: string
): Promise<{ dependencies: Dependency[]; blockedBy: Dependency[] }> {
  const res = await fetch(
    `${apiBase}/projects/${encodeURIComponent(project)}/issues/${encodeURIComponent(issueId)}/dependencies`
  )
  const data: ApiResponse<void> = await res.json()
  if (!data.ok) throw new Error(data.error || 'Failed to fetch dependencies')
  return {
    dependencies: data.dependencies || [],
    blockedBy: data.blockedBy || [],
  }
}

// ============================================================================
// Events & Comments
// ============================================================================

export async function fetchIssueEvents(project: string, issueId: string): Promise<IssueEvent[]> {
  const res = await fetch(
    `${apiBase}/projects/${encodeURIComponent(project)}/issues/${encodeURIComponent(issueId)}/events`
  )
  const data: ApiResponse<IssueEvent[]> = await res.json()
  if (!data.ok) throw new Error(data.error || 'Failed to fetch events')
  return data.events || []
}

export async function fetchIssueComments(project: string, issueId: string): Promise<Comment[]> {
  const res = await fetch(
    `${apiBase}/projects/${encodeURIComponent(project)}/issues/${encodeURIComponent(issueId)}/comments`
  )
  const data: ApiResponse<Comment[]> = await res.json()
  if (!data.ok) throw new Error(data.error || 'Failed to fetch comments')
  return data.comments || []
}

// ============================================================================
// Labels
// ============================================================================

export async function fetchProjectLabels(project: string): Promise<LabelCount[]> {
  const res = await fetch(`${apiBase}/projects/${encodeURIComponent(project)}/labels`)
  const data: ApiResponse<LabelCount[]> = await res.json()
  if (!data.ok) throw new Error(data.error || 'Failed to fetch labels')
  return data.labels || []
}

export async function addIssueLabel(
  project: string,
  issueId: string,
  label: string
): Promise<void> {
  const res = await fetch(
    `${apiBase}/projects/${encodeURIComponent(project)}/issues/${encodeURIComponent(issueId)}/labels`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label }),
    }
  )
  const data: ApiResponse<void> = await res.json()
  if (!data.ok) throw new Error(data.error || 'Failed to add label')
}

export async function removeIssueLabel(
  project: string,
  issueId: string,
  label: string
): Promise<void> {
  const res = await fetch(
    `${apiBase}/projects/${encodeURIComponent(project)}/issues/${encodeURIComponent(issueId)}/labels/${encodeURIComponent(label)}`,
    { method: 'DELETE' }
  )
  const data: ApiResponse<void> = await res.json()
  if (!data.ok) throw new Error(data.error || 'Failed to remove label')
}

// ============================================================================
// Pin
// ============================================================================

export async function toggleIssuePin(project: string, issueId: string): Promise<void> {
  const res = await fetch(
    `${apiBase}/projects/${encodeURIComponent(project)}/issues/${encodeURIComponent(issueId)}/pin`,
    { method: 'POST' }
  )
  const data: ApiResponse<void> = await res.json()
  if (!data.ok) throw new Error(data.error || 'Failed to toggle pin')
}

// ============================================================================
// Statistics
// ============================================================================

export async function fetchProjectStats(project: string): Promise<ProjectStats> {
  const res = await fetch(`${apiBase}/projects/${encodeURIComponent(project)}/stats`)
  const data: ApiResponse<ProjectStats> = await res.json()
  if (!data.ok) throw new Error(data.error || 'Failed to fetch stats')
  return data.stats as ProjectStats
}

export async function fetchAggregatedStats(): Promise<AggregatedStats> {
  const res = await fetch(`${apiBase}/stats`)
  const data: ApiResponse<AggregatedStats> = await res.json()
  if (!data.ok) throw new Error(data.error || 'Failed to fetch stats')
  return data.stats as AggregatedStats
}

// ============================================================================
// WebSocket connection for real-time updates
// ============================================================================

export function createWebSocket(onMessage: (data: unknown) => void): WebSocket {
  const ws = new WebSocket(getWebSocketUrl())

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      onMessage(data)
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }

  ws.onerror = (error) => {
    console.error('WebSocket error:', error)
  }

  return ws
}
