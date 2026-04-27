import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Card, CardHeader, CardTitle, CardContent } from "../card";

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
        <CardTitle>Card Title</CardTitle>
      </CardHeader>
      <CardContent>Card content</CardContent>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const card = canvas.getByTestId("Card");
    await expect(card).toBeVisible();
  },
};

export { Default as Card };
