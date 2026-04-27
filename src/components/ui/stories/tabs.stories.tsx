import type { Meta, StoryObj } from "@storybook/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../tabs";
import { expect, within } from "@storybook/test";

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
      <TabsContent value="account">Account content</TabsContent>
      <TabsContent value="password">Password content</TabsContent>
    </Tabs>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tabs = canvas.getByTestId("tabs");
    await expect(tabs).toBeInTheDocument();
  },
};

export { Default as Tabs };
