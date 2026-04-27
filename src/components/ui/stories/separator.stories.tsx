import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { Separator } from "../separator";

const meta: Meta<typeof Separator> = {
  title: "beads-dashboard/components/ui/separator",
  component: Separator,
};

export default meta;
type Story = StoryObj<typeof Separator>;

const Default: Story = {
  args: {
    orientation: "horizontal",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const separator = canvas.getByTestId("Separator");
    await expect(separator).toBeInTheDocument();
  },
};

export { Default as Separator };
