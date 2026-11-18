import { useState, useCallback, useEffect } from "react";
import { FolderGit2, Layers, RefreshCw } from "lucide-react";
import type { IProject } from "../types";
import { Icon, Pill, SidebarIconTile, SidebarResizeHandle, SidebarShell, Stack, Text } from "@/components/ui/appPrimitives";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipPositioner } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { StatsWidget } from "./StatsWidget";
import { ProjectSettingsDialog } from "./ProjectSettingsDialog";

interface IProjectSidebarProps {
  projects: IProject[];
  selectedProject: string | null;
  onSelectProject: (project: string | null) => void;
  onRefresh: () => void;
  onProjectsChanged: () => Promise<void>;
  isLoading?: boolean;
}

const MIN_WIDTH = 200;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 256;
const RESIZE_STEP = 16;
const SIDEBAR_ID = "project-sidebar";

function clampSidebarWidth(nextWidth: number): number {
  return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, nextWidth));
}

export function ProjectSidebar({
  projects,
  selectedProject,
  onSelectProject,
  onRefresh,
  onProjectsChanged,
  isLoading,
}: IProjectSidebarProps) {
  const totalIssues = projects.reduce((sum, p) => sum + (p.issueCount || 0), 0);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  const updateWidth = useCallback((nextWidth: number) => {
    setWidth(clampSidebarWidth(nextWidth));
  }, []);

  const startResizing = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsResizing(true);
  }, []);

  const handleResizeKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        setWidth((currentWidth) => clampSidebarWidth(currentWidth - RESIZE_STEP));
        break;
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        setWidth((currentWidth) => clampSidebarWidth(currentWidth + RESIZE_STEP));
        break;
      case "Home":
        event.preventDefault();
        setWidth(MIN_WIDTH);
        break;
      case "End":
        event.preventDefault();
        setWidth(MAX_WIDTH);
        break;
      default:
        break;
    }
  }, []);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!isResizing) {
        return;
      }

      updateWidth(event.clientX);
    };

    const stopResizing = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", stopResizing);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", stopResizing);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, updateWidth]);

  return (
    <SidebarShell id={SIDEBAR_ID} width={width} testId="ProjectSidebar">
      {/* Header */}
      <Stack variant="sidebarHeader">
        <Stack variant="sidebarHeaderRow">
          <Stack variant="sidebarBrand">
            <SidebarIconTile icon={Layers} />
            <Text variant="brand">Beads</Text>
          </Stack>
          <Stack variant="sidebarActions">
            <ThemeToggle />
            <ProjectSettingsDialog onProjectsChanged={onProjectsChanged} />
            <Tooltip>
              <TooltipTrigger
                aria-label="Refresh projects"
                onClick={onRefresh}
                disabled={isLoading}
                variant="toolbar"
                size="toolbar"
              >
                <Icon icon={RefreshCw} tone="secondary" animation={isLoading ? "spin" : "none"} />
              </TooltipTrigger>
              <TooltipPositioner side="right">
                <TooltipContent>Refresh projects</TooltipContent>
              </TooltipPositioner>
            </Tooltip>
          </Stack>
        </Stack>
      </Stack>

      {/* All Projects Option */}
      <Stack variant="sidebarTopNav">
        <Button
          onClick={() => onSelectProject(null)}
          variant="navigation"
          size="nav-lg"
          isActive={selectedProject === null}
        >
          <SidebarIconTile icon={Layers} />
          <Stack variant="navTextBlock">
            <Text as="div" variant="navTitleStrong" wrap="truncate">All Projects</Text>
            <Text as="div" variant="monoMuted">{totalIssues} open</Text>
          </Stack>
        </Button>
      </Stack>

      {/* Divider */}
      <Stack variant="sidebarSectionLabel">
        <Text as="div" variant="sectionLabel">Projects</Text>
      </Stack>

      {/* Project List */}
      <ScrollArea layout="fill" paddingX="sidebar">
        <Stack variant="sidebarProjectList">
          {projects.map((project) => (
            <Button
              key={project.path}
              onClick={() => onSelectProject(project.name)}
              variant="navigation"
              size="nav"
              isActive={selectedProject === project.name}
            >
              <SidebarIconTile icon={FolderGit2} tone="secondary" variant="project" />
              <Stack variant="navTextBlock">
                <Text as="div" variant="navTitle" wrap="truncate">{project.name}</Text>
                {project.issueCount !== undefined && project.issueCount > 0 && (
                  <Text as="div" variant="monoMuted">{project.issueCount} open</Text>
                )}
              </Stack>
              {project.issueCount !== undefined && project.issueCount > 0 && (
                <Pill variant="count">{project.issueCount}</Pill>
              )}
            </Button>
          ))}
        </Stack>
      </ScrollArea>

      {/* Stats Widget */}
      <Stack variant="sidebarStats">
        <StatsWidget expanded={false} />
      </Stack>

      {/* Footer */}
      <Stack variant="sidebarFooter">
        <Text as="div" variant="monoMuted" align="center">{projects.length} projects</Text>
      </Stack>

      {/* Resize Handle */}
      <SidebarResizeHandle
        sidebarId={SIDEBAR_ID}
        minWidth={MIN_WIDTH}
        maxWidth={MAX_WIDTH}
        width={width}
        isResizing={isResizing}
        onKeyDown={handleResizeKeyDown}
        onPointerDown={startResizing}
      />
    </SidebarShell>
  );
}
