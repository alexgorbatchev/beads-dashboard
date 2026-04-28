import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { createMockDashboardApi } from "@/stories/createMockDashboardApi";
import { StatsWidget } from "../StatsWidget";

const meta: Meta<typeof StatsWidget> = {
  component: StatsWidget,
  title: "beads-dashboard/components/StatsWidget",
};

export default meta;
type Story = StoryObj<typeof StatsWidget>;

const Default: Story = {
  play: async ({ canvasElement, mount }) => {
    const mockApi = createMockDashboardApi();
    const restoreFetch = mockApi.install();

    try {
      await mount();
      const canvas = within(canvasElement);

      await waitFor(() => {
        expect(canvas.queryByText("Loading stats...")).not.toBeInTheDocument();
      });

      const toggle = canvas.getByRole("button", { name: /Statistics/i });
      await userEvent.click(toggle);

      await expect(canvas.getByText("Active")).toBeVisible();
      await expect(canvas.getByText("4")).toBeVisible();
      await expect(canvas.getByText("1 Ready")).toBeVisible();
      await expect(canvas.getByText("1 Overdue")).toBeVisible();
      await expect(canvas.getByText("alpha")).toBeVisible();
      await expect(canvas.getByText("3/3")).toBeVisible();
    } finally {
      restoreFetch();
    }
  },
};

export { Default as StatsWidget };
