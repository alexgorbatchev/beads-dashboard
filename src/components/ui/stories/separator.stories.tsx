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
  render: (args) => (
    <div className="w-64 space-y-3">
      <div>Backlog</div>
      <Separator {...args} />
      <div>In progress</div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("separator")).toBeVisible();
  },
};

export { Default as Separator };
