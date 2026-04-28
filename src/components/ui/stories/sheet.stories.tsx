import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../sheet";

const meta: Meta<typeof Sheet> = {
  title: "beads-dashboard/components/ui/sheet",
  component: Sheet,
};

export default meta;
type Story = StoryObj<typeof Sheet>;

const Default: Story = {
  render: (args) => (
    <Sheet {...args}>
      <SheetTrigger>Open sheet</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Issue details</SheetTitle>
        </SheetHeader>
        <div>Keyboard shortcuts and issue metadata live here.</div>
      </SheetContent>
    </Sheet>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const documentBody = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole("button", { name: "Open sheet" }));

    await expect(documentBody.getByRole("dialog", { name: "Issue details" })).toBeVisible();
    await expect(documentBody.getByText("Keyboard shortcuts and issue metadata live here.")).toBeVisible();

    await userEvent.click(documentBody.getByRole("button", { name: "Close" }));

    await waitFor(() => {
      expect(documentBody.queryByRole("dialog", { name: "Issue details" })).not.toBeInTheDocument();
    });
  },
};

export { Default as Sheet };
