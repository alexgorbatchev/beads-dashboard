import fs from "node:fs";
import path from "node:path";

import { getProjectStats, scanProjectDirectory, type Project } from "./db";

export const PROJECT_SETTINGS_FILE_NAME = ".projects.json";

interface IProjectSettingsEntry {
  path: string;
}

interface IProjectSettingsFile {
  projects: IProjectSettingsEntry[];
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

interface IProjectSettingsState {
  exists: boolean;
  entries: IProjectSettingsEntry[];
}

interface IResolvedProjectCandidate {
  path: string;
  resolvedPath: string;
  project: Project | null;
  error: string | null;
}

interface IProjectSettingsSummary {
  exists: boolean;
  projects: IConfiguredProjectSetting[];
  configuredProjects: Project[];
}

function isProjectSettingsEntry(value: unknown): value is IProjectSettingsEntry {
  return typeof value === "object" && value !== null && "path" in value && typeof value.path === "string";
}

function isProjectSettingsFile(value: unknown): value is IProjectSettingsFile {
  return (
    typeof value === "object" &&
    value !== null &&
    "projects" in value &&
    Array.isArray(value.projects) &&
    value.projects.every(isProjectSettingsEntry)
  );
}

function sanitizeProjectPath(projectPath: string): string {
  const trimmedProjectPath = projectPath.trim();
  if (trimmedProjectPath.length === 0) {
    throw new Error("Project path is required.");
  }

  return trimmedProjectPath;
}

function resolveConfiguredPath(settingsFilePath: string, configuredPath: string): string {
  if (path.isAbsolute(configuredPath)) {
    return path.normalize(configuredPath);
  }

  return path.resolve(path.dirname(settingsFilePath), configuredPath);
}

function readProjectSettingsState(settingsFilePath: string): IProjectSettingsState {
  if (!fs.existsSync(settingsFilePath)) {
    return { exists: false, entries: [] };
  }

  const content = fs.readFileSync(settingsFilePath, "utf8");
  const parsedContent: unknown = JSON.parse(content);

  if (!isProjectSettingsFile(parsedContent)) {
    throw new Error('Invalid .projects.json format. Expected {"projects":[{"path":"..."}]}');
  }

  return {
    exists: true,
    entries: parsedContent.projects.map((entry) => ({ path: sanitizeProjectPath(entry.path) })),
  };
}

function writeProjectSettingsState(settingsFilePath: string, entries: IProjectSettingsEntry[]): void {
  const nextSettings: IProjectSettingsFile = {
    projects: entries.map((entry) => ({ path: entry.path })),
  };

  fs.writeFileSync(settingsFilePath, `${JSON.stringify(nextSettings, null, 2)}\n`);
}

function summarizeProjectSettings(settingsFilePath: string): IProjectSettingsSummary {
  const settingsState = readProjectSettingsState(settingsFilePath);
  const candidates: IResolvedProjectCandidate[] = settingsState.entries.map((entry) => {
    const resolvedPath = resolveConfiguredPath(settingsFilePath, entry.path);
    const project = scanProjectDirectory(resolvedPath);

    return {
      path: entry.path,
      resolvedPath,
      project,
      error: project ? null : "No supported Beads project found at the configured path.",
    };
  });

  const candidateIndexesByName = new Map<string, number[]>();
  for (const [index, candidate] of candidates.entries()) {
    if (!candidate.project) {
      continue;
    }

    const existingIndexes = candidateIndexesByName.get(candidate.project.name) ?? [];
    candidateIndexesByName.set(candidate.project.name, [...existingIndexes, index]);
  }

  for (const [projectName, candidateIndexes] of candidateIndexesByName) {
    if (candidateIndexes.length < 2) {
      continue;
    }

    for (const candidateIndex of candidateIndexes) {
      candidates[candidateIndex] = {
        ...candidates[candidateIndex],
        error: `Configured project name collides with another entry: ${projectName}`,
      };
    }
  }

  const configuredProjects = candidates
    .filter((candidate) => candidate.project !== null && candidate.error === null)
    .map((candidate) => candidate.project);

  const projectsWithStats = getProjectStats(configuredProjects);
  const issueCountByPath = new Map(projectsWithStats.map((project) => [project.path, project.issueCount]));

  return {
    exists: settingsState.exists,
    configuredProjects: projectsWithStats,
    projects: candidates.map((candidate) => ({
      path: candidate.path,
      resolvedPath: candidate.resolvedPath,
      name: candidate.project?.name ?? null,
      issueCount: candidate.project ? issueCountByPath.get(candidate.project.path) : undefined,
      isValid: candidate.project !== null && candidate.error === null,
      error: candidate.error,
    })),
  };
}

function ensureUniqueConfiguredPath(
  settingsFilePath: string,
  entries: ProjectSettingsEntry[],
  nextPath: string,
  ignorePath?: string,
): void {
  const nextResolvedPath = resolveConfiguredPath(settingsFilePath, nextPath);

  for (const entry of entries) {
    if (ignorePath !== undefined && entry.path === ignorePath) {
      continue;
    }

    if (resolveConfiguredPath(settingsFilePath, entry.path) === nextResolvedPath) {
      throw new Error("Project path is already configured.");
    }
  }
}

export function readProjectSettings(settingsFilePath: string): IProjectSettings {
  const summary = summarizeProjectSettings(settingsFilePath);
  return {
    exists: summary.exists,
    projects: summary.projects,
  };
}

export function getConfiguredProjects(settingsFilePath: string): Project[] {
  return summarizeProjectSettings(settingsFilePath).configuredProjects;
}

export function addProjectSetting(settingsFilePath: string, projectPath: string): IProjectSettings {
  const settingsState = readProjectSettingsState(settingsFilePath);
  const sanitizedProjectPath = sanitizeProjectPath(projectPath);

  ensureUniqueConfiguredPath(settingsFilePath, settingsState.entries, sanitizedProjectPath);
  writeProjectSettingsState(settingsFilePath, [...settingsState.entries, { path: sanitizedProjectPath }]);

  return readProjectSettings(settingsFilePath);
}

export function updateProjectSetting(
  settingsFilePath: string,
  currentPath: string,
  nextPath: string,
): IProjectSettings {
  const settingsState = readProjectSettingsState(settingsFilePath);
  const sanitizedCurrentPath = sanitizeProjectPath(currentPath);
  const sanitizedNextPath = sanitizeProjectPath(nextPath);
  const nextEntries = settingsState.entries.map((entry) => ({ path: entry.path }));
  const entryIndex = nextEntries.findIndex((entry) => entry.path === sanitizedCurrentPath);

  if (entryIndex === -1) {
    throw new Error("Configured project was not found.");
  }

  ensureUniqueConfiguredPath(settingsFilePath, nextEntries, sanitizedNextPath, sanitizedCurrentPath);
  nextEntries[entryIndex] = { path: sanitizedNextPath };
  writeProjectSettingsState(settingsFilePath, nextEntries);

  return readProjectSettings(settingsFilePath);
}

export function removeProjectSetting(settingsFilePath: string, projectPath: string): IProjectSettings {
  const settingsState = readProjectSettingsState(settingsFilePath);
  const sanitizedProjectPath = sanitizeProjectPath(projectPath);
  const nextEntries = settingsState.entries.filter((entry) => entry.path !== sanitizedProjectPath);

  if (nextEntries.length === settingsState.entries.length) {
    throw new Error("Configured project was not found.");
  }

  writeProjectSettingsState(settingsFilePath, nextEntries);
  return readProjectSettings(settingsFilePath);
}
