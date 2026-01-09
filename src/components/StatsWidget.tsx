import { useState, useEffect } from 'react'
import {
  Circle,
  Clock,
  CheckCircle2,
  Ban,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { AggregatedStats } from '../types'
import { fetchAggregatedStats } from '../lib/api'
import { cn } from '@/lib/utils'

interface StatsWidgetProps {
  className?: string
  expanded?: boolean
}

export function StatsWidget({ className, expanded = false }: StatsWidgetProps) {
  const [stats, setStats] = useState<AggregatedStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(expanded)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setIsLoading(true)
    try {
      const data = await fetchAggregatedStats()
      setStats(data)
    } catch (err) {
      console.error('Failed to load stats:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className={cn('p-3 bg-surface/30 rounded-lg', className)}>
        <div className="text-xs text-muted text-center">Loading stats...</div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const activeIssues = stats.open + stats.in_progress + stats.blocked

  return (
    <div className={cn('bg-surface/30 rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-surface/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent" />
          <span className="text-xs font-medium text-primary">Statistics</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted" />
        )}
      </button>

      {isExpanded && (
        <div className="p-3 pt-0 space-y-3">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-deep rounded-lg">
              <div className="text-lg font-bold text-primary">{activeIssues}</div>
              <div className="text-[10px] text-muted uppercase tracking-wider">Active</div>
            </div>
            <div className="p-2 bg-deep rounded-lg">
              <div className="text-lg font-bold text-[var(--color-status-closed)]">
                {stats.closed}
              </div>
              <div className="text-[10px] text-muted uppercase tracking-wider">Closed</div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="space-y-1.5">
            <div className="text-[10px] text-muted uppercase tracking-wider">By Status</div>

            <div className="flex items-center gap-2 text-xs">
              <Circle className="w-3 h-3 text-[var(--color-status-open)]" />
              <span className="text-secondary flex-1">Open</span>
              <span className="font-mono text-muted">{stats.open}</span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Clock className="w-3 h-3 text-[var(--color-status-progress)]" />
              <span className="text-secondary flex-1">In Progress</span>
              <span className="font-mono text-muted">{stats.in_progress}</span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Ban className="w-3 h-3 text-red-500" />
              <span className="text-secondary flex-1">Blocked</span>
              <span className="font-mono text-muted">{stats.blocked}</span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-3 h-3 text-[var(--color-status-closed)]" />
              <span className="text-secondary flex-1">Closed</span>
              <span className="font-mono text-muted">{stats.closed}</span>
            </div>
          </div>

          {/* Ready Issues */}
          {stats.ready > 0 && (
            <div className="p-2 bg-green-500/10 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <div className="flex-1">
                <div className="text-xs font-medium text-green-500">{stats.ready} Ready</div>
                <div className="text-[10px] text-muted">No blockers</div>
              </div>
            </div>
          )}

          {/* Overdue Issues */}
          {stats.overdue > 0 && (
            <div className="p-2 bg-red-500/10 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <div className="flex-1">
                <div className="text-xs font-medium text-red-500">{stats.overdue} Overdue</div>
                <div className="text-[10px] text-muted">Past due date</div>
              </div>
            </div>
          )}

          {/* Per-Project Stats */}
          {Object.keys(stats.byProject).length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] text-muted uppercase tracking-wider">By Project</div>
              {Object.entries(stats.byProject).map(([project, projectStats]) => (
                <div key={project} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-accent/50" />
                  <span className="text-secondary flex-1 truncate">{project}</span>
                  <span className="font-mono text-muted">
                    {projectStats.open}/{projectStats.total}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
