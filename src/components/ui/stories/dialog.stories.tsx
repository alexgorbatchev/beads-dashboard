import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "../dialog";

const meta: Meta<typeof Dialog> = {
  title: "beads-dashboard/components/ui/dialog",
  component: Dialog,
};

export default meta;
type Story = StoryObj<typeof Dialog>;

const Default: Story = {
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger>Open dialog</DialogTrigger>
      <DialogContent>
        <DialogTitle>Release checklist</DialogTitle>
        <DialogDescription>Verify the smoke tests before promoting this build.</DialogDescription>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const documentBody = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole("button", { name: "Open dialog" }));

    await expect(documentBody.getByRole("dialog", { name: "Release checklist" })).toBeVisible();
    await expect(documentBody.getByText("Verify the smoke tests before promoting this build.")).toBeVisible();

    await userEvent.click(documentBody.getByRole("button", { name: "Close" }));

    await waitFor(() => {
      expect(documentBody.queryByRole("dialog", { name: "Release checklist" })).not.toBeInTheDocument();
    });
  },
};

export { Default as Dialog };
