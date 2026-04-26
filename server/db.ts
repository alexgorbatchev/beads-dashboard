import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

// Directories to skip during recursive scanning
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.nuxt',
  'coverage',
  '__pycache__',
  '.venv',
  'venv',
])

export interface Project {
  name: string
  path: string
  database: string
  issueCount?: number
}

export interface Issue {
  id: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'closed' | 'blocked' | 'deferred'
  priority: number
  issue_type: string
  assignee: string | null
  created_at: string
  updated_at: string
  closed_at: string | null
  deleted_at?: string | null
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
  // Computed/joined fields
  labels?: string[]
  dependencies?: Dependency[]
  blockedBy?: Dependency[]
  events?: IssueEvent[]
  comments?: Comment[]
  isReady?: boolean
  blockedByCount?: number
}

export interface Dependency {
  issue_id: string
  depends_on_id: string
  type: 'blocks' | 'related' | 'parent-child' | 'discovered-from'
  created_at: string
  created_by: string
  // Joined issue info
  title?: string
  status?: string
  priority?: number
}

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

interface JsonlIssueRecord {
  id: string
  title?: string
  description?: string
  status?: string
  priority?: number
  issue_type?: string
  assignee?: string | null
  created_at?: string
  updated_at?: string
  closed_at?: string | null
  deleted_at?: string | null
  design?: string
  acceptance_criteria?: string
  notes?: string
  estimated_minutes?: number | null
  due_at?: string | null
  defer_until?: string | null
  close_reason?: string
  pinned?: number
  external_ref?: string | null
  metadata?: {
    gitea_labels?: string[]
  }
  dependency_count?: number
  dependent_count?: number
}

interface JsonlInteractionRecord {
  id: string
  kind: string
  created_at: string
  actor: string
  issue_id: string
  extra?: {
    field?: string
    old_value?: string
    new_value?: string
    comment?: string
  }
}

// Cache for database connections
const dbCache = new Map<string, Database.Database>()

function supportsSqliteStorage(storagePath: string): boolean {
  return storagePath.endsWith('.db')
}

export function supportsProjectWrites(storagePath: string): boolean {
  return supportsSqliteStorage(storagePath)
}

function getJsonlIssuesFilePath(storagePath: string): string {
  return path.join(storagePath, 'issues.jsonl')
}

function getJsonlInteractionsFilePath(storagePath: string): string {
  return path.join(storagePath, 'interactions.jsonl')
}

function isJsonlIssueRecord(value: unknown): value is JsonlIssueRecord {
  return typeof value === 'object' && value !== null && 'id' in value
}

function isJsonlInteractionRecord(value: unknown): value is JsonlInteractionRecord {
  return typeof value === 'object' && value !== null && 'id' in value && 'issue_id' in value
}

function readJsonlFile(filePath: string): string[] {
  try {
    const content = fs.readFileSync(filePath, 'utf8').trim()
    if (!content) {
      return []
    }

    return content.split('\n').filter(Boolean)
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return []
    }

    throw error
  }
}

function readJsonlIssues(storagePath: string): JsonlIssueRecord[] {
  return readJsonlFile(getJsonlIssuesFilePath(storagePath))
    .map((line) => JSON.parse(line) as unknown)
    .filter(isJsonlIssueRecord)
}

function readJsonlInteractions(storagePath: string): JsonlInteractionRecord[] {
  return readJsonlFile(getJsonlInteractionsFilePath(storagePath))
    .map((line) => JSON.parse(line) as unknown)
    .filter(isJsonlInteractionRecord)
}

function normalizeIssueStatus(status: string | undefined): Issue['status'] {
  if (
    status === 'open' ||
    status === 'in_progress' ||
    status === 'closed' ||
    status === 'blocked' ||
    status === 'deferred'
  ) {
    return status
  }

  return 'open'
}

function getJsonlIssueLabels(record: JsonlIssueRecord): string[] {
  return record.metadata?.gitea_labels?.filter((label) => typeof label === 'string') || []
}

