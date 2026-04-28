import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { App } from "../App";
import { createMockDashboardApi } from "./createMockDashboardApi";

const meta: Meta<typeof App> = {
  component: App,
  title: "beads-dashboard/App",
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof App>;

const Default: Story = {
  play: async ({ canvasElement, mount }) => {
    const mockApi = createMockDashboardApi();
    const restoreFetch = mockApi.install();

    try {
      await mount();
      const canvas = within(canvasElement);
      const documentBody = within(canvasElement.ownerDocument.body);
      const sidebar = within(canvas.getByTestId("ProjectSidebar"));
      const issueList = within(canvas.getByTestId("IssueList"));

      await waitFor(() => {
        expect(issueList.getByText("Investigate websocket reconnect failure")).toBeVisible();
      });

      await userEvent.click(sidebar.getByRole("button", { name: /beta/i }));
      await waitFor(() => {
        expect(issueList.getByRole("heading", { name: "beta" })).toBeVisible();
      });

      await userEvent.click(issueList.getByRole("button", { name: /Ship billing API pagination/i }));
      await expect(documentBody.getByRole("dialog", { name: /Ship billing API pagination/i })).toBeVisible();

      await userEvent.click(documentBody.getByRole("heading", { name: /Ship billing API pagination/i }));
      const titleInput = documentBody.getByDisplayValue("Ship billing API pagination");
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, "Ship billing API pagination v2{enter}");

      await waitFor(() => {
        expect(documentBody.getByRole("heading", { name: /Ship billing API pagination v2/i })).toBeVisible();
      });
    } finally {
      restoreFetch();
    }
  },
};

export { Default as App };
