import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { App } from "../App";
import { createMockDashboardApi } from "./createMockDashboardApi";

const meta: Meta<typeof App> = {
  component: App,
  title: "beads-dashboard/main",
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
      const search = canvas.getByPlaceholderText("Search issues...");

      await waitFor(() => {
        expect(canvas.getByText("Investigate websocket reconnect failure")).toBeVisible();
      });

      await userEvent.keyboard("/");
      await expect(search).toHaveFocus();

      await userEvent.keyboard("{Escape}");
      await expect(search).not.toHaveFocus();

      await userEvent.keyboard("{ArrowDown}");
      await userEvent.keyboard("{Enter}");

      await expect(documentBody.getByRole("dialog", { name: /Investigate websocket reconnect failure/i })).toBeVisible();

      await userEvent.keyboard("{Escape}");
      await waitFor(() => {
        expect(documentBody.queryByRole("dialog", { name: /Investigate websocket reconnect failure/i })).not.toBeInTheDocument();
      });
    } finally {
      restoreFetch();
    }
  },
};

export { Default as Main };