function normalizeJsonlIssue(record: JsonlIssueRecord): Issue {
  const status = normalizeIssueStatus(record.status)
  const blockedByCount = record.dependency_count ?? 0

  return {
    id: record.id,
    title: record.title || record.id,
    description: record.description || '',
    status,
    priority: record.priority ?? 2,
    issue_type: record.issue_type || 'task',
    assignee: record.assignee ?? null,
    created_at: record.created_at || '',
    updated_at: record.updated_at || record.created_at || '',
    closed_at: record.closed_at ?? null,
    deleted_at: record.deleted_at,
    design: record.design,
    acceptance_criteria: record.acceptance_criteria,
    notes: record.notes,
    estimated_minutes: record.estimated_minutes,
    due_at: record.due_at,
    defer_until: record.defer_until,
    close_reason: record.close_reason,
    pinned: record.pinned ?? 0,
    external_ref: record.external_ref ?? null,
    labels: getJsonlIssueLabels(record),
    isReady: status === 'open' && blockedByCount === 0,
    blockedByCount,
  }
}

function getJsonlIssues(storagePath: string): Issue[] {
  return readJsonlIssues(storagePath)
    .map(normalizeJsonlIssue)
    .filter((issue) => issue.deleted_at == null)
}

function isBlockedIssue(issue: Issue): boolean {
  return (issue.blockedByCount ?? 0) > 0 || issue.status === 'blocked'
}

function getIssueSortValue(issue: Issue, sortBy: 'updated_at' | 'created_at' | 'priority' | 'due_at'): number {
  if (sortBy === 'priority') {
    return issue.priority
  }

  if (sortBy === 'due_at') {
    return issue.due_at ? new Date(issue.due_at).getTime() : Number.POSITIVE_INFINITY
  }

  if (sortBy === 'created_at') {
    return new Date(issue.created_at).getTime()
  }

  return new Date(issue.updated_at).getTime()
}

function sortIssues(
  issues: Issue[],
  sortBy: 'updated_at' | 'created_at' | 'priority' | 'due_at',
  sortOrder: 'asc' | 'desc'
): Issue[] {
  const direction = sortOrder === 'asc' ? 1 : -1

  return [...issues].sort((leftIssue, rightIssue) => {
    if ((leftIssue.pinned ?? 0) !== (rightIssue.pinned ?? 0)) {
      return (rightIssue.pinned ?? 0) - (leftIssue.pinned ?? 0)
    }

    const leftValue = getIssueSortValue(leftIssue, sortBy)
    const rightValue = getIssueSortValue(rightIssue, sortBy)

    if (leftValue === rightValue) {
      return 0
    }

    return leftValue > rightValue ? direction : -direction
  })
}

function getJsonlProjectIssues(
  storagePath: string,
  options: {
    status?: string
    limit?: number
    offset?: number
    includeLabels?: boolean
    onlyReady?: boolean
    onlyBlocked?: boolean
    onlyPinned?: boolean
    label?: string
    sortBy?: 'updated_at' | 'created_at' | 'priority' | 'due_at'
    sortOrder?: 'asc' | 'desc'
  } = {}
): Issue[] {
  const issues = getJsonlIssues(storagePath)
    .filter((issue) => (options.status ? issue.status === options.status : true))
    .filter((issue) => (options.onlyReady ? issue.isReady === true : true))
    .filter((issue) => (options.onlyBlocked ? isBlockedIssue(issue) : true))
    .filter((issue) => (options.onlyPinned ? issue.pinned === 1 : true))
    .filter((issue) => (options.label ? issue.labels?.includes(options.label) : true))

  const sortBy = options.sortBy || 'updated_at'
  const sortOrder = options.sortOrder || 'desc'
  const sortedIssues = sortIssues(issues, sortBy, sortOrder)
  const offset = options.offset ?? 0
  const limitedIssues = options.limit ? sortedIssues.slice(offset, offset + options.limit) : sortedIssues.slice(offset)

  if (options.includeLabels) {
    return limitedIssues
  }

  return limitedIssues.map((issue) => ({ ...issue, labels: undefined }))
}

