import { Meta, StoryObj } from "@storybook/react";
import { CreateIssueDialog } from "../CreateIssueDialog";

const meta: Meta<typeof CreateIssueDialog> = {
  component: CreateIssueDialog,
  title: "beads-dashboard/components/CreateIssueDialog",
};
export default meta;
type Story = StoryObj<typeof CreateIssueDialog>;
const Default: Story = {
  play: async () => {},
  args: {
    project: null,
    projects: [],
    onCreated: () => {},
  },
};
export { Default as CreateIssueDialog };
