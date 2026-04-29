import type { JSX } from "react";
import { useState, useEffect, useCallback } from "react";
import type { IProject, ISsue, IssueGitDiff, IssueStatus } from "./types";
import {
  fetchProjects,
  fetchIssues,
  fetchIssue,
  updateIssue,
  deleteIssue,
  toggleIssuePin,
  addIssueLabel,
  removeIssueLabel,
  fetchIssueGitDiff,
} from "./lib/api";
import { ProjectSidebar } from "./components/ProjectSidebar";
import { IssueList } from "./components/IssueList";
import { IssueDetail } from "./components/IssueDetail";
import "./index.css";

type EditableField = "title" | "description" | "notes";

export function App(): JSX.Element {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [issues, setIssues] = useState<ISsue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<ISsue | null>(null);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [focusedIssueIndex, setFocusedIssueIndex] = useState<number>(-1);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingIssues, setIsLoadingIssues] = useState(true);
  const [issueGitDiff, setIssueGitDiff] = useState<IssueGitDiff | null>(null);
  const [isLoadingIssueGitDiff, setIsLoadingIssueGitDiff] = useState(false);
  const [issueGitDiffError, setIssueGitDiffError] = useState<string | null>(null);

  // Load projects
  const loadProjects = useCallback(async (): Promise<IProject[]> => {
    setIsLoadingProjects(true);
    try {
      const data = await fetchProjects();
      setProjects(data);
      setSelectedProject((currentSelectedProject) => {
        if (!currentSelectedProject) {
          return currentSelectedProject;
        }

        return data.some((project) => project.name === currentSelectedProject) ? currentSelectedProject : null;
      });
      setSelectedIssue((currentSelectedIssue) => {
        if (!currentSelectedIssue?.project) {
          return currentSelectedIssue;
        }

        return data.some((project) => project.name === currentSelectedIssue.project) ? currentSelectedIssue : null;
      });
      return data;
    } catch (error) {
      console.error("Failed to load projects:", error);
      return [];
    } finally {
      setIsLoadingProjects(false);
    }
  }, []);

  // Load issues
  const loadIssues = useCallback(
    async (projectName: string | null = selectedProject): Promise<void> => {
      setIsLoadingIssues(true);
      try {
        const data = await fetchIssues({
          project: projectName || "__ALL__",
        });
        setIssues(data);
      } catch (error) {
        console.error("Failed to load issues:", error);
      } finally {
        setIsLoadingIssues(false);
      }
    },
    [selectedProject],
  );

  const handleSelectProject = useCallback((project: string | null): void => {
    setIsLoadingIssues(true);
    setSelectedProject(project);
  }, []);

  // Initial load
  useEffect(() => {
    let isCancelled = false;

    async function loadInitialProjects(): Promise<void> {
      setIsLoadingProjects(true);

      try {
        const data = await fetchProjects();

        if (isCancelled) {
          return;
        }

        setProjects(data);
        setSelectedProject((currentSelectedProject) => {
          if (!currentSelectedProject) {
            return currentSelectedProject;
          }

          return data.some((project) => project.name === currentSelectedProject) ? currentSelectedProject : null;
        });
        setSelectedIssue((currentSelectedIssue) => {
          if (!currentSelectedIssue?.project) {
            return currentSelectedIssue;
          }

          return data.some((project) => project.name === currentSelectedIssue.project) ? currentSelectedIssue : null;
        });
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to load projects:", error);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingProjects(false);
        }
      }
    }

    void loadInitialProjects();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Load issues when project changes
  useEffect(() => {
    let isCancelled = false;

    async function loadSelectedProjectIssues(): Promise<void> {
      setIsLoadingIssues(true);

      try {
        const data = await fetchIssues({
          project: selectedProject || "__ALL__",
        });

        if (!isCancelled) {
          setIssues(data);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to load issues:", error);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingIssues(false);
        }
      }
    }

    void loadSelectedProjectIssues();

    return () => {
      isCancelled = true;
    };
  }, [selectedProject]);

  const handleProjectsChanged = useCallback(async (): Promise<void> => {
    const nextProjects = await loadProjects();
    const nextSelectedProject =
      selectedProject && nextProjects.some((project) => project.name === selectedProject) ? selectedProject : null;

    await loadIssues(nextSelectedProject);
  }, [loadIssues, loadProjects, selectedProject]);

  // Handle issue selection
  const handleSelectIssue = useCallback(async (issue: ISsue) => {
    // Fetch full issue details with related data
    try {
      const fullIssue = await fetchIssue(issue.project!, issue.id, { includeRelated: true });
      setSelectedIssue({ ...fullIssue, project: issue.project });
    } catch (error) {
      console.error("Failed to load issue:", error);
      setSelectedIssue(issue);
    }
  }, []);

  // Handle selecting a linked issue (from dependencies)
  const handleSelectLinkedIssue = async (issueId: string) => {
    // Find the project for this issue
    const issueInList = issues.find((i) => i.id === issueId);
    const project = issueInList?.project || selectedProject;
    if (!project) return;

    try {
      const fullIssue = await fetchIssue(project, issueId, { includeRelated: true });
      setSelectedIssue({ ...fullIssue, project });
    } catch (error) {
      console.error("Failed to load linked issue:", error);
    }
  };

  // Handle status update
  const handleUpdateStatus = useCallback(
    async (status: IssueStatus) => {
      if (!selectedIssue?.project) return;
      try {
        await updateIssue(selectedIssue.project, selectedIssue.id, { status });
        setSelectedIssue((prev) => (prev ? { ...prev, status } : null));
        loadIssues();
        loadProjects();
      } catch (error) {
        console.error("Failed to update status:", error);
      }
    },
    [selectedIssue, loadIssues, loadProjects],
  );

  // Handle priority update
  const handleUpdatePriority = async (priority: number) => {
    if (!selectedIssue?.project) return;
    try {
      await updateIssue(selectedIssue.project, selectedIssue.id, { priority });
      setSelectedIssue((prev) => (prev ? { ...prev, priority } : null));
      loadIssues();
    } catch (error) {
      console.error("Failed to update priority:", error);
    }
  };

  // Handle field update (title, description, notes)
  const handleUpdateField = async (field: EditableField, value: string) => {
    if (!selectedIssue?.project) return;
    try {
      await updateIssue(selectedIssue.project, selectedIssue.id, { [field]: value });
      setSelectedIssue((prev) => (prev ? { ...prev, [field]: value } : null));
      if (field === "title") {
        loadIssues();
      }
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);
    }
  };

  const handleRequestDelete = useCallback(() => {
    if (!selectedIssue) return;
    setIsDeleteConfirmationOpen(true);
  }, [selectedIssue]);

  const handleCancelDelete = useCallback(() => {
    setIsDeleteConfirmationOpen(false);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedIssue?.project) return;
    try {
      await deleteIssue(selectedIssue.project, selectedIssue.id);
      setIsDeleteConfirmationOpen(false);
      setSelectedIssue(null);
      await Promise.all([loadIssues(), loadProjects()]);
    } catch (error) {
      console.error("Failed to delete issue:", error);
    }
  }, [selectedIssue, loadIssues, loadProjects]);

  // Handle pin toggle
  const handleTogglePin = useCallback(async () => {
    if (!selectedIssue?.project) return;
    try {
      await toggleIssuePin(selectedIssue.project, selectedIssue.id);
      setSelectedIssue((prev) => (prev ? { ...prev, pinned: prev.pinned ? 0 : 1 } : null));
      loadIssues();
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    }
  }, [selectedIssue, loadIssues]);

  // Handle adding label
  const handleAddLabel = async (label: string) => {
    if (!selectedIssue?.project) return;
    try {
      await addIssueLabel(selectedIssue.project, selectedIssue.id, label);
      setSelectedIssue((prev) => (prev ? { ...prev, labels: [...(prev.labels || []), label] } : null));
      loadIssues();
    } catch (error) {
      console.error("Failed to add label:", error);
    }
  };

  // Handle removing label
  const handleRemoveLabel = async (label: string) => {
    if (!selectedIssue?.project) return;
    try {
      await removeIssueLabel(selectedIssue.project, selectedIssue.id, label);
      setSelectedIssue((prev) => (prev ? { ...prev, labels: (prev.labels || []).filter((l) => l !== label) } : null));
      loadIssues();
    } catch (error) {
      console.error("Failed to remove label:", error);
    }
  };

  // Handle due date update
  const handleUpdateDueDate = async (dueDate: string | null) => {
    if (!selectedIssue?.project) return;
    try {
      await updateIssue(selectedIssue.project, selectedIssue.id, { due_at: dueDate });
      setSelectedIssue((prev) => (prev ? { ...prev, due_at: dueDate } : null));
      loadIssues();
    } catch (error) {
      console.error("Failed to update due date:", error);
    }
  };

  const handleLoadIssueGitDiff = useCallback(async (): Promise<void> => {
    if (!selectedIssue?.project) return;

    setIsLoadingIssueGitDiff(true);
    setIssueGitDiffError(null);

    try {
      const diff = await fetchIssueGitDiff(selectedIssue.project, selectedIssue.id);
      setIssueGitDiff(diff);
    } catch (error) {
      setIssueGitDiff(null);
      setIssueGitDiffError(error instanceof Error ? error.message : "Failed to fetch issue git diff");
    } finally {
      setIsLoadingIssueGitDiff(false);
    }
  }, [selectedIssue]);

  // Handle moving issue (Kanban drag and drop)
  const handleMoveIssue = async (issue: ISsue, newStatus: IssueStatus) => {
    if (!issue.project) return;
    try {
      await updateIssue(issue.project, issue.id, { status: newStatus });
      loadIssues();
      loadProjects();
    } catch (error) {
      console.error("Failed to move issue:", error);
    }
  };

  useEffect(() => {
    setIsDeleteConfirmationOpen(false);
    setIssueGitDiff(null);
    setIssueGitDiffError(null);
    setIsLoadingIssueGitDiff(false);
  }, [selectedIssue?.id, selectedIssue?.project]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        // Allow Escape to blur inputs
        if (e.key === "Escape") {
          target.blur();
        }
        return;
      }

      // Focus search on /
      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        const searchInput = document.querySelector('input[placeholder="Search issues..."]') as HTMLInputElement;
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
        }
        return;
      }

      // Close delete confirmation/detail on Escape
      if (e.key === "Escape") {
        if (isDeleteConfirmationOpen) {
          setIsDeleteConfirmationOpen(false);
        } else if (selectedIssue) {
          setSelectedIssue(null);
        } else if (focusedIssueIndex >= 0) {
          setFocusedIssueIndex(-1);
        }
        return;
      }

      // Navigation: j = down, k = up
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIssueIndex((prev) => Math.min(prev + 1, issues.length - 1));
        return;
      }

      if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIssueIndex((prev) => Math.max(prev - 1, 0));
        return;
      }

      // Open issue with Enter or o
      if ((e.key === "Enter" || e.key === "o") && focusedIssueIndex >= 0 && !selectedIssue) {
        e.preventDefault();
        const issue = issues[focusedIssueIndex];
        if (issue) {
          handleSelectIssue(issue);
        }
        return;
      }

      // Quick status changes when detail panel is open
      if (selectedIssue) {
        // 1 = open, 2 = in_progress, 3 = closed, 4 = blocked, 5 = deferred
        if (e.key === "1") {
          handleUpdateStatus("open");
          return;
        }
        if (e.key === "2") {
          handleUpdateStatus("in_progress");
          return;
        }
        if (e.key === "3") {
          handleUpdateStatus("closed");
          return;
        }
        if (e.key === "4") {
          handleUpdateStatus("blocked");
          return;
        }
        if (e.key === "5") {
          handleUpdateStatus("deferred");
          return;
        }

        // p = toggle pin
        if (e.key === "p") {
          handleTogglePin();
          return;
        }

        // d = request delete confirmation
        if (e.key === "d") {
          e.preventDefault();
          handleRequestDelete();
          return;
        }
      }

      // g then h = go home (all projects)
      // r = refresh
      if (e.key === "r") {
        e.preventDefault();
        loadIssues();
        loadProjects();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    issues,
    focusedIssueIndex,
    selectedIssue,
    handleSelectIssue,
    handleUpdateStatus,
    handleTogglePin,
    handleRequestDelete,
    isDeleteConfirmationOpen,
    loadIssues,
    loadProjects,
  ]);

  return (
    <div className="flex h-screen overflow-hidden bg-void" data-testid="App">
      <ProjectSidebar
        projects={projects}
        selectedProject={selectedProject}
        onSelectProject={handleSelectProject}
        onRefresh={loadProjects}
        onProjectsChanged={handleProjectsChanged}
        isLoading={isLoadingProjects}
      />
      <IssueList
        issues={issues}
        selectedProject={selectedProject}
        onSelectIssue={handleSelectIssue}
        onMoveIssue={handleMoveIssue}
        isLoading={isLoadingIssues}
        focusedIndex={focusedIssueIndex}
        projects={projects}
        onIssueCreated={() => {
          loadIssues();
          loadProjects();
        }}
      />
      <IssueDetail
        issue={selectedIssue}
        open={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onUpdateStatus={handleUpdateStatus}
        onUpdatePriority={handleUpdatePriority}
        onUpdateField={handleUpdateField}
        onAddLabel={handleAddLabel}
        onRemoveLabel={handleRemoveLabel}
        onUpdateDueDate={handleUpdateDueDate}
        isDeleteConfirmationOpen={isDeleteConfirmationOpen}
        onRequestDelete={handleRequestDelete}
        onCancelDelete={handleCancelDelete}
        onConfirmDelete={handleConfirmDelete}
        onTogglePin={handleTogglePin}
        onSelectIssue={handleSelectLinkedIssue}
        gitDiff={issueGitDiff}
        isLoadingGitDiff={isLoadingIssueGitDiff}
        gitDiffError={issueGitDiffError}
        onLoadGitDiff={handleLoadIssueGitDiff}
      />
    </div>
  );
}

// export default App;
