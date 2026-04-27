import { Meta, StoryObj } from "@storybook/react";
import { IssueDetail } from "../IssueDetail";

const meta: Meta<typeof IssueDetail> = {
  component: IssueDetail,
  title: "beads-dashboard/components/IssueDetail",
};
export default meta;
type Story = StoryObj<typeof IssueDetail>;
const Default: Story = {
  play: async () => {},
  args: {
    issue: null,
    open: false,
    onClose: () => {},
    onUpdateStatus: () => {},
    onUpdatePriority: () => {},
    onDelete: () => {},
  },
};
export { Default as IssueDetail };
