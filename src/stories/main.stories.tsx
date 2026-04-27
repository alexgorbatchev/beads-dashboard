import type { Meta, StoryObj } from "@storybook/react-vite";
import { App } from "../App";

const meta: Meta<typeof App> = {
  component: App,
  title: "beads-dashboard/main",
};
export default meta;
type Story = StoryObj<typeof App>;
const Default: Story = {
  play: async () => {},
};
export { Default as Main };
