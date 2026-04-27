import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "../sheet";

const meta: Meta<typeof Sheet> = {
  title: "beads-dashboard/components/ui/sheet",
  component: Sheet,
};

export default meta;
type Story = StoryObj<typeof Sheet>;

const Default: Story = {
  render: (args) => (
    <Sheet {...args}>
      <SheetTrigger>Open</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Title</SheetTitle>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByText("Open");
    await expect(trigger).toBeInTheDocument();
  },
};

export { Default as Sheet };
