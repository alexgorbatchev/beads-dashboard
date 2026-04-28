import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";

import { ScrollArea } from "../scroll-area";
import { ScrollBar } from "../scroll-bar";

function getViewport(root: HTMLElement): HTMLElement {
  const viewport = root.querySelector('[data-slot="scroll-area-viewport"]');
  if (!(viewport instanceof HTMLElement)) {
    throw new Error("Expected a scroll area viewport");
  }

  return viewport;
}

const meta: Meta<typeof ScrollBar> = {
  component: ScrollBar,
  title: "beads-dashboard/components/ui/scroll-bar",
};

export default meta;
type Story = StoryObj<typeof ScrollBar>;

const Default: Story = {
  render: (args) => (
    <ScrollArea className="h-32 w-40 rounded-md border">
      <div className="h-48 w-[420px] p-4">Wide content for horizontal scrolling</div>
      <ScrollBar {...args} orientation="horizontal" />
    </ScrollArea>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvas.getByTestId("ScrollArea");
    const viewport = getViewport(root);

    await expect(root).toBeVisible();
    await expect(viewport).toBeVisible();
    await expect(canvas.getByText("Wide content for horizontal scrolling")).toBeInTheDocument();
    await expect(viewport.style.overflow).toBe("scroll");
  },
};

export { Default as ScrollBar };
