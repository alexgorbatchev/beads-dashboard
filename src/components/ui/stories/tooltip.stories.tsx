import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Tooltip, TooltipContent, TooltipPositioner, TooltipTrigger } from "../tooltip";

const meta: Meta<typeof Tooltip> = {
  title: "beads-dashboard/components/ui/tooltip",
  component: Tooltip,
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

const Default: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <TooltipTrigger>Hover me</TooltipTrigger>
      <TooltipPositioner>
        <TooltipContent>Tooltip content</TooltipContent>
      </TooltipPositioner>
    </Tooltip>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const documentBody = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByText("Hover me");

    await userEvent.hover(trigger);
    await expect(documentBody.getByText("Tooltip content")).toBeVisible();

    await userEvent.unhover(trigger);
    await waitFor(() => {
      expect(documentBody.queryByText("Tooltip content")).not.toBeInTheDocument();
    });
  },
};

export { Default as Tooltip };