function getJsonlIssueEvents(storagePath: string, issueId: string): IssueEvent[] {
  return readJsonlInteractions(storagePath)
    .filter((interaction) => interaction.issue_id === issueId)
    .sort((leftEvent, rightEvent) => {
      return new Date(rightEvent.created_at).getTime() - new Date(leftEvent.created_at).getTime()
    })
    .map((interaction, index) => ({
      id: index + 1,
      issue_id: interaction.issue_id,
      event_type: interaction.kind,
      actor: interaction.actor,
      old_value: interaction.extra?.old_value ?? null,
      new_value: interaction.extra?.new_value ?? null,
      comment: interaction.extra?.comment ?? interaction.extra?.field ?? null,
      created_at: interaction.created_at,
    }))
}

function getJsonlLabels(storagePath: string): { label: string; count: number }[] {
  const labelCounts = new Map<string, number>()

  for (const issue of getJsonlIssues(storagePath)) {
    for (const label of issue.labels || []) {
      labelCounts.set(label, (labelCounts.get(label) || 0) + 1)
    }
  }

  return [...labelCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((leftLabel, rightLabel) => {
      if (leftLabel.count !== rightLabel.count) {
        return rightLabel.count - leftLabel.count
      }

      return leftLabel.label.localeCompare(rightLabel.label)
    })
}

function getJsonlDetailedProjectStats(storagePath: string): ProjectStats {
  const stats: ProjectStats = {
    total: 0,
    open: 0,
    in_progress: 0,
    closed: 0,
    blocked: 0,
    ready: 0,
    overdue: 0,
    byPriority: {},
    byType: {},
  }

  const issues = getJsonlIssues(storagePath)

  for (const issue of issues) {
    stats.total += 1

    if (issue.status === 'open') stats.open += 1
    if (issue.status === 'in_progress') stats.in_progress += 1
    if (issue.status === 'closed') stats.closed += 1
    if (isBlockedIssue(issue)) stats.blocked += 1
    if (issue.isReady) stats.ready += 1

    if (issue.due_at && issue.status !== 'closed' && new Date(issue.due_at).getTime() < Date.now()) {
      stats.overdue += 1
    }

    if (issue.status !== 'closed') {
      stats.byPriority[issue.priority] = (stats.byPriority[issue.priority] || 0) + 1
      stats.byType[issue.issue_type] = (stats.byType[issue.issue_type] || 0) + 1
    }
  }

  return stats
}

/**
 * Get or create a database connection
 */
function getDb(dbPath: string): Database.Database {
  if (!dbCache.has(dbPath)) {
    const db = new Database(dbPath, { readonly: true })
    dbCache.set(dbPath, db)
  }
  return dbCache.get(dbPath)!
}

/**
 * Close all cached database connections
 */
export function closeAllDbs(): void {
  for (const db of dbCache.values()) {
    db.close()
  }
  dbCache.clear()
}

/**
 * Recursively scan a directory for .beads/ folders containing a supported beads backend
 */
export function scanForProjects(rootDir: string, maxDepth = 10): Project[] {
  const projects: Project[] = []
  const visited = new Set<string>()

  function scan(dir: string, depth: number): void {
    if (depth > maxDepth) return

    const resolved = path.resolve(dir)
    if (visited.has(resolved)) return
    visited.add(resolved)

    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(resolved, { withFileTypes: true })
    } catch {
      return
    }

    // Check if this directory has a .beads folder with a database
    const beadsDir = path.join(resolved, '.beads')
    try {
      const beadsEntries = fs.readdirSync(beadsDir, { withFileTypes: true })
      const dbFile = beadsEntries.find(
        (e) =>
          e.isFile() &&
          e.name.endsWith('.db') &&
          e.name !== 'beads.db-shm' &&
          e.name !== 'beads.db-wal'
      )
      if (dbFile) {
        const dbPath = path.join(beadsDir, dbFile.name)
        const projectName = path.basename(resolved)
        projects.push({
          name: projectName,
          path: resolved,
          database: dbPath,
        })
        return
      }

      const hasJsonlIssues = beadsEntries.some((entry) => entry.isFile() && entry.name === 'issues.jsonl')
      if (hasJsonlIssues) {
        const projectName = path.basename(resolved)
        projects.push({
          name: projectName,
          path: resolved,
          database: beadsDir,
        })
      }
    } catch {
      // No .beads directory here
    }

    // Recurse into subdirectories
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      if (entry.name.startsWith('.')) continue
      if (SKIP_DIRS.has(entry.name)) continue

      scan(path.join(resolved, entry.name), depth + 1)
    }
  }

  scan(rootDir, 0)
  return projects
}

