#!/usr/bin/env bun
import { getCliUsage, resolveCliOptions } from "../server/resolveCliOptions";

const commandName = "beads-dashboard";

try {
  const options = resolveCliOptions(Bun.argv.slice(2), process.cwd());
  if (options.shouldShowHelp) {
    console.log(getCliUsage(commandName));
    process.exit(0);
  }

  process.chdir(options.rootPath);

  const { startServer } = await import("../server/app");
  await startServer();
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
    console.error("");
    console.error(getCliUsage(commandName));
    process.exit(1);
  }

  throw error;
}
