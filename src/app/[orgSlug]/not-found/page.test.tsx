import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Suspense } from "react";
import React from "react";
import OrgNotFoundPage from "./page";
import { LanguageProvider } from "@/components/LanguageProvider";
import { translations } from "@/lib/translations";

// Helper to render with LanguageProvider - force Spanish for consistent testing
const renderWithProviders = (ui: React.ReactElement) => {
	return render(ui, {
		wrapper: ({ children }) => (
			<LanguageProvider defaultLanguage="es">{children}</LanguageProvider>
		),
	});
};

// Get Spanish translations for test assertions (default in Node.js test environment)
const t = (key: keyof typeof translations.es) => translations.es[key];

// Mock next/navigation
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
	}),
}));

// Mock window.history.back
const mockHistoryBack = vi.fn();
Object.defineProperty(window, "history", {
	value: { back: mockHistoryBack },
	writable: true,
});

describe("OrgNotFoundPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders not found message with org slug", async () => {
		const paramsPromise = Promise.resolve({ orgSlug: "acme" });

		await act(async () => {
			renderWithProviders(
				<Suspense fallback={<div>Loading...</div>}>
					<OrgNotFoundPage params={paramsPromise} />
				</Suspense>,
			);
			// Wait for the promise to resolve
			await paramsPromise;
		});

		expect(screen.getByText(t("errorOrgNotFound"))).toBeInTheDocument();
		expect(screen.getByText("acme")).toBeInTheDocument();
		// Use a function matcher since the description text is split across elements
		expect(
			screen.getByText((content) =>
				content.includes(t("errorOrgNotFoundDesc")),
			),
		).toBeInTheDocument();
	});

	it("renders explanation text", async () => {
		const paramsPromise = Promise.resolve({ orgSlug: "test-org" });

		await act(async () => {
			renderWithProviders(
				<Suspense fallback={<div>Loading...</div>}>
					<OrgNotFoundPage params={paramsPromise} />
				</Suspense>,
			);
			await paramsPromise;
		});

		expect(screen.getByText(t("errorOrgNotFoundReason"))).toBeInTheDocument();
	});

	it("renders Go Back button", async () => {
		const paramsPromise = Promise.resolve({ orgSlug: "test-org" });

		await act(async () => {
			renderWithProviders(
				<Suspense fallback={<div>Loading...</div>}>
					<OrgNotFoundPage params={paramsPromise} />
				</Suspense>,
			);
			await paramsPromise;
		});

		expect(
			screen.getByRole("button", { name: t("errorGoBack") }),
		).toBeInTheDocument();
	});

	it("renders Home link", async () => {
		const paramsPromise = Promise.resolve({ orgSlug: "test-org" });

		await act(async () => {
			renderWithProviders(
				<Suspense fallback={<div>Loading...</div>}>
					<OrgNotFoundPage params={paramsPromise} />
				</Suspense>,
			);
			await paramsPromise;
		});

		const homeLink = screen.getByRole("link", { name: t("errorHome") });
		expect(homeLink).toBeInTheDocument();
		expect(homeLink).toHaveAttribute("href", "/");
	});

	it("calls history.back when Go Back button is clicked", async () => {
		const user = userEvent.setup();
		const paramsPromise = Promise.resolve({ orgSlug: "test-org" });

		await act(async () => {
			renderWithProviders(
				<Suspense fallback={<div>Loading...</div>}>
					<OrgNotFoundPage params={paramsPromise} />
				</Suspense>,
			);
			await paramsPromise;
		});

		const backButton = screen.getByRole("button", { name: t("errorGoBack") });
		await user.click(backButton);

		expect(mockHistoryBack).toHaveBeenCalled();
	});
});
