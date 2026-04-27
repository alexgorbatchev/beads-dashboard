import { Meta, StoryObj } from "@storybook/react";
import { IssueRow } from "../IssueRow";

const meta: Meta<typeof IssueRow> = {
  component: IssueRow,
  title: "beads-dashboard/components/IssueRow",
};
export default meta;
type Story = StoryObj<typeof IssueRow>;
const Default: Story = {
  play: async () => {},
  args: {
    issue: {
      id: "ISSUE-1",
      title: "Test Issue",
      status: "open",
      priority: 2,
      updated_at: new Date().toISOString(),
      description: "Test description",
      issue_type: "task",
    },
    viewMode: "comfortable",
    onClick: () => {},
  },
};
export { Default as IssueRow };
