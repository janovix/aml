import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { TransactionCreateView } from "./TransactionCreateView";
import { LanguageProvider } from "@/components/LanguageProvider";

// Helper to render with LanguageProvider - force Spanish for consistent testing
const renderWithProviders = (ui: React.ReactElement) => {
	return render(ui, {
		wrapper: ({ children }) => (
			<LanguageProvider defaultLanguage="es">{children}</LanguageProvider>
		),
	});
};

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
	}),
	usePathname: () => "/test-org/transactions/new",
	useSearchParams: () => ({
		get: () => null,
	}),
	useParams: () => ({ orgSlug: "test-org" }),
}));

describe("TransactionCreateView", () => {
	it("renders create transaction header", () => {
		renderWithProviders(<TransactionCreateView />);
		expect(screen.getByText("Nueva Transacción")).toBeInTheDocument();
	});
});
