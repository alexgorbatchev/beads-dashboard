import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { createMockDashboardApi } from "@/stories/createMockDashboardApi";
import { dashboardStoryFixtures } from "@/stories/dashboardStoryFixtures";
import { ProjectSidebar } from "../ProjectSidebar";

const meta: Meta<typeof ProjectSidebar> = {
  component: ProjectSidebar,
  title: "beads-dashboard/components/ProjectSidebar",
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof ProjectSidebar>;

const Default: Story = {
  args: {
    projects: dashboardStoryFixtures.projects,
    selectedProject: null,
    onSelectProject: fn(),
    onRefresh: fn(),
    onProjectsChanged: async () => {},
  },
  play: async ({ args, canvasElement, mount }) => {
    const mockApi = createMockDashboardApi();
    const restoreFetch = mockApi.install();

    try {
      await mount();
      const canvas = within(canvasElement);

      await waitFor(() => {
        expect(canvas.queryByText("Loading stats...")).not.toBeInTheDocument();
      });

      await userEvent.click(canvas.getByRole("button", { name: /Statistics/i }));
      await expect(canvas.getByText("1 Overdue")).toBeVisible();

      await userEvent.click(canvas.getByRole("button", { name: /beta/i }));
      await userEvent.click(canvas.getByRole("button", { name: /All Projects/i }));

      await expect(args.onSelectProject).toHaveBeenNthCalledWith(1, "beta");
      await expect(args.onSelectProject).toHaveBeenNthCalledWith(2, null);
    } finally {
      restoreFetch();
    }
  },
};

export { Default as ProjectSidebar };
