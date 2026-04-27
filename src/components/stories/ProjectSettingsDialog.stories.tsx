import { Meta, StoryObj } from '@storybook/react';
import { ProjectSettingsDialog } from '../ProjectSettingsDialog';

const meta: Meta<typeof ProjectSettingsDialog> = {
  component: ProjectSettingsDialog,
  title: "beads-dashboard/components/ProjectSettingsDialog",
};
export default meta;
type Story = StoryObj<typeof ProjectSettingsDialog>;
const Default: Story = {
  play: async () => {},
  args: {
    onProjectsChanged: async () => {},
  },
};
export { Default as ProjectSettingsDialog };
