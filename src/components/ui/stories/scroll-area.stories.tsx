import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";

import { ScrollArea } from "../scroll-area";

function getViewport(root: HTMLElement): HTMLElement {
  const viewport = root.querySelector('[data-slot="scroll-area-viewport"]');
  if (!(viewport instanceof HTMLElement)) {
    throw new Error("Expected a scroll area viewport");
  }

  return viewport;
}

const meta: Meta<typeof ScrollArea> = {
  title: "beads-dashboard/components/ui/scroll-area",
  component: ScrollArea,
};

export default meta;
type Story = StoryObj<typeof ScrollArea>;

const Default: Story = {
  render: () => (
    <ScrollArea demo="default">
      <div className="space-y-2 p-3">
        {Array.from({ length: 20 }, (_, index) => (
          <div key={index}>Scrollable row {index + 1}</div>
        ))}
      </div>
    </ScrollArea>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvas.getByTestId("ScrollArea");
    const viewport = getViewport(root);

    await expect(root).toBeVisible();
    await expect(viewport).toBeVisible();
    await expect(canvas.getByText("Scrollable row 20")).toBeInTheDocument();
  },
};

export { Default as ScrollArea };
