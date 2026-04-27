import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../button";
import { expect, userEvent, within } from "storybook/test";

const meta: Meta<typeof Button> = {
  title: "beads-dashboard/components/ui/button",
  component: Button,
};

export default meta;
type Story = StoryObj<typeof Button>;

const Default: Story = {
  args: {
    children: "Button",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByTestId("Button");
    await expect(button).toBeInTheDocument();
    await userEvent.click(button);
  },
};

export { Default as Button };
