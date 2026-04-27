import { Meta, StoryObj } from '@storybook/react';
import { DropdownMenu } from '../dropdown-menu';

const meta: Meta<typeof DropdownMenu> = {
  component: DropdownMenu,
  title: "beads-dashboard/components/ui/dropdown-menu",
};
export default meta;
type Story = StoryObj<typeof DropdownMenu>;
const Default: Story = {
  play: async () => {},
};
export { Default as DropdownMenu };
