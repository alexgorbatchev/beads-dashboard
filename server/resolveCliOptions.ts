import fs from "node:fs";
import path from "node:path";

type PathKind = "directory" | "file" | "missing";

export interface IPathInspector {
  getPathKind(targetPath: string): PathKind;
}

export interface ICliOptions {
  rootPath: string;
  shouldShowHelp: boolean;
}

const nodePathInspector: IPathInspector = {
  getPathKind(targetPath: string): PathKind {
    try {
      const stats = fs.statSync(targetPath);
      return stats.isDirectory() ? "directory" : "file";
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        return "missing";
      }

      throw error;
    }
  },
};

export function getCliUsage(commandName: string): string {
  return `Usage: ${commandName} [path]

Start Beads Dashboard for the current directory or the specified path.

Arguments:
  path  Directory to scan for Beads projects. Defaults to the current working directory.`;
}

export function resolveCliOptions(
  args: string[],
  cwd: string,
  pathInspector: IPathInspector = nodePathInspector,
): ICliOptions {
  const firstArg = args[0];
  if (firstArg === "--help" || firstArg === "-h") {
    return {
      rootPath: path.resolve(cwd),
      shouldShowHelp: true,
    };
  }

  if (args.length > 1) {
    throw new Error("Expected zero or one path argument.");
  }

  const rootPath = path.resolve(cwd, firstArg ?? ".");
  const pathKind = pathInspector.getPathKind(rootPath);

  if (pathKind === "missing") {
    throw new Error(`Beads Dashboard target path does not exist: ${rootPath}`);
  }

  if (pathKind !== "directory") {
    throw new Error(`Beads Dashboard target path is not a directory: ${rootPath}`);
  }

  return {
    rootPath,
    shouldShowHelp: false,
  };
}
