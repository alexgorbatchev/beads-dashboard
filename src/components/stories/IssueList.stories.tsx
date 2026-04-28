import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";

import { dashboardStoryFixtures } from "@/stories/dashboardStoryFixtures";
import { IssueList } from "../IssueList";

const meta: Meta<typeof IssueList> = {
  component: IssueList,
  title: "beads-dashboard/components/IssueList",
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof IssueList>;

const Default: Story = {
  args: {
    issues: dashboardStoryFixtures.issues,
    selectedProject: null,
    onSelectIssue: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const search = canvas.getByPlaceholderText("Search issues...");

    await userEvent.type(search, "billing");
    await expect(canvas.getByText("Ship billing API pagination")).toBeVisible();
    await expect(canvas.queryByText("Investigate websocket reconnect failure")).not.toBeInTheDocument();

    await userEvent.clear(search);
    await userEvent.click(canvas.getByRole("button", { name: /Ready/i }));

    await expect(canvas.getByText("Refresh keyboard shortcut help copy")).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: /Refresh keyboard shortcut help copy/i }));
    await expect(args.onSelectIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "ALPHA-103",
      }),
    );

    await userEvent.click(canvas.getByRole("button", { name: /All/i }));
    await userEvent.click(canvas.getByRole("button", { name: "Kanban view" }));

    await expect(canvas.getAllByText("In Progress").length).toBeGreaterThan(0);
    await expect(canvas.getAllByText("Deferred").length).toBeGreaterThan(0);
  },
};

export { Default as IssueList };
