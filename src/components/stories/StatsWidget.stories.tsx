import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatsWidget } from "../StatsWidget";

const meta: Meta<typeof StatsWidget> = {
  component: StatsWidget,
  title: "beads-dashboard/components/StatsWidget",
};
export default meta;
type Story = StoryObj<typeof StatsWidget>;
const Default: Story = {
  play: async () => {},
};
export { Default as StatsWidget };
