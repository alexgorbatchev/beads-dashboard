import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../card";

const meta: Meta<typeof Card> = {
  title: "beads-dashboard/components/ui/card",
  component: Card,
};

export default meta;
type Story = StoryObj<typeof Card>;

const Default: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Build status</CardTitle>
        <CardDescription>Latest deployment checks for the dashboard.</CardDescription>
      </CardHeader>
      <CardContent>All green across API and UI smoke tests.</CardContent>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("Build status")).toBeVisible();
    await expect(canvas.getByText("Latest deployment checks for the dashboard.")).toBeVisible();
    await expect(canvas.getByText("All green across API and UI smoke tests.")).toBeVisible();
  },
};

export { Default as Card };
