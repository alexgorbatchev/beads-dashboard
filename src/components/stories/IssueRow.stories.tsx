import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";

import { dashboardStoryFixtures } from "@/stories/dashboardStoryFixtures";
import { IssueRow } from "../IssueRow";

const meta: Meta<typeof IssueRow> = {
  component: IssueRow,
  title: "beads-dashboard/components/IssueRow",
};

export default meta;
type Story = StoryObj<typeof IssueRow>;

const Default: Story = {
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
    await expect(canvas.getByText(/Reconnect logic drops pending updates/i)).toBeVisible();
    await expect(args.onClick).toHaveBeenCalledTimes(1);
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

export { Default as IssueRow };
