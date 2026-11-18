import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";

import { Input } from "../input";

const meta: Meta<typeof Input> = {
  title: "beads-dashboard/components/ui/input",
  component: Input,
};

export default meta;
type Story = StoryObj<typeof Input>;

const Default: Story = {
  args: {
    placeholder: "Search issues...",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText("Search issues...");

    await userEvent.type(input, "websocket");

    await expect(input).toHaveValue("websocket");
  },
};

export { Default as Input };
