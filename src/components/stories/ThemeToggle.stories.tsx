import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { ThemeToggle } from "../ThemeToggle";

const meta: Meta<typeof ThemeToggle> = {
  component: ThemeToggle,
  title: "beads-dashboard/components/ThemeToggle",
};

export default meta;
type Story = StoryObj<typeof ThemeToggle>;

const Default: Story = {
  play: async ({ canvasElement, mount }) => {
    const previousTheme = window.localStorage.getItem("theme");
    const previousClassName = document.documentElement.className;

    try {
      window.localStorage.setItem("theme", "dark");
      document.documentElement.className = "dark";

      await mount();

      const canvas = within(canvasElement);
      const trigger = canvas.getByRole("button", { name: "Toggle theme" });

      await userEvent.click(trigger);
      await userEvent.keyboard("{ArrowDown}");
      await userEvent.keyboard("{Enter}");

      await expect(document.documentElement).toHaveClass("light");
      await expect(window.localStorage.getItem("theme")).toBe("light");

      await userEvent.click(trigger);
      await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
      await userEvent.keyboard("{Enter}");

      await waitFor(() => {
        expect(window.localStorage.getItem("theme")).toBe("system");
      });
    } finally {
      if (previousTheme === null) {
        window.localStorage.removeItem("theme");
      } else {
        window.localStorage.setItem("theme", previousTheme);
      }
      document.documentElement.className = previousClassName;
    }
  },
};

export { Default as ThemeToggle };
