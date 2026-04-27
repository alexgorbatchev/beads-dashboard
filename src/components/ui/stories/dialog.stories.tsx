import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "../dialog";

const meta: Meta<typeof Dialog> = {
  title: "beads-dashboard/components/ui/dialog",
  component: Dialog,
};

export default meta;
type Story = StoryObj<typeof Dialog>;

const Default: Story = {
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent>
        <DialogTitle>Title</DialogTitle>
        <DialogDescription>Description</DialogDescription>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByText("Open");
    await expect(trigger).toBeInTheDocument();
  },
};

export { Default as Dialog };
