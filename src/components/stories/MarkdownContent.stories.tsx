import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "@storybook/test";
import { MarkdownContent } from "../MarkdownContent";

const meta: Meta<typeof MarkdownContent> = {
  title: "beads-dashboard/components/MarkdownContent",
  component: MarkdownContent,
};

export default meta;
type Story = StoryObj<typeof MarkdownContent>;

const Default: Story = {
  args: {
    content: "## Hello World",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const element = canvas.getByTestId("MarkdownContent");
    await expect(element).toBeInTheDocument();
  },
};

export { Default as MarkdownContent };
