import { defineConfig } from "vitest/config";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import path from "path";
import { fileURLToPath } from "url";

const dirname = typeof __dirname !== "undefined"
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  cacheDir: "./.cache/vite",
  test: {
    projects: [
      {
        test: {
          name: "unit",
          environment: "jsdom",
          include: ["src/**/__tests__/**/*.test.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
          exclude: ["**/*.stories.*"],
          alias: {
            "@": path.resolve(dirname, "./src"),
          },
        },
      },
      {
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [
              { browser: "chromium" },
            ],
          },
          setupFiles: [".storybook/vitest.setup.ts"],
        },
        plugins: [
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
            storybookScript: "bun run storybook",
            storybookUrl: "http://127.0.0.1:6006",
          }),
        ],
      },
    ],
  },
});
