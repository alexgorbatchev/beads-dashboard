import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, FolderCog, LoaderCircle, Plus, Save, Settings2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { addProjectSetting, deleteProjectSetting, fetchProjectSettings, updateProjectSetting } from "../lib/api";
import type { IConfiguredProjectSetting, IProjectSettings } from "../types";

interface IProjectSettingsDialogProps {
  onProjectsChanged: () => Promise<void>;
}

interface IProjectSettingRowProps {
  project: IConfiguredProjectSetting;
  draftPath: string;
  isPending: boolean;
  onDelete: (projectPath: string) => void;
  onDraftPathChange: (projectPath: string, nextPath: string) => void;
  onSave: (projectPath: string) => void;
}

function toDraftPaths(projects: IConfiguredProjectSetting[]): Record<string, string> {
  return projects.reduce<Record<string, string>>((draftPaths, project) => {
    draftPaths[project.path] = project.path;
    return draftPaths;
  }, {});
}

function ProjectSettingRow({
  project,
  draftPath,
  isPending,
  onDelete,
  onDraftPathChange,
  onSave,
}: IProjectSettingRowProps) {
  const hasChanges = draftPath.trim() !== project.path;

  return (
    <div className="rounded-lg border border-border bg-surface/60 p-3 space-y-3">
      <div className="flex gap-2 items-start">
        <div className="flex-1 space-y-2">
          <Input
            value={draftPath}
            onChange={(event) => onDraftPathChange(project.path, event.target.value)}
            disabled={isPending}
            placeholder="../my-beads-project"
          />
          <div className="space-y-1 text-xs text-muted">
            <div className="font-mono break-all">{project.resolvedPath}</div>
            {project.isValid ? (
              <div className="text-emerald-400">
                {project.name} · {project.issueCount ?? 0} open issues
              </div>
            ) : (
              <div className="flex items-center gap-1 text-amber-400">
                <AlertTriangle className="size-3.5 shrink-0" />
                <span>{project.error}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onSave(project.path)}
            disabled={isPending || !hasChanges}
            aria-label={`Save ${project.path}`}
          >
            <Save />
          </Button>
          <Button
            variant="destructive"
            size="icon-sm"
            onClick={() => onDelete(project.path)}
            disabled={isPending}
            aria-label={`Delete ${project.path}`}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProjectSettingsDialog({ onProjectsChanged }: IProjectSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<IProjectSettings>({ exists: false, projects: [] });
  const [draftPaths, setDraftPaths] = useState<Record<string, string>>({});
  const [newPath, setNewPath] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applySettings = useCallback((nextSettings: IProjectSettings): void => {
    setSettings(nextSettings);
    setDraftPaths(toDraftPaths(nextSettings.projects));
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    let isCancelled = false;

    async function loadOpenDialogSettings(): Promise<void> {
      setIsLoading(true);
      setError(null);

      try {
        const nextSettings = await fetchProjectSettings();
        if (!isCancelled) {
          applySettings(nextSettings);
        }
      } catch (error) {
        if (!isCancelled) {
          setError(error instanceof Error ? error.message : "Failed to load project settings");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadOpenDialogSettings();

    return () => {
      isCancelled = true;
    };
  }, [applySettings, open]);

  const syncProjects = useCallback(
    async (nextSettings: IProjectSettings): Promise<void> => {
      applySettings(nextSettings);
      setError(null);
      await onProjectsChanged();
    },
    [applySettings, onProjectsChanged],
  );

  const handleAddProject = useCallback(async (): Promise<void> => {
    setIsCreating(true);
    setError(null);

    try {
      const nextSettings = await addProjectSetting(newPath);
      setNewPath("");
      await syncProjects(nextSettings);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to add project");
    } finally {
      setIsCreating(false);
    }
  }, [newPath, syncProjects]);

  const handleSaveProject = useCallback(
    async (projectPath: string): Promise<void> => {
      const nextPath = draftPaths[projectPath] ?? projectPath;
      setPendingPath(projectPath);
      setError(null);

      try {
        const nextSettings = await updateProjectSetting(projectPath, nextPath);
        await syncProjects(nextSettings);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to update project");
      } finally {
        setPendingPath(null);
      }
    },
    [draftPaths, syncProjects],
  );

  const handleDeleteProject = useCallback(
    async (projectPath: string): Promise<void> => {
      setPendingPath(projectPath);
      setError(null);

      try {
        const nextSettings = await deleteProjectSetting(projectPath);
        await syncProjects(nextSettings);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to remove project");
      } finally {
        setPendingPath(null);
      }
    },
    [syncProjects],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        variant="toolbar"
        size="toolbar"
        aria-label="Manage projects"
      >
        <Settings2 className="w-4 h-4 text-secondary" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[720px] bg-deep border-border">
        <DialogHeader>
          <DialogTitle className="text-primary flex items-center gap-2">
            <FolderCog className="size-5 text-accent" />
            Manage Projects
          </DialogTitle>
          <DialogDescription>
            Projects are stored in a local <code>.projects.json</code> file at the repo root. When that file exists, it
            becomes the source of truth and automatic BEADS_ROOT scanning stops.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="rounded-lg border border-border bg-surface/40 p-3 space-y-2">
            <label className="text-xs font-medium text-muted uppercase tracking-wider block">Add project path</label>
            <div className="flex gap-2">
              <Input
                value={newPath}
                onChange={(event) => setNewPath(event.target.value)}
                placeholder="../my-beads-project"
                disabled={isCreating}
              />
              <Button onClick={() => void handleAddProject()} disabled={isCreating || newPath.trim().length === 0}>
                {isCreating ? (
                  <LoaderCircle data-icon="inline-start" className="animate-spin" />
                ) : (
                  <Plus data-icon="inline-start" />
                )}
                Add
              </Button>
            </div>
            {!settings.exists && (
              <p className="text-xs text-muted">
                No <code>.projects.json</code> exists yet. Adding a project will create it.
              </p>
            )}
          </div>

          {error && <div className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</div>}

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-sm text-muted gap-2">
                <LoaderCircle className="size-4 animate-spin" />
                Loading project settings...
              </div>
            ) : settings.projects.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-4 py-8 text-sm text-muted text-center">
                No configured projects yet.
              </div>
            ) : (
              settings.projects.map((project) => (
                <ProjectSettingRow
                  key={project.path}
                  project={project}
                  draftPath={draftPaths[project.path] ?? project.path}
                  isPending={pendingPath === project.path}
                  onDraftPathChange={(projectPath, nextPath) =>
                    setDraftPaths((currentDraftPaths) => ({
                      ...currentDraftPaths,
                      [projectPath]: nextPath,
                    }))
                  }
                  onSave={(projectPath) => void handleSaveProject(projectPath)}
                  onDelete={(projectPath) => void handleDeleteProject(projectPath)}
                />
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
