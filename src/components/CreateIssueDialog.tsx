import { useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createIssue } from '../lib/api'

interface CreateIssueDialogProps {
  project: string | null
  projects: { name: string }[]
  onCreated: () => void
}

const PRIORITY_OPTIONS = [
  { value: 0, label: 'Critical' },
  { value: 1, label: 'High' },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'Low' },
  { value: 4, label: 'Backlog' },
]

const TYPE_OPTIONS = [
  { value: 'task', label: 'Task' },
  { value: 'bug', label: 'Bug' },
  { value: 'feature', label: 'Feature' },
  { value: 'epic', label: 'Epic' },
  { value: 'chore', label: 'Chore' },
]

function generateId(): string {
  return crypto.randomUUID()
}

export function CreateIssueDialog({ project, projects, onCreated }: CreateIssueDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedProjectOverride, setSelectedProjectOverride] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState(2)
  const [issueType, setIssueType] = useState('task')

  const selectedProject = selectedProjectOverride ?? project ?? ''

  const handleClose = (): void => {
    resetForm()
    setOpen(false)
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setPriority(2)
    setIssueType('task')
    setError(null)
    setSelectedProjectOverride(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedProject) {
      setError('Please select a project')
      return
    }

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await createIssue(selectedProject, {
        id: generateId(),
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        issue_type: issueType,
      })

      resetForm()
      setOpen(false)
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create issue')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) resetForm()
      }}
    >
      <DialogTrigger className="h-9 px-3 flex items-center gap-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
        <Plus className="w-4 h-4" />
        New Issue
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-deep border-border">
        <DialogHeader>
          <DialogTitle className="text-primary">Create New Issue</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Project Selection */}
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-1.5">
              Project
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProjectOverride(e.target.value)}
              className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="">Select a project...</option>
              {projects.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-1.5">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={4}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
            />
          </div>

          {/* Priority & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-1.5">
                Type
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="h-9 px-4 text-sm text-secondary hover:text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'h-9 px-4 bg-accent text-white rounded-lg text-sm font-medium transition-colors',
                isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent/90'
              )}
            >
              {isSubmitting ? 'Creating...' : 'Create Issue'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
