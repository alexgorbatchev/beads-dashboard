import { Meta, StoryObj } from '@storybook/react';
import { IssueList } from '../IssueList';

const meta: Meta<typeof IssueList> = {
  component: IssueList,
  title: "beads-dashboard/components/IssueList",
};
export default meta;
type Story = StoryObj<typeof IssueList>;
const Default: Story = {
  play: async () => {},
  args: {
    issues: [],
    selectedProject: null,
    onSelectIssue: () => {},
  },
};
export { Default as IssueList };
