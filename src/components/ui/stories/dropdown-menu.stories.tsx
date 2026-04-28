import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPositioner,
  DropdownMenuTrigger,
} from "../dropdown-menu";

function DropdownMenuHarness() {
  const [lastAction, setLastAction] = useState("none");

  return (
    <div className="flex flex-col gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger className="rounded-md border px-3 py-2">Open menu</DropdownMenuTrigger>
        <DropdownMenuPositioner align="start">
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setLastAction("Duplicate")}>Duplicate</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLastAction("Archive")}>Archive</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPositioner>
      </DropdownMenu>
      <div>Last action: {lastAction}</div>
    </div>
  );
}

const meta: Meta<typeof DropdownMenu> = {
  title: "beads-dashboard/components/ui/dropdown-menu",
  component: DropdownMenu,
};

export default meta;
type Story = StoryObj<typeof DropdownMenu>;

const Default: Story = {
  render: () => <DropdownMenuHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Open menu" });

    await userEvent.click(trigger);
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");

    await expect(canvas.getByText("Last action: Archive")).toBeVisible();
  },
};

export { Default as DropdownMenu };
