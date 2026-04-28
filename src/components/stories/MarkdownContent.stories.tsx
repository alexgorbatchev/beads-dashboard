import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";

import { MarkdownContent } from "../MarkdownContent";

const meta: Meta<typeof MarkdownContent> = {
  title: "beads-dashboard/components/MarkdownContent",
  component: MarkdownContent,
};

export default meta;
type Story = StoryObj<typeof MarkdownContent>;

const Default: Story = {
  args: {
    content: "## Hello World\n\nRead the [release notes](https://example.com/releases).",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "release notes" });

    await expect(canvas.getByRole("heading", { name: "Hello World" })).toBeVisible();
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  },
};

export { Default as MarkdownContent };
