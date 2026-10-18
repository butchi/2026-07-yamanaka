import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "packages/**/*.test.ts", "scripts/**/*.test.js"],
    environment: "node",
  },
});
