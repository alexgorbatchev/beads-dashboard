import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThemeToggle } from "../ThemeToggle";

const meta: Meta<typeof ThemeToggle> = {
  component: ThemeToggle,
  title: "beads-dashboard/components/ThemeToggle",
};
export default meta;
type Story = StoryObj<typeof ThemeToggle>;
const Default: Story = {
  play: async () => {},
};
export { Default as ThemeToggle };
