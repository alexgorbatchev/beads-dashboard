import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Input } from "../input";

const meta: Meta<typeof Input> = {
  title: "beads-dashboard/components/ui/input",
  component: Input,
};

export default meta;
type Story = StoryObj<typeof Input>;

const Default: Story = {
  args: {
    placeholder: "Input...",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByTestId("Input");
    await expect(input).toBeInTheDocument();
  },
};

export { Default as Input };
