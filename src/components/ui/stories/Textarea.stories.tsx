import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";

import { Textarea } from "../Textarea";

const meta: Meta<typeof Textarea> = {
  title: "beads-dashboard/components/ui/Textarea",
  component: Textarea,
};

export default meta;
type Story = StoryObj<typeof meta>;

const Default: Story = {
  args: {
    placeholder: "Describe the issue...",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByPlaceholderText("Describe the issue...");

    await userEvent.type(textarea, "The issue happens after refresh.");

    await expect(textarea).toHaveValue("The issue happens after refresh.");
  },
};

export { Default as Textarea };
