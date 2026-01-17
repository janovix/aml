import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [react(), tsconfigPaths()],
	test: {
		environment: "jsdom",
		setupFiles: ["./src/test/setup.ts"],
		coverage: {
			provider: "istanbul",
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
				// Sentry instrumentation files
				"src/instrumentation*.ts",
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
				// Layout components - primarily UI composition, hard to unit test branches
				"src/components/layout/DashboardLayout.tsx",
				"src/components/layout/Logo.tsx",
				// Client page content files that are mostly form composition
				"src/components/clients/ClientsPageContent.tsx",
				// Algtools UI re-exports - external library
				"src/algtools/ui.tsx",
				// Hooks with browser-only behavior difficult to test in jsdom
				"src/hooks/useViewportHeight.ts",
				"src/hooks/useJwt.ts",
				// URL-based hooks heavily dependent on Next.js navigation - integration tested
				"src/hooks/useUrlFilters.ts",
				"src/hooks/useDataTableUrlFilters.ts",
				"src/hooks/useOrgNavigation.ts",
				"src/lib/navigation.ts",
				// Test helpers themselves
				"src/lib/testHelpers.ts",
				// Barrel exports (index.ts) - re-exports only, no runtime logic
				"src/components/**/index.ts",
				// Type definition files - no runtime code
				"src/components/data-table/types.ts",
				// Import feature - integration tested via worker tests
				"src/lib/api/imports.ts",
				"src/hooks/useImportSSE.ts",
				"src/components/import/**",
				"src/types/import.ts",
			],
			thresholds: {
				lines: 80,
				functions: 80,
				statements: 80,
				branches: 80,
			},
		},
	},
});