/**
 * Get all issues from a single project database
 */
export function getProjectIssues(
  dbPath: string,
  options: {
    status?: string
    limit?: number
    offset?: number
    includeLabels?: boolean
    onlyReady?: boolean
    onlyBlocked?: boolean
    onlyPinned?: boolean
    label?: string
    sortBy?: 'updated_at' | 'created_at' | 'priority' | 'due_at'
    sortOrder?: 'asc' | 'desc'
  } = {}
): Issue[] {
  if (!supportsSqliteStorage(dbPath)) {
    return getJsonlProjectIssues(dbPath, options)
  }

  const db = getDb(dbPath)

  // Use ready_issues view if requested
  const fromClause = options.onlyReady ? 'ready_issues' : 'issues'

  let sql = `
    SELECT
      id, title, description, status, priority, issue_type, assignee,
      created_at, updated_at, closed_at, estimated_minutes, due_at,
      defer_until, close_reason, pinned, external_ref
    FROM ${fromClause}
    WHERE deleted_at IS NULL
  `

  const params: unknown[] = []

  if (options.status) {
    sql += ' AND status = ?'
    params.push(options.status)
  }

  if (options.onlyPinned) {
    sql += ' AND pinned = 1'
  }

  if (options.onlyBlocked) {
    sql += ` AND id IN (
      SELECT DISTINCT d.issue_id FROM dependencies d
      JOIN issues blocker ON d.depends_on_id = blocker.id
      WHERE d.type = 'blocks' AND blocker.status IN ('open', 'in_progress')
    )`
  }

  if (options.label) {
    sql += ' AND id IN (SELECT issue_id FROM labels WHERE label = ?)'
    params.push(options.label)
  }

  const sortBy = options.sortBy || 'updated_at'
  const sortOrder = options.sortOrder || 'desc'
  sql += ` ORDER BY pinned DESC, ${sortBy} ${sortOrder.toUpperCase()}`

  if (options.limit) {
    sql += ' LIMIT ?'
    params.push(options.limit)
    if (options.offset) {
      sql += ' OFFSET ?'
      params.push(options.offset)
    }
  }

  const stmt = db.prepare(sql)
  let issues = stmt.all(...params) as Issue[]

  // Attach labels if requested
  if (options.includeLabels) {
    const labelStmt = db.prepare('SELECT issue_id, label FROM labels')
    const allLabels = labelStmt.all() as { issue_id: string; label: string }[]
    const labelMap = new Map<string, string[]>()
    for (const { issue_id, label } of allLabels) {
      if (!labelMap.has(issue_id)) labelMap.set(issue_id, [])
      labelMap.get(issue_id)!.push(label)
    }
    issues = issues.map((issue) => ({
      ...issue,
      labels: labelMap.get(issue.id) || [],
    }))
  }

  return issues
}

/**
 * Get labels for an issue
 */
export function getIssueLabels(dbPath: string, issueId: string): string[] {
  if (!supportsSqliteStorage(dbPath)) {
    const issue = getJsonlIssues(dbPath).find((candidateIssue) => candidateIssue.id === issueId)
    return issue?.labels || []
  }

  const db = getDb(dbPath)
  const stmt = db.prepare('SELECT label FROM labels WHERE issue_id = ?')
  const rows = stmt.all(issueId) as { label: string }[]
  return rows.map((r) => r.label)
}

/**
 * Get all unique labels in a project
 */
export function getAllLabels(dbPath: string): { label: string; count: number }[] {
  if (!supportsSqliteStorage(dbPath)) {
    return getJsonlLabels(dbPath)
  }

  const db = getDb(dbPath)
  const stmt = db.prepare(`
    SELECT label, COUNT(*) as count
    FROM labels
    GROUP BY label
    ORDER BY count DESC
  `)
  return stmt.all() as { label: string; count: number }[]
}

