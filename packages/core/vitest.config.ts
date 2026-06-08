import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,js}"],
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
