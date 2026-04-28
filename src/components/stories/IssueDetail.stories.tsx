import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";

import { dashboardStoryFixtures } from "@/stories/dashboardStoryFixtures";
import { IssueDetail } from "../IssueDetail";

const meta: Meta<typeof IssueDetail> = {
  component: IssueDetail,
  title: "beads-dashboard/components/IssueDetail",
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof IssueDetail>;

const Default: Story = {
  args: {
    issue: dashboardStoryFixtures.detailIssue,
    open: true,
    onClose: fn(),
    onUpdateStatus: fn(),
    onUpdatePriority: fn(),
    onUpdateField: fn(),
    onAddLabel: fn(),
    onRemoveLabel: fn(),
    onUpdateDueDate: fn(),
    onDelete: fn(),
    onTogglePin: fn(),
    onSelectIssue: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const documentBody = within(canvasElement.ownerDocument.body);

    await expect(documentBody.getByRole("dialog", { name: /Investigate websocket reconnect failure/i })).toBeVisible();
    await expect(documentBody.getByRole("button", { name: /High/i })).toBeVisible();
    await expect(documentBody.getByRole("button", { name: /Open/i })).toBeVisible();

    await userEvent.click(documentBody.getByRole("heading", { name: /Investigate websocket reconnect failure/i }));
    const titleInput = documentBody.getByDisplayValue("Investigate websocket reconnect failure");
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Investigate websocket reconnects{enter}");
    await expect(args.onUpdateField).toHaveBeenCalledWith("title", "Investigate websocket reconnects");

    await userEvent.click(documentBody.getByRole("button", { name: /Unpin issue/i }));
    await expect(args.onTogglePin).toHaveBeenCalledTimes(1);

    await userEvent.click(documentBody.getByRole("button", { name: "Add" }));
    await userEvent.type(documentBody.getByPlaceholderText("Label name..."), "cli{enter}");
    await expect(args.onAddLabel).toHaveBeenCalledWith("cli");

    await userEvent.click(documentBody.getByRole("button", { name: /BETA-201/i }));
    await expect(args.onSelectIssue).toHaveBeenCalledWith("BETA-201");

    await userEvent.click(documentBody.getByRole("button", { name: "Delete" }));
    await userEvent.click(documentBody.getByRole("button", { name: "Confirm?" }));
    await expect(args.onDelete).toHaveBeenCalledTimes(1);
  },
};

export { Default as IssueDetail };
