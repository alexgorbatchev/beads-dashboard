import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";

import { dashboardStoryFixtures } from "@/stories/dashboardStoryFixtures";
import type { ISsue } from "@/types";
import { IssueRow as IssueRowComponent } from "../IssueRow";

const meta: Meta<typeof IssueRowComponent> = {
  component: IssueRowComponent,
  title: "beads-dashboard/components/IssueRow",
};

export default meta;
type Story = StoryObj<typeof IssueRowComponent>;

export const IssueRow: Story = {
  args: {
    issue: dashboardStoryFixtures.detailIssue,
    viewMode: "comfortable",
    onClick: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const row = canvas.getByRole("button", { name: /Investigate websocket reconnect failure/i });

    await userEvent.click(row);

    await expect(canvas.getByText("alpha")).toBeVisible();
    await expect(canvas.getByText("Alex")).toBeVisible();
    await expect(canvas.getByText(/Reconnect logic drops pending updates/i)).toBeVisible();
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

const issueWithNoneAssignee: ISsue = {
  ...dashboardStoryFixtures.detailIssue,
  assignee: "none",
};

export const NoneAssignee: Story = {
  args: {
    issue: issueWithNoneAssignee,
    viewMode: "comfortable",
    onClick: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("Unassigned")).toBeVisible();
    await expect(canvas.queryByText("none")).not.toBeInTheDocument();
  },
};

export const InProgressStatusBadge: Story = {
  args: {
    issue: dashboardStoryFixtures.compactIssue,
    viewMode: "comfortable",
    onClick: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("In Progress")).toBeVisible();
    await expect(canvas.getByText("Optimize issue hydration in App bootstrap")).toBeVisible();
  },
};
