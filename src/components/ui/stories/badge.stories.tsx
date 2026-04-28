import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";

import { Badge as BadgeComponent } from "../badge";

const meta: Meta<typeof BadgeComponent> = {
  title: "beads-dashboard/components/ui/badge",
  component: BadgeComponent,
};

export default meta;
type Story = StoryObj<typeof BadgeComponent>;

export const Badge: Story = {
  args: {
    children: "Urgent",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Urgent")).toBeVisible();
  },
};

export const States: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <BadgeComponent>Default</BadgeComponent>
      <BadgeComponent state="secondary">Secondary</BadgeComponent>
      <BadgeComponent state="destructive">Destructive</BadgeComponent>
      <BadgeComponent state="outline">Outline</BadgeComponent>
      <BadgeComponent state="label">Label</BadgeComponent>
      <BadgeComponent state="removableLabel">Removable label</BadgeComponent>
      <BadgeComponent state="filter">Filter</BadgeComponent>
      <BadgeComponent state="filterActive">Active filter</BadgeComponent>
      <BadgeComponent state="statusOpen">Open</BadgeComponent>
      <BadgeComponent state="statusProgress">In Progress</BadgeComponent>
      <BadgeComponent state="statusClosed">Closed</BadgeComponent>
      <BadgeComponent state="statusBlocked">Blocked</BadgeComponent>
      <BadgeComponent state="statusDeferred">Deferred</BadgeComponent>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Default")).toBeVisible();
    await expect(canvas.getByText("Secondary")).toBeVisible();
    await expect(canvas.getByText("Destructive")).toBeVisible();
    await expect(canvas.getByText("Outline")).toBeVisible();
    await expect(canvas.getByText("Label")).toBeVisible();
    await expect(canvas.getByText("Removable label")).toBeVisible();
    await expect(canvas.getByText("Filter")).toBeVisible();
    await expect(canvas.getByText("Active filter")).toBeVisible();
    await expect(canvas.getByText("Open")).toBeVisible();
    await expect(canvas.getByText("In Progress")).toBeVisible();
    await expect(canvas.getByText("Closed")).toBeVisible();
    await expect(canvas.getByText("Blocked")).toBeVisible();
    await expect(canvas.getByText("Deferred")).toBeVisible();
  },
};

export const Action: Story = {
  args: {
    isAction: true,
    state: "filter",
    children: "Toggle label",
    onClick: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Toggle label" }));
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};
