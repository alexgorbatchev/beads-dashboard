import { Meta, StoryObj } from "@storybook/react";
import { ScrollBar } from "../ui/scroll-bar";

const meta: Meta<typeof ScrollBar> = {
  component: ScrollBar,
  title: "beads-dashboard/components/ui/scroll-bar",
};
export default meta;
type Story = StoryObj<typeof ScrollBar>;
const Default: Story = {
  play: async () => {},
};
export { Default as ScrollBar };
