import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";

import type { IssueGitDiff } from "@/types";
import { IssueGitDiffPanel } from "../IssueGitDiffPanel";

const foundDiff: IssueGitDiff = {
  kind: "found",
  branchName: "feature/bd-1234-diff-view",
  baseBranch: "main",
  worktreePath: "/projects/example/.worktrees/bd-1234",
  status: " M src/App.tsx\n",
  branchDiff:
    "diff --git a/src/App.tsx b/src/App.tsx\n--- a/src/App.tsx\n+++ b/src/App.tsx\n@@ -1 +1,2 @@\n import React from 'react';\n+import { Diff } from './Diff';\n",
  worktreeDiff:
    "diff --git a/README.md b/README.md\n--- a/README.md\n+++ b/README.md\n@@ -1 +1,2 @@\n # Example\n+Document the diff view.\n",
};

const meta: Meta<typeof IssueGitDiffPanel> = {
  component: IssueGitDiffPanel,
  title: "beads-dashboard/components/IssueGitDiffPanel",
};

export default meta;
type Story = StoryObj<typeof IssueGitDiffPanel>;

export const Empty: Story = {
  args: {
    diff: null,
    isLoading: false,
    error: null,
    onLoad: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole("button", { name: /Load diff/i }));

    await expect(args.onLoad).toHaveBeenCalledTimes(1);
  },
};

export const Found: Story = {
  args: {
    diff: foundDiff,
    isLoading: false,
    error: null,
    onLoad: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("feature/bd-1234-diff-view")).toBeVisible();
    await expect(canvas.getByText("Committed branch diff")).toBeVisible();
    await expect(canvas.getByText("Uncommitted worktree diff")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: /Refresh diff/i }));

    await expect(args.onLoad).toHaveBeenCalledTimes(1);
  },
};

export const NotFound: Story = {
  args: {
    diff: {
      kind: "not_found",
      message: "No git branch or worktree containing issue id bd-missing was found.",
    },
    isLoading: false,
    error: null,
    onLoad: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("No git branch or worktree containing issue id bd-missing was found.")).toBeVisible();
  },
};

export const Error: Story = {
  args: {
    diff: null,
    isLoading: false,
    error: "Failed to fetch issue git diff",
    onLoad: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("alert")).toHaveTextContent("Failed to fetch issue git diff");
  },
};
