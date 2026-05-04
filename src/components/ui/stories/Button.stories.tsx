import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";

import { Button } from "../Button";

const meta: Meta<typeof Button> = {
  title: "beads-dashboard/components/ui/Button",
  component: Button,
};

export default meta;
type Story = StoryObj<typeof Button>;

const Default: Story = {
  args: {
    children: "Create issue",
    onClick: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Create issue" });

    await userEvent.click(button);

    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export { Default as Button };