/**
 * Get dependencies for an issue (issues this one depends on)
 */
export function getIssueDependencies(dbPath: string, issueId: string): Dependency[] {
  if (!supportsSqliteStorage(dbPath)) {
    return []
  }

  const db = getDb(dbPath)
  const stmt = db.prepare(`
    SELECT
      d.issue_id, d.depends_on_id, d.type, d.created_at, d.created_by,
      i.title, i.status, i.priority
    FROM dependencies d
    LEFT JOIN issues i ON d.depends_on_id = i.id
    WHERE d.issue_id = ?
    ORDER BY d.type, d.created_at
  `)
  return stmt.all(issueId) as Dependency[]
}

/**
 * Get issues that depend on this one (blockers)
 */
export function getIssueBlockedBy(dbPath: string, issueId: string): Dependency[] {
  if (!supportsSqliteStorage(dbPath)) {
    return []
  }

  const db = getDb(dbPath)
  const stmt = db.prepare(`
    SELECT
      d.issue_id, d.depends_on_id, d.type, d.created_at, d.created_by,
      i.title, i.status, i.priority
    FROM dependencies d
    LEFT JOIN issues i ON d.issue_id = i.id
    WHERE d.depends_on_id = ?
    ORDER BY d.type, d.created_at
  `)
  return stmt.all(issueId) as Dependency[]
}

/**
 * Get events/history for an issue
 */
export function getIssueEvents(dbPath: string, issueId: string): IssueEvent[] {
  if (!supportsSqliteStorage(dbPath)) {
    return getJsonlIssueEvents(dbPath, issueId)
  }

  const db = getDb(dbPath)
  const stmt = db.prepare(`
    SELECT id, issue_id, event_type, actor, old_value, new_value, comment, created_at
    FROM events
    WHERE issue_id = ?
    ORDER BY created_at DESC
  `)
  return stmt.all(issueId) as IssueEvent[]
}

/**
 * Get comments for an issue
 */
export function getIssueComments(dbPath: string, issueId: string): Comment[] {
  if (!supportsSqliteStorage(dbPath)) {
    return []
  }

  const db = getDb(dbPath)
  const stmt = db.prepare(`
    SELECT id, issue_id, author, text, created_at
    FROM comments
    WHERE issue_id = ?
    ORDER BY created_at ASC
  `)
  return stmt.all(issueId) as Comment[]
}

/**
 * Get ready issues (no open blockers)
 */
export function getReadyIssues(dbPath: string): Issue[] {
  if (!supportsSqliteStorage(dbPath)) {
    return getJsonlProjectIssues(dbPath, { onlyReady: true, includeLabels: true, sortBy: 'priority' })
  }

  const db = getDb(dbPath)
  try {
    const stmt = db.prepare(`
      SELECT
        id, title, description, status, priority, issue_type, assignee,
        created_at, updated_at, closed_at, estimated_minutes, due_at,
        defer_until, pinned, external_ref
      FROM ready_issues
      WHERE deleted_at IS NULL
      ORDER BY priority ASC, updated_at DESC
    `)
    return stmt.all() as Issue[]
  } catch {
    // View might not exist in older databases
    return getProjectIssues(dbPath, { status: 'open' })
  }
}

/**
 * Get blocked issues with blocker count
 */
export function getBlockedIssues(dbPath: string): (Issue & { blocked_by_count: number })[] {
  if (!supportsSqliteStorage(dbPath)) {
    return getJsonlProjectIssues(dbPath, { onlyBlocked: true, includeLabels: true }).map((issue) => ({
      ...issue,
      blocked_by_count: issue.blockedByCount ?? 0,
    }))
  }

  const db = getDb(dbPath)
  try {
    const stmt = db.prepare(`
      SELECT * FROM blocked_issues
      WHERE deleted_at IS NULL
      ORDER BY blocked_by_count DESC, priority ASC
    `)
    return stmt.all() as (Issue & { blocked_by_count: number })[]
  } catch {
    return []
  }
}

/**
 * Get detailed statistics for a project
 */
