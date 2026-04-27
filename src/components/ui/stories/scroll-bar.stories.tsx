import type { Meta, StoryObj } from "@storybook/react";
import { ScrollBar } from "../scroll-bar";
import { ScrollArea } from "../scroll-area";

const meta: Meta<typeof ScrollBar> = {
  component: ScrollBar,
  title: "beads-dashboard/components/ui/scroll-bar",
};
export default meta;
type Story = StoryObj<typeof ScrollBar>;
const Default: Story = {
  render: (args) => (
    <ScrollArea className="h-20 w-20 border">
      <div className="h-40 w-40 p-4">Scroll me</div>
      <ScrollBar {...args} />
    </ScrollArea>
  ),
  play: async () => {},
};
export { Default as ScrollBar };
