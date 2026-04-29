import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";

import { NativeSelect } from "../NativeSelect";

const meta: Meta<typeof NativeSelect> = {
  title: "beads-dashboard/components/ui/NativeSelect",
  component: NativeSelect,
};

export default meta;
type Story = StoryObj<typeof meta>;

const Default: Story = {
  render: () => (
    <NativeSelect aria-label="Priority">
      <option value="0">Urgent</option>
      <option value="1">High</option>
      <option value="2">Medium</option>
    </NativeSelect>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByLabelText("Priority");

    await userEvent.selectOptions(select, "2");

    await expect(select).toHaveValue("2");
  },
};

export { Default as NativeSelect };