export function getDetailedProjectStats(dbPath: string): ProjectStats {
  if (!supportsSqliteStorage(dbPath)) {
    return getJsonlDetailedProjectStats(dbPath)
  }

  const db = getDb(dbPath)

  const stats: ProjectStats = {
    total: 0,
    open: 0,
    in_progress: 0,
    closed: 0,
    blocked: 0,
    ready: 0,
    overdue: 0,
    byPriority: {},
    byType: {},
  }

  try {
    // Status counts
    const statusStmt = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM issues
      WHERE deleted_at IS NULL
      GROUP BY status
    `)
    const statusRows = statusStmt.all() as { status: string; count: number }[]
    for (const row of statusRows) {
      stats.total += row.count
      if (row.status === 'open') stats.open = row.count
      else if (row.status === 'in_progress') stats.in_progress = row.count
      else if (row.status === 'closed') stats.closed = row.count
    }

    // Ready count
    try {
      const readyStmt = db.prepare(
        'SELECT COUNT(*) as count FROM ready_issues WHERE deleted_at IS NULL'
      )
      stats.ready = (readyStmt.get() as { count: number }).count
    } catch {
      stats.ready = stats.open
    }

    // Blocked count
    try {
      const blockedStmt = db.prepare(
        'SELECT COUNT(DISTINCT id) as count FROM blocked_issues WHERE deleted_at IS NULL'
      )
      stats.blocked = (blockedStmt.get() as { count: number }).count
    } catch {
      stats.blocked = 0
    }

    // Overdue count
    const overdueStmt = db.prepare(`
      SELECT COUNT(*) as count FROM issues
      WHERE deleted_at IS NULL
        AND due_at IS NOT NULL
        AND due_at < datetime('now')
        AND status NOT IN ('closed', 'tombstone')
    `)
    stats.overdue = (overdueStmt.get() as { count: number }).count

    // Priority distribution
    const priorityStmt = db.prepare(`
      SELECT priority, COUNT(*) as count
      FROM issues
      WHERE deleted_at IS NULL AND status != 'closed'
      GROUP BY priority
    `)
    const priorityRows = priorityStmt.all() as { priority: number; count: number }[]
    for (const row of priorityRows) {
      stats.byPriority[row.priority] = row.count
    }

    // Type distribution
    const typeStmt = db.prepare(`
      SELECT issue_type, COUNT(*) as count
      FROM issues
      WHERE deleted_at IS NULL AND status != 'closed'
      GROUP BY issue_type
    `)
    const typeRows = typeStmt.all() as { issue_type: string; count: number }[]
    for (const row of typeRows) {
      stats.byType[row.issue_type] = row.count
    }
  } catch (err) {
    console.error('Error getting detailed stats:', err)
  }

  return stats
}

/**
 * Get issues from all projects (aggregated view)
 */
export function getAllIssues(
  projects: Project[],
  options: {
    status?: string
    limit?: number
  } = {}
): Issue[] {
  const allIssues: Issue[] = []

  for (const project of projects) {
    try {
      const issues = getProjectIssues(project.database, { status: options.status })
      // Add project name to each issue
      for (const issue of issues) {
        issue.project = project.name
        allIssues.push(issue)
      }
    } catch (err) {
      console.error(`Error reading ${project.name}:`, err)
    }
  }

  // Sort by updated_at descending
  allIssues.sort((a, b) => {
    const aTime = new Date(a.updated_at).getTime()
    const bTime = new Date(b.updated_at).getTime()
    return bTime - aTime
  })

  if (options.limit) {
    return allIssues.slice(0, options.limit)
  }

  return allIssues
}

/**
 * Get a single issue by ID from a project with full details
 */
export function getIssue(
  dbPath: string,
  issueId: string,
  options: { includeRelated?: boolean } = {}
): Issue | null {
  if (!supportsSqliteStorage(dbPath)) {
    const issue = getJsonlIssues(dbPath).find((candidateIssue) => candidateIssue.id === issueId) || null

    if (!issue) {
      return null
    }

    if (options.includeRelated) {
      issue.dependencies = []
      issue.blockedBy = []
      issue.events = getJsonlIssueEvents(dbPath, issueId)
      issue.comments = []
    }

    return issue
  }

  const db = getDb(dbPath)
  const stmt = db.prepare(`
    SELECT
      id, title, description, status, priority, issue_type, assignee,
      created_at, updated_at, closed_at, design, acceptance_criteria, notes,
      estimated_minutes, due_at, defer_until, close_reason, pinned, external_ref
    FROM issues
    WHERE id = ? AND deleted_at IS NULL
  `)
  const issue = stmt.get(issueId) as Issue | null

  if (!issue) return null

  // Always include labels
  issue.labels = getIssueLabels(dbPath, issueId)

  if (options.includeRelated) {
    issue.dependencies = getIssueDependencies(dbPath, issueId)
    issue.blockedBy = getIssueBlockedBy(dbPath, issueId)
    issue.events = getIssueEvents(dbPath, issueId)
    issue.comments = getIssueComments(dbPath, issueId)
  }

  return issue
}

/**
 * Get issue counts per project
 */
export function getProjectStats(projects: Project[]): Project[] {
  return projects.map((project) => {
    try {
      if (!supportsSqliteStorage(project.database)) {
        return {
          ...project,
          issueCount: getJsonlIssues(project.database).filter((issue) => issue.status !== 'closed').length,
        }
      }

      const db = getDb(project.database)
      const stmt = db.prepare(`
        SELECT COUNT(*) as count FROM issues
        WHERE deleted_at IS NULL AND status != 'closed'
      `)
      const result = stmt.get() as { count: number }
      return { ...project, issueCount: result.count }
    } catch {
      return { ...project, issueCount: 0 }
    }
  })
}

/**
 * Update issue status (requires writable db)
 */
export function updateIssueStatus(
  dbPath: string,
  issueId: string,
  status: 'open' | 'in_progress' | 'closed'
): boolean {
  if (!supportsProjectWrites(dbPath)) {
    return false
  }

  // Close readonly connection first
  dbCache.get(dbPath)?.close()
  dbCache.delete(dbPath)

  const db = new Database(dbPath)
  try {
    const closedAt = status === 'closed' ? new Date().toISOString() : null
    const stmt = db.prepare(`
      UPDATE issues
      SET status = ?, closed_at = ?, updated_at = datetime('now')
      WHERE id = ?
    `)
    const result = stmt.run(status, closedAt, issueId)
    return result.changes > 0
  } finally {
    db.close()
  }
}

/**
 * Update issue priority
 */
export function updateIssuePriority(dbPath: string, issueId: string, priority: number): boolean {
  if (!supportsProjectWrites(dbPath)) {
    return false
  }

  dbCache.get(dbPath)?.close()
  dbCache.delete(dbPath)

  const db = new Database(dbPath)
  try {
    const stmt = db.prepare(`
      UPDATE issues
      SET priority = ?, updated_at = datetime('now')
      WHERE id = ?
    `)
    const result = stmt.run(priority, issueId)
    return result.changes > 0
  } finally {
    db.close()
  }
}

/**
 * Update issue title
 */
export function updateIssueTitle(dbPath: string, issueId: string, title: string): boolean {
  if (!supportsProjectWrites(dbPath)) {
    return false
  }

  dbCache.get(dbPath)?.close()
  dbCache.delete(dbPath)

  const db = new Database(dbPath)
  try {
    const stmt = db.prepare(`
      UPDATE issues
      SET title = ?, updated_at = datetime('now')
      WHERE id = ?
    `)
    const result = stmt.run(title, issueId)
    return result.changes > 0
  } finally {
    db.close()
  }
}

/**
 * Update issue description
 */
export function updateIssueDescription(
  dbPath: string,
  issueId: string,
  description: string
): boolean {
  if (!supportsProjectWrites(dbPath)) {
    return false
  }

  dbCache.get(dbPath)?.close()
  dbCache.delete(dbPath)

  const db = new Database(dbPath)
  try {
    const stmt = db.prepare(`
      UPDATE issues
      SET description = ?, updated_at = datetime('now')
      WHERE id = ?
    `)
    const result = stmt.run(description, issueId)
    return result.changes > 0
  } finally {
    db.close()
  }
}

/**
 * Update issue notes
 */
export function updateIssueNotes(dbPath: string, issueId: string, notes: string): boolean {
  if (!supportsProjectWrites(dbPath)) {
    return false
  }

  dbCache.get(dbPath)?.close()
  dbCache.delete(dbPath)

  const db = new Database(dbPath)
  try {
    const stmt = db.prepare(`
      UPDATE issues
      SET notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `)
    const result = stmt.run(notes, issueId)
    return result.changes > 0
  } finally {
    db.close()
  }
}

/**
 * Create a new issue
 */
export function createIssue(
  dbPath: string,
  data: {
    id: string
    title: string
    description?: string
    priority?: number
    issue_type?: string
    assignee?: string
  }
): boolean {
  if (!supportsProjectWrites(dbPath)) {
    return false
  }

  dbCache.get(dbPath)?.close()
  dbCache.delete(dbPath)

  const db = new Database(dbPath)
  try {
    const stmt = db.prepare(`
      INSERT INTO issues (id, title, description, priority, issue_type, assignee, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'open', datetime('now'), datetime('now'))
    `)
    const result = stmt.run(
      data.id,
      data.title,
      data.description || '',
      data.priority ?? 2,
      data.issue_type || 'task',
      data.assignee || null
    )
    return result.changes > 0
  } finally {
    db.close()
  }
}

/**
 * Delete an issue (soft delete)
 */
export function deleteIssue(dbPath: string, issueId: string): boolean {
  if (!supportsProjectWrites(dbPath)) {
    return false
  }

  dbCache.get(dbPath)?.close()
  dbCache.delete(dbPath)

  const db = new Database(dbPath)
  try {
    const stmt = db.prepare(`
      UPDATE issues
      SET deleted_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `)
    const result = stmt.run(issueId)
    return result.changes > 0
  } finally {
    db.close()
  }
}

/**
 * Toggle pinned status
 */
export function toggleIssuePinned(dbPath: string, issueId: string): boolean {
  if (!supportsProjectWrites(dbPath)) {
    return false
  }

  dbCache.get(dbPath)?.close()
  dbCache.delete(dbPath)

  const db = new Database(dbPath)
  try {
    const stmt = db.prepare(`
      UPDATE issues
      SET pinned = CASE WHEN pinned = 1 THEN 0 ELSE 1 END,
          updated_at = datetime('now')
      WHERE id = ?
    `)
    const result = stmt.run(issueId)
    return result.changes > 0
  } finally {
    db.close()
  }
}

/**
 * Update issue due date
 */
export function updateIssueDueDate(dbPath: string, issueId: string, dueAt: string | null): boolean {
  if (!supportsProjectWrites(dbPath)) {
    return false
  }

  dbCache.get(dbPath)?.close()
  dbCache.delete(dbPath)

  const db = new Database(dbPath)
  try {
    const stmt = db.prepare(`
      UPDATE issues
      SET due_at = ?, updated_at = datetime('now')
      WHERE id = ?
    `)
    const result = stmt.run(dueAt, issueId)
    return result.changes > 0
  } finally {
    db.close()
  }
}

/**
 * Add a label to an issue
 */
export function addIssueLabel(dbPath: string, issueId: string, label: string): boolean {
  if (!supportsProjectWrites(dbPath)) {
    return false
  }

  dbCache.get(dbPath)?.close()
  dbCache.delete(dbPath)

  const db = new Database(dbPath)
  try {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO labels (issue_id, label) VALUES (?, ?)
    `)
    const result = stmt.run(issueId, label)
    return result.changes > 0
  } finally {
    db.close()
  }
}

/**
 * Remove a label from an issue
 */
export function removeIssueLabel(dbPath: string, issueId: string, label: string): boolean {
  if (!supportsProjectWrites(dbPath)) {
    return false
  }

  dbCache.get(dbPath)?.close()
  dbCache.delete(dbPath)

  const db = new Database(dbPath)
  try {
    const stmt = db.prepare(`
      DELETE FROM labels WHERE issue_id = ? AND label = ?
    `)
    const result = stmt.run(issueId, label)
    return result.changes > 0
  } finally {
    db.close()
  }
}
