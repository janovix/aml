import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { TransactionEditView } from "./TransactionEditView";
import * as transactionsApi from "@/lib/api/transactions";
import { mockTransactions } from "@/data/mockTransactions";
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
	usePathname: () => "/test-org/transactions/TRX-2024-001/edit",
	useSearchParams: () => new URLSearchParams(),
	useParams: () => ({ orgSlug: "test-org", id: "TRX-2024-001" }),
}));

vi.mock("@/hooks/use-toast", () => ({
	useToast: () => ({
		toast: vi.fn(),
		toasts: [],
	}),
}));

vi.mock("@/lib/api/transactions", () => ({
	getTransactionById: vi.fn(),
	updateTransaction: vi.fn(),
}));

vi.mock("../catalogs/CatalogSelector", () => ({
	CatalogSelector: () => <div>CatalogSelector</div>,
}));

describe("TransactionEditView", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders edit transaction header", async () => {
		const transaction = mockTransactions[0];
		vi.mocked(transactionsApi.getTransactionById).mockResolvedValue(
			transaction,
		);

		renderWithProviders(<TransactionEditView transactionId="TRX-2024-001" />);

		await waitFor(
			() => {
				expect(screen.getByText("Editar Transacción")).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);
	});
});
