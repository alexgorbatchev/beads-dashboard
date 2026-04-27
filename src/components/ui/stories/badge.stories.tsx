import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "@storybook/test";
import { Badge } from "../badge";

const meta: Meta<typeof Badge> = {
  title: "beads-dashboard/components/ui/badge",
  component: Badge,
};

export default meta;
type Story = StoryObj<typeof Badge>;

const Default: Story = {
  args: {
    children: "Badge",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByTestId("Badge");
    await expect(badge).toBeInTheDocument();
  },
};

export { Default as Badge };
