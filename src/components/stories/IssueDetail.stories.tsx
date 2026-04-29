import type { Meta, StoryObj } from "@storybook/react";
import { useState, type ComponentProps } from "react";
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

function StatefulIssueDetail(args: ComponentProps<typeof IssueDetail>) {
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(args.isDeleteConfirmationOpen);

  return (
    <IssueDetail
      {...args}
      isDeleteConfirmationOpen={isDeleteConfirmationOpen}
      onRequestDelete={() => {
        args.onRequestDelete();
        setIsDeleteConfirmationOpen(true);
      }}
      onCancelDelete={() => {
        args.onCancelDelete();
        setIsDeleteConfirmationOpen(false);
      }}
      onConfirmDelete={() => {
        args.onConfirmDelete();
        setIsDeleteConfirmationOpen(false);
      }}
    />
  );
}

const Default: Story = {
  render: (args) => <StatefulIssueDetail {...args} />,
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
    isDeleteConfirmationOpen: false,
    onRequestDelete: fn(),
    onCancelDelete: fn(),
    onConfirmDelete: fn(),
    onTogglePin: fn(),
    onSelectIssue: fn(),
    gitDiff: null,
    isLoadingGitDiff: false,
    gitDiffError: null,
    onLoadGitDiff: fn(),
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

    await userEvent.click(documentBody.getByRole("button", { name: /Load diff/i }));
    await expect(args.onLoadGitDiff).toHaveBeenCalledTimes(1);

    await userEvent.click(documentBody.getByRole("button", { name: "Delete" }));
    await expect(args.onRequestDelete).toHaveBeenCalledTimes(1);
    await expect(documentBody.getByText("Delete this issue?")).toBeVisible();

    await userEvent.click(documentBody.getByRole("button", { name: "Cancel" }));
    await expect(args.onCancelDelete).toHaveBeenCalledTimes(1);
    await expect(documentBody.queryByText("Delete this issue?")).not.toBeInTheDocument();

    await userEvent.click(documentBody.getByRole("button", { name: "Delete" }));
    await userEvent.click(documentBody.getByRole("button", { name: "Delete issue" }));
    await expect(args.onConfirmDelete).toHaveBeenCalledTimes(1);
  },
};

export { Default as IssueDetail };
