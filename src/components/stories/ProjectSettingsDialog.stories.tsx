import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { createMockDashboardApi } from "@/stories/createMockDashboardApi";
import { ProjectSettingsDialog } from "../ProjectSettingsDialog";

const meta: Meta<typeof ProjectSettingsDialog> = {
  component: ProjectSettingsDialog,
  title: "beads-dashboard/components/ProjectSettingsDialog",
};

export default meta;
type Story = StoryObj<typeof ProjectSettingsDialog>;

const Default: Story = {
  args: {
    onProjectsChanged: fn(async () => {}),
  },
  play: async ({ args, canvasElement, mount }) => {
    const mockApi = createMockDashboardApi();
    const restoreFetch = mockApi.install();

    try {
      await mount();
      const canvas = within(canvasElement);
      const documentBody = within(canvasElement.ownerDocument.body);

      await userEvent.click(canvas.getByRole("button", { name: "Manage projects" }));

      await waitFor(() => {
        expect(documentBody.queryByText("Loading project settings...")).not.toBeInTheDocument();
      });

      await expect(documentBody.getByText("No Beads project found by bd at the configured path.")).toBeVisible();

      const textboxes = documentBody.getAllByRole("textbox");
      const addProjectInput = textboxes[0];
      const alphaProjectInput = documentBody.getByDisplayValue("../alpha-project");

      await userEvent.type(addProjectInput, "../gamma-project");
      await userEvent.click(documentBody.getByRole("button", { name: "Add" }));
      await expect(documentBody.getByDisplayValue("../gamma-project")).toBeVisible();

      await userEvent.clear(alphaProjectInput);
      await userEvent.type(alphaProjectInput, "../alpha-renamed-project");
      await userEvent.click(documentBody.getByRole("button", { name: "Save ../alpha-project" }));
      await expect(documentBody.getByDisplayValue("../alpha-renamed-project")).toBeVisible();

      await userEvent.click(documentBody.getByRole("button", { name: "Delete ../missing-project" }));
      await waitFor(() => {
        expect(documentBody.queryByDisplayValue("../missing-project")).not.toBeInTheDocument();
      });

      await expect(args.onProjectsChanged).toHaveBeenCalledTimes(3);
    } finally {
      restoreFetch();
    }
  },
};

export { Default as ProjectSettingsDialog };
