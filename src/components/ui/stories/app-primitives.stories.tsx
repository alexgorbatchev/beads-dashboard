import { Circle, Search } from "lucide-react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";

import {
  Icon,
  Panel,
  Pill,
  Stack,
  Text,
} from "../appPrimitives";

const meta: Meta<typeof Stack> = {
  title: "beads-dashboard/components/ui/app-primitives",
  component: Stack,
};

export default meta;
type Story = StoryObj<typeof meta>;

const Default: Story = {
  args: {
    children: null,
  },
  render: () => (
    <Stack variant="cardList">
      <Panel variant="surface">
        <Stack variant="row">
          <Icon icon={Search} tone="accent" />
          <Text variant="navTitleStrong">Search-ready primitive group</Text>
          <Pill>UI</Pill>
        </Stack>
      </Panel>
      <Stack variant="row">
        <Icon icon={Circle} tone="open" />
        <Text variant="sectionLabelOpen">Open section</Text>
      </Stack>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("Search-ready primitive group")).toBeVisible();
    await expect(canvas.getByText("Open section")).toBeVisible();
  },
};

export { Default as AppPrimitives };
