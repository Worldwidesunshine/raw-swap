import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    testTimeout: 30_000,
    hookTimeout: 30_000,
    include: [path.resolve(__dirname, "**/*.test.ts")],
  },
});
