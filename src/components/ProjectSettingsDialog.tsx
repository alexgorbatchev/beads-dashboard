import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, FolderCog, LoaderCircle, Plus, Save, Settings2, Trash2 } from "lucide-react";

import { Field, Icon, Panel, Stack, Text } from "@/components/ui/appPrimitives";
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
    <Panel variant="row">
      <Stack variant="settingsRow">
        <Stack variant="section">
          <Input
            value={draftPath}
            onChange={(event) => onDraftPathChange(project.path, event.target.value)}
            disabled={isPending}
            placeholder="../my-beads-project"
          />
          <Stack variant="settingsDetails">
            <Text as="div" variant="monoMuted" wrap="breakAll">
              {project.resolvedPath}
            </Text>
            {project.isValid ? (
              <Text as="div" variant="projectValid">
                {project.name} · {project.issueCount ?? 0} open issues
              </Text>
            ) : (
              <Stack variant="row">
                <Icon icon={AlertTriangle} size="sm" tone="warning" />
                <span>{project.error}</span>
              </Stack>
            )}
          </Stack>
        </Stack>
        <Stack variant="settingsActions">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onSave(project.path)}
            disabled={isPending || !hasChanges}
            aria-label={`Save ${project.path}`}
          >
            <Icon icon={Save} />
          </Button>
          <Button
            variant="destructive"
            size="icon-sm"
            onClick={() => onDelete(project.path)}
            disabled={isPending}
            aria-label={`Delete ${project.path}`}
          >
            <Icon icon={Trash2} />
          </Button>
        </Stack>
      </Stack>
    </Panel>
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
        <Icon icon={Settings2} tone="secondary" />
      </DialogTrigger>
      <DialogContent size="wide" surface="deep">
        <DialogHeader>
          <DialogTitle tone="primary" layout="inlineIcon">
            <Icon icon={FolderCog} size="lg" tone="accent" />
            Manage Projects
          </DialogTitle>
          <DialogDescription>
            Projects are stored in a local <code>.projects.json</code> file at the repo root. When that file exists, it
            becomes the source of truth and automatic BEADS_ROOT scanning stops.
          </DialogDescription>
        </DialogHeader>

        <Stack variant="dialogBody">
          <Panel variant="subtle">
            <Field label="Add project path">
              <Stack variant="row">
              <Input
                value={newPath}
                onChange={(event) => setNewPath(event.target.value)}
                placeholder="../my-beads-project"
                disabled={isCreating}
              />
              <Button onClick={() => void handleAddProject()} disabled={isCreating || newPath.trim().length === 0}>
                {isCreating ? (
                  <Icon icon={LoaderCircle} dataIcon="inline-start" animation="spin" />
                ) : (
                  <Icon icon={Plus} dataIcon="inline-start" />
                )}
                Add
              </Button>
              </Stack>
            </Field>
            {!settings.exists && (
              <Text as="p" variant="muted">
                No <code>.projects.json</code> exists yet. Adding a project will create it.
              </Text>
            )}
          </Panel>

          {error && <Panel variant="destructive">{error}</Panel>}

          <Stack variant="dialogScroll">
            {isLoading ? (
              <Stack variant="loadingLine">
                <Icon icon={LoaderCircle} animation="spin" />
                Loading project settings...
              </Stack>
            ) : settings.projects.length === 0 ? (
              <Panel variant="dashedEmpty">
                No configured projects yet.
              </Panel>
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
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
