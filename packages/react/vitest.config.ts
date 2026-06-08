import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "cobertura"],
      thresholds: {
        lines: 85,
        branches: 85,
        functions: 85,
      },
      exclude: ["dist/**", "**/*.d.ts"],
    },
  },
});
