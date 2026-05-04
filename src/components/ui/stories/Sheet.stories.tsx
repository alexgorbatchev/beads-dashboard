import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Sheet as SheetRoot, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../Sheet";

const meta: Meta<typeof SheetRoot> = {
  title: "beads-dashboard/components/ui/Sheet",
  component: SheetRoot,
};

export default meta;
type Story = StoryObj<typeof SheetRoot>;

export const Sheet: Story = {
  render: (args) => (
    <SheetRoot {...args}>
      <SheetTrigger>Open sheet</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Issue details</SheetTitle>
        </SheetHeader>
        <div>Keyboard shortcuts and issue metadata live here.</div>
      </SheetContent>
    </SheetRoot>
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

export const DetailWidth: Story = {
  render: (args) => (
    <SheetRoot {...args} defaultOpen>
      <SheetContent size="detail">
        <SheetHeader>
          <SheetTitle>Issue details</SheetTitle>
        </SheetHeader>
        <div>Expanded issue metadata and history live here.</div>
      </SheetContent>
    </SheetRoot>
  ),
  play: async ({ canvasElement }) => {
    const documentBody = within(canvasElement.ownerDocument.body);

    await expect(documentBody.getByRole("dialog", { name: "Issue details" })).toBeVisible();
    const sheetContent = documentBody
      .getByText("Expanded issue metadata and history live here.")
      .closest<HTMLElement>("[data-slot='sheet-content']");

    await expect(sheetContent?.getBoundingClientRect().width).toBe(750);
  },
};
