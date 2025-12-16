import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [react(), tsconfigPaths()],
	test: {
		environment: "jsdom",
		setupFiles: ["./src/test/setup.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html", "json-summary", "lcov"],
			reportsDirectory: "coverage",
			include: ["src/**/*.{ts,tsx}"],
			exclude: [
				"**/*.d.ts",
				"**/*.test.*",
				"**/*.spec.*",
				"src/test/**",
				"src/stories/**",
				"src/components/ui/**",
				"src/hooks/use-mobile.ts", // shadcn component hook
				"src/types/catalog.ts", // Type definitions only, no runtime code
				// Next.js App Router entrypoints/route wiring (typically thin wrappers)
				"src/app/**",
			],
			thresholds: {
				lines: 60,
				functions: 48,
				statements: 59,
				branches: 69,
			},
		},
	},
});
