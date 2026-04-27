import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "@storybook/test";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, TooltipPositioner } from "../tooltip";

const meta: Meta<typeof Tooltip> = {
  title: "beads-dashboard/components/ui/tooltip",
  component: Tooltip,
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

const Default: Story = {
  render: (args) => (
    <TooltipProvider>
      <Tooltip {...args}>
        <TooltipTrigger>Hover me</TooltipTrigger>
        <TooltipPositioner>
          <TooltipContent>Tooltip content</TooltipContent>
        </TooltipPositioner>
      </Tooltip>
    </TooltipProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByText("Hover me");
    await expect(trigger).toBeInTheDocument();
  },
};

export { Default as Tooltip };
