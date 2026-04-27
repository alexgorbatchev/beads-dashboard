import { useState, useCallback, useEffect } from 'react'
import { FolderGit2, Layers, RefreshCw, GripVertical } from 'lucide-react'
import type { Project } from '../types'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipPositioner } from '@/components/ui/tooltip'
import { ThemeToggle } from './ThemeToggle'
import { StatsWidget } from './StatsWidget'
import { ProjectSettingsDialog } from './ProjectSettingsDialog'

interface ProjectSidebarProps {
  projects: Project[]
  selectedProject: string | null
  onSelectProject: (project: string | null) => void
  onRefresh: () => void
  onProjectsChanged: () => Promise<void>
  isLoading?: boolean
}

const MIN_WIDTH = 200
const MAX_WIDTH = 600
const DEFAULT_WIDTH = 256

export function ProjectSidebar({
  projects,
  selectedProject,
  onSelectProject,
  onRefresh,
  onProjectsChanged,
  isLoading,
}: ProjectSidebarProps) {
  const totalIssues = projects.reduce((sum, p) => sum + (p.issueCount || 0), 0)
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [isResizing, setIsResizing] = useState(false)

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, e.clientX))
        setWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  return (
    <aside
      className="bg-deep border-r border-border flex flex-col h-screen overflow-hidden relative"
      style={{ width }}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center">
              <Layers className="w-4 h-4 text-accent" />
            </div>
            <span className="font-semibold text-sm">Beads</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <ProjectSettingsDialog onProjectsChanged={onProjectsChanged} />
            <Tooltip>
              <TooltipTrigger
                onClick={onRefresh}
                disabled={isLoading}
                className="p-1.5 rounded-md hover:bg-surface transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn('w-4 h-4 text-secondary', isLoading && 'animate-spin')} />
              </TooltipTrigger>
              <TooltipPositioner side="right">
                <TooltipContent>Refresh projects</TooltipContent>
              </TooltipPositioner>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* All Projects Option */}
      <div className="px-2 pt-3">
        <button
          onClick={() => onSelectProject(null)}
          className={cn(
            'project-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left',
            selectedProject === null && 'active'
          )}
        >
          <div className="w-8 h-8 rounded-md bg-accent/10 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-primary truncate">All Projects</div>
            <div className="text-xs text-muted font-mono">{totalIssues} open</div>
          </div>
        </button>
      </div>

      {/* Divider */}
      <div className="px-4 py-3">
        <div className="text-xs font-medium text-muted uppercase tracking-wider">Projects</div>
      </div>

      {/* Project List */}
      <ScrollArea className="flex-1 min-h-0 px-2">
        <div className="space-y-0.5 pb-4">
          {projects.map((project) => (
            <button
              key={project.path}
              onClick={() => onSelectProject(project.name)}
              className={cn(
                'project-item w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left group',
                selectedProject === project.name && 'active'
              )}
            >
              <div className="w-8 h-8 rounded-md bg-surface flex items-center justify-center shrink-0 group-hover:bg-elevated transition-colors">
                <FolderGit2 className="w-4 h-4 text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-primary truncate">{project.name}</div>
                {project.issueCount !== undefined && project.issueCount > 0 && (
                  <div className="text-xs text-muted font-mono">{project.issueCount} open</div>
                )}
              </div>
              {project.issueCount !== undefined && project.issueCount > 0 && (
                <div className="w-5 h-5 rounded-full bg-surface flex items-center justify-center">
                  <span className="text-[10px] font-mono font-medium text-secondary">
                    {project.issueCount}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Stats Widget */}
      <div className="px-2 py-2 border-t border-border">
        <StatsWidget expanded={false} />
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <div className="text-xs text-muted text-center font-mono">{projects.length} projects</div>
      </div>

      {/* Resize Handle */}
      <div
        className={cn(
          'absolute right-0 top-0 bottom-0 w-1 cursor-col-resize group hover:bg-accent/30 transition-colors',
          isResizing && 'bg-accent/50'
        )}
        onMouseDown={startResizing}
      >
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-3 h-3 text-muted" />
        </div>
      </div>
    </aside>
  )
}
