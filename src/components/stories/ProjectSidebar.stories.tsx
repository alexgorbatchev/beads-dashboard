import { Meta, StoryObj } from '@storybook/react';
import { ProjectSidebar } from '../ProjectSidebar';

const meta: Meta<typeof ProjectSidebar> = {
  component: ProjectSidebar,
  title: "beads-dashboard/components/ProjectSidebar",
};
export default meta;
type Story = StoryObj<typeof ProjectSidebar>;
const Default: Story = {
  play: async () => {},
  args: {
    projects: [],
    selectedProject: null,
    onSelectProject: () => {},
    onRefresh: () => {},
    onProjectsChanged: async () => {},
  },
};
export { Default as ProjectSidebar };
