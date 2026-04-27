import { setProjectAnnotations } from "@storybook/react-vite";
import * as projectAnnotations from "./preview.ts";

// Suppress React error boundaries logging expected test errors to stderr
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  if (
    args[0] &&
    typeof args[0] === "string" &&
    (args[0].includes("The above error occurred in the") ||
      args[0].includes("React will try to recreate this component tree") ||
      args[0] === "Uncaught error:" ||
      args[0] === "Error caught by boundary:")
  ) {
    return;
  }
  originalConsoleError(...args);
};

setProjectAnnotations(projectAnnotations);