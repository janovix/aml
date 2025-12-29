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
				// View-level components are mostly composition/markup; keep coverage focused
				// on shared logic/components.
				"src/components/clients/*View.tsx",
				"src/components/transactions/*View.tsx",
				"src/hooks/use-mobile.ts", // shadcn component hook
				"src/types/catalog.ts", // Type definitions only, no runtime code
				"src/types/transaction.ts", // Type definitions only, no runtime code
				"src/types/client-address.ts", // Type definitions only, no runtime code
				"src/types/client-document.ts", // Type definitions only, no runtime code
				// Next.js App Router entrypoints/route wiring (typically thin wrappers)
				"src/app/**",
				// Next.js middleware - integration tested
				"src/middleware.ts",
				// Server-side auth utilities - better suited for integration testing
				"src/lib/auth/**",
				// Settings page - simple form, low business value for unit tests
				"src/components/settings/**",
			],
			thresholds: {
				lines: 85,
				functions: 85,
				statements: 85,
				branches: 85,
			},
		},
	},
});
