import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../tabs";

const meta: Meta<typeof Tabs> = {
  title: "beads-dashboard/components/ui/tabs",
  component: Tabs,
};

export default meta;
type Story = StoryObj<typeof Tabs>;

const Default: Story = {
  render: (args) => (
    <Tabs defaultValue="account" {...args}>
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">Account settings</TabsContent>
      <TabsContent value="password">Password settings</TabsContent>
    </Tabs>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const passwordTab = canvas.getByRole("tab", { name: "Password" });

    await userEvent.click(passwordTab);

    await expect(passwordTab).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByText("Password settings")).toBeVisible();
  },
};

export { Default as Tabs };
