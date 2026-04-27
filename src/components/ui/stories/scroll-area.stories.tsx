import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { ScrollArea } from "../scroll-area";

const meta: Meta<typeof ScrollArea> = {
  title: "beads-dashboard/components/ui/scroll-area",
  component: ScrollArea,
};

export default meta;
type Story = StoryObj<typeof ScrollArea>;

const Default: Story = {
  args: {
    children: "Scrollable content",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const element = canvas.getByTestId("ScrollArea");
    await expect(element).toBeInTheDocument();
  },
};

export { Default as ScrollArea };
