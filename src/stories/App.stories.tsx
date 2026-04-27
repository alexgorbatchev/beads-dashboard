import { Meta, StoryObj } from "@storybook/react";
import { App } from "../App";

const meta: Meta<typeof App> = {
  component: App,
  title: "beads-dashboard/App",
};
export default meta;
type Story = StoryObj<typeof App>;
const Default: Story = {
  play: async () => {},
};
export { Default as App };
