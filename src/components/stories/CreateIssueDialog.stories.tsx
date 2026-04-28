import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { createMockDashboardApi } from "@/stories/createMockDashboardApi";
import { dashboardStoryFixtures } from "@/stories/dashboardStoryFixtures";
import { CreateIssueDialog } from "../CreateIssueDialog";

const meta: Meta<typeof CreateIssueDialog> = {
  component: CreateIssueDialog,
  title: "beads-dashboard/components/CreateIssueDialog",
};

export default meta;
type Story = StoryObj<typeof CreateIssueDialog>;

const Default: Story = {
  args: {
    project: null,
    projects: dashboardStoryFixtures.projects.map((project) => ({ name: project.name })),
    onCreated: fn(),
  },
  play: async ({ args, canvasElement, mount }) => {
    const mockApi = createMockDashboardApi();
    const restoreFetch = mockApi.install();

    try {
      await mount();
      const canvas = within(canvasElement);
      const documentBody = within(canvasElement.ownerDocument.body);

      await userEvent.click(canvas.getByRole("button", { name: "New Issue" }));
      await userEvent.click(documentBody.getByRole("button", { name: "Create Issue" }));
      await expect(documentBody.getByText("Please select a project")).toBeVisible();

      const comboboxes = documentBody.getAllByRole("combobox");
      await userEvent.selectOptions(comboboxes[0], "alpha");
      await userEvent.type(documentBody.getByPlaceholderText("What needs to be done?"), "Add Storybook regression coverage");
      await userEvent.type(documentBody.getByPlaceholderText("Add more details..."), "Exercise the create issue flow through play tests.");
      await userEvent.selectOptions(comboboxes[1], "1");
      await userEvent.selectOptions(comboboxes[2], "feature");
      await userEvent.click(documentBody.getByRole("button", { name: "Create Issue" }));

      await waitFor(() => {
        expect(documentBody.queryByRole("dialog", { name: "Create New Issue" })).not.toBeInTheDocument();
      });
      await expect(args.onCreated).toHaveBeenCalledTimes(1);
      await expect(mockApi.getIssues().some((issue) => issue.title === "Add Storybook regression coverage")).toBe(true);
    } finally {
      restoreFetch();
    }
  },
};

export { Default as CreateIssueDialog };
