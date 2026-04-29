import assert from "node:assert";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "bun:test";

import {
  addProjectSetting,
  getConfiguredProjects,
  readProjectSettings,
  removeProjectSetting,
  updateProjectSetting,
} from "../projectSettings";
import { resetBeadsCliRunnerForTests, setBeadsCliRunnerForTests } from "../db";
import type { BeadsCliExecutionResult, BeadsCliRunner } from "../getIssueFromBeadsCli";

interface IRecordedCommand {
  cwd: string;
  args: string[];
}

const tempPaths: string[] = [];

afterEach(() => {
  resetBeadsCliRunnerForTests();

  for (const tempPath of tempPaths.splice(0, tempPaths.length)) {
    rmSync(tempPath, { recursive: true, force: true });
  }
});

function createTempRoot(): string {
  const tempDir = join(process.cwd(), ".tmp");
  mkdirSync(tempDir, { recursive: true });

  const rootPath = mkdtempSync(join(tempDir, "project-settings-"));
  tempPaths.push(rootPath);
  return rootPath;
}

function createProjectDirectory(rootPath: string, projectName: string): string {
  const projectPath = join(rootPath, projectName);
  mkdirSync(projectPath, { recursive: true });

  return projectPath;
}

function commandKey(cwd: string, args: string[]): string {
  return `${cwd} :: ${args.join(" ")}`;
}

function success(stdout: string): BeadsCliExecutionResult {
  return { exitCode: 0, stdout, stderr: "" };
}

function failure(): BeadsCliExecutionResult {
  return { exitCode: 1, stdout: "", stderr: "not a beads project" };
}

function createRunner(outputs: Map<string, BeadsCliExecutionResult>, recordedCommands: IRecordedCommand[]): BeadsCliRunner {
  return async (args, cwd) => {
    recordedCommands.push({ cwd, args });
    const output = outputs.get(commandKey(cwd, args));
    assert(output, `Missing fake bd output for ${commandKey(cwd, args)}`);
    return output;
  };
}

function seedProjectCommands(projectPath: string, outputs: Map<string, BeadsCliExecutionResult>, issueCount: number): void {
  outputs.set(commandKey(projectPath, ["where", "--json"]), success(JSON.stringify({ schema_version: 1, path: `${projectPath}/.beads` })));
  outputs.set(
    commandKey(projectPath, ["status", "--json"]),
    success(JSON.stringify({ schema_version: 1, summary: { total_issues: issueCount, closed_issues: 0 } })),
  );
}

describe("projectSettings", () => {
  it("reads configured projects from .projects.json and resolves relative paths", async () => {
    const rootPath = createTempRoot();
    const alphaPath = createProjectDirectory(rootPath, "alpha");
    const betaPath = createProjectDirectory(rootPath, "beta");
    const settingsPath = join(rootPath, ".projects.json");
    const recordedCommands: IRecordedCommand[] = [];
    const outputs = new Map<string, BeadsCliExecutionResult>();
    seedProjectCommands(alphaPath, outputs, 1);
    seedProjectCommands(betaPath, outputs, 1);
    outputs.set(commandKey(join(rootPath, "missing"), ["where", "--json"]), failure());
    setBeadsCliRunnerForTests(createRunner(outputs, recordedCommands));

    writeFileSync(
      settingsPath,
      JSON.stringify(
        {
          projects: [{ path: "./alpha" }, { path: betaPath }, { path: "./missing" }],
        },
        null,
        2,
      ) + "\n",
    );

    const settings = await readProjectSettings(settingsPath);

    expect(settings.exists).toBe(true);
    expect(settings.projects).toEqual([
      {
        path: "./alpha",
        resolvedPath: alphaPath,
        name: "alpha",
        issueCount: 1,
        isValid: true,
        error: null,
      },
      {
        path: betaPath,
        resolvedPath: betaPath,
        name: "beta",
        issueCount: 1,
        isValid: true,
        error: null,
      },
      {
        path: "./missing",
        resolvedPath: join(rootPath, "missing"),
        name: null,
        issueCount: undefined,
        isValid: false,
        error: "No Beads project found by bd at the configured path.",
      },
    ]);
    expect((await getConfiguredProjects(settingsPath)).map((project) => project.name)).toEqual(["alpha", "beta"]);
  });

  it("rejects duplicate configured project names that would collide in the API", async () => {
    const rootPath = createTempRoot();
    const firstPath = createProjectDirectory(join(rootPath, "workspace-one"), "shared-name");
    const secondPath = createProjectDirectory(join(rootPath, "workspace-two"), "shared-name");
    const settingsPath = join(rootPath, ".projects.json");
    const recordedCommands: IRecordedCommand[] = [];
    const outputs = new Map<string, BeadsCliExecutionResult>();
    seedProjectCommands(firstPath, outputs, 1);
    seedProjectCommands(secondPath, outputs, 1);
    setBeadsCliRunnerForTests(createRunner(outputs, recordedCommands));

    writeFileSync(
      settingsPath,
      JSON.stringify(
        {
          projects: [{ path: firstPath }, { path: secondPath }],
        },
        null,
        2,
      ) + "\n",
    );

    const settings = await readProjectSettings(settingsPath);

    expect(settings.projects).toEqual([
      {
        path: firstPath,
        resolvedPath: firstPath,
        name: "shared-name",
        issueCount: undefined,
        isValid: false,
        error: "Configured project name collides with another entry: shared-name",
      },
      {
        path: secondPath,
        resolvedPath: secondPath,
        name: "shared-name",
        issueCount: undefined,
        isValid: false,
        error: "Configured project name collides with another entry: shared-name",
      },
    ]);
    expect(await getConfiguredProjects(settingsPath)).toEqual([]);
  });

  it("adds, updates, and removes configured project paths", async () => {
    const rootPath = createTempRoot();
    const alphaPath = createProjectDirectory(rootPath, "alpha");
    const betaPath = createProjectDirectory(rootPath, "beta");
    const settingsPath = join(rootPath, ".projects.json");
    const recordedCommands: IRecordedCommand[] = [];
    const outputs = new Map<string, BeadsCliExecutionResult>();
    seedProjectCommands(alphaPath, outputs, 1);
    seedProjectCommands(betaPath, outputs, 1);
    setBeadsCliRunnerForTests(createRunner(outputs, recordedCommands));

    const addedSettings = await addProjectSetting(settingsPath, "./alpha");
    expect(addedSettings.projects.map((project) => project.path)).toEqual(["./alpha"]);
    expect(JSON.parse(readFileSync(settingsPath, "utf8"))).toEqual({
      projects: [{ path: "./alpha" }],
    });

    const updatedSettings = await updateProjectSetting(settingsPath, "./alpha", "./beta");
    expect(updatedSettings.projects.map((project) => project.path)).toEqual(["./beta"]);
    expect(JSON.parse(readFileSync(settingsPath, "utf8"))).toEqual({
      projects: [{ path: "./beta" }],
    });

    const removedSettings = await removeProjectSetting(settingsPath, "./beta");
    expect(removedSettings.projects).toEqual([]);
    expect(JSON.parse(readFileSync(settingsPath, "utf8"))).toEqual({ projects: [] });

    const emptySettings = await readProjectSettings(settingsPath);
    assert(emptySettings.exists);
    expect(emptySettings.projects).toEqual([]);
  });
});
