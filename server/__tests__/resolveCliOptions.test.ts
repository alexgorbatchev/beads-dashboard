import { describe, expect, it } from "bun:test";

import { getCliUsage, resolveCliOptions, type IPathInspector } from "../resolveCliOptions";

const cwdPath = "/workspace/current";

const directoryInspector: IPathInspector = {
  getPathKind() {
    return "directory";
  },
};

const fileInspector: IPathInspector = {
  getPathKind() {
    return "file";
  },
};

const missingInspector: IPathInspector = {
  getPathKind() {
    return "missing";
  },
};

describe("resolveCliOptions", () => {
  it("uses the current working directory when no path argument is provided", () => {
    expect(resolveCliOptions([], cwdPath, directoryInspector)).toEqual({
      rootPath: cwdPath,
      shouldShowHelp: false,
    });
  });

  it("resolves a relative path argument from the current working directory", () => {
    expect(resolveCliOptions(["./projects"], cwdPath, directoryInspector)).toEqual({
      rootPath: "/workspace/current/projects",
      shouldShowHelp: false,
    });
  });

  it("resolves an absolute path argument without rewriting it relative to cwd", () => {
    expect(resolveCliOptions(["/data/beads"], cwdPath, directoryInspector)).toEqual({
      rootPath: "/data/beads",
      shouldShowHelp: false,
    });
  });

  it("returns help mode for --help", () => {
    expect(resolveCliOptions(["--help"], cwdPath, missingInspector)).toEqual({
      rootPath: cwdPath,
      shouldShowHelp: true,
    });
  });

  it("rejects more than one path argument", () => {
    expect(() => resolveCliOptions(["one", "two"], cwdPath, directoryInspector)).toThrow(
      "Expected zero or one path argument.",
    );
  });

  it("rejects a path that does not exist", () => {
    expect(() => resolveCliOptions(["./missing"], cwdPath, missingInspector)).toThrow(
      "Beads Dashboard target path does not exist: /workspace/current/missing",
    );
  });

  it("rejects a path that is not a directory", () => {
    expect(() => resolveCliOptions(["./file.txt"], cwdPath, fileInspector)).toThrow(
      "Beads Dashboard target path is not a directory: /workspace/current/file.txt",
    );
  });
});

describe("getCliUsage", () => {
  it("documents the package-name path form", () => {
    expect(getCliUsage("beads-dashboard")).toMatchInlineSnapshot(`
      "Usage: beads-dashboard [path]

      Start Beads Dashboard for the current directory or the specified path.

      Arguments:
        path  Directory to scan for Beads projects. Defaults to the current working directory."
    `);
  });
});
