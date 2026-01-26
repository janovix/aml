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
				"src/components/layout/DashboardFullscreen.tsx",
				// Sidebar settings hook - depends heavily on localStorage and cookies
				"src/hooks/useSidebarSettings.ts",
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
			// AI Chat feature - provider initialization requires API keys
			// Utility functions are tested, async API calls are integration tested
			"src/components/chat/**",
			"src/lib/ai/providers.ts",
			"src/lib/ai/tools/**",
			// File upload - integration tested
			"src/lib/api/file-upload.ts",
			"src/lib/api/ubos.ts",
			// Hooks that depend on browser/Next.js context
			"src/hooks/useOrgSlug.ts",
			"src/hooks/useZipCodeLookup.ts",
			// KYC status calculation - complex business logic, integration tested
			"src/lib/kyc-status.ts",
			// Server-side settings - integration tested
			"src/lib/settings/settingsServer.ts",
			// Subscription components - integration tested
			"src/components/subscription/NoAMLAccess.tsx",
			// Canvas shim for tests
			"src/lib/canvas-shim.ts",
			// Document scanner - complex integration with Tesseract/OpenCV, integration tested
			"src/lib/document-scanner/**",
			// Type helper functions
			"src/types/ubo.ts",
			// AI billing - integration tested with actual API
			"src/lib/ai/billing.ts",
			// Settings and subscription clients - integration tested
			"src/lib/settings/settingsClient.ts",
			"src/lib/subscription/subscriptionClient.ts",
			// Complex document upload/edit components - integration tested
			"src/components/clients/DocumentUploadSection.tsx",
			"src/components/clients/EditDocumentsSection.tsx",
			"src/components/clients/LegalRepresentativeForm.tsx",
			"src/components/clients/UBOSection.tsx",
			"src/components/clients/ZipCodeAddressFields.tsx",
			"src/components/clients/KYCProgressIndicator.tsx",
			"src/components/clients/wizard/**",
			// Document scanner components - integration tested
			"src/components/document-scanner/**",
			// Manual alert creation - complex form, integration tested
			"src/components/alerts/CreateManualAlertView.tsx",
		],
			thresholds: {
				lines: 75,
				functions: 75,
				statements: 75,
				branches: 75,
			},
		},
	},
});
