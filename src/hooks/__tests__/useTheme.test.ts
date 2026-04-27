import { describe, it, expect } from "bun:test";
import { useTheme } from "../useTheme";

describe("useTheme", () => {
  it("should be defined", () => {
    expect(useTheme).toBeDefined();
  });
});
