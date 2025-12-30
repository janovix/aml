import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { TransactionDetailsView } from "./TransactionDetailsView";
import * as transactionsApi from "@/lib/api/transactions";
import { mockTransactions } from "@/data/mockTransactions";

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
	}),
	usePathname: () => "/transactions/TRX-2024-001",
}));

vi.mock("@/hooks/use-toast", () => ({
	useToast: () => ({
		toast: vi.fn(),
		toasts: [],
	}),
}));

vi.mock("@/lib/api/transactions", () => ({
	getTransactionById: vi.fn(),
	deleteTransaction: vi.fn(),
}));

describe("TransactionDetailsView", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the transaction id in the header", async () => {
		const transaction = mockTransactions[0];
		vi.mocked(transactionsApi.getTransactionById).mockResolvedValue(
			transaction,
		);

		render(<TransactionDetailsView transactionId="TRX-2024-001" />);

		await waitFor(
			() => {
				expect(screen.getByText("TRX-2024-001")).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);
	});

	it("displays formatted payment amount", async () => {
		const transaction = mockTransactions[0];
		vi.mocked(transactionsApi.getTransactionById).mockResolvedValue(
			transaction,
		);

		render(<TransactionDetailsView transactionId="TRX-2024-001" />);

		await waitFor(
			() => {
				// Check that the formatted amount is displayed (e.g., "$450,000.00" for MXN)
				const formattedAmount = new Intl.NumberFormat("es-MX", {
					style: "currency",
					currency: transaction.currency,
				}).format(parseFloat(transaction.amount));
				// Check for the amount in the main "Monto" section (should be in a text-3xl element)
				const amountElements = screen.getAllByText(formattedAmount);
				expect(amountElements.length).toBeGreaterThan(0);
				// Verify at least one is in the main amount section (has text-3xl class)
				const mainAmountElement = amountElements.find((el) =>
					el.className.includes("text-3xl"),
				);
				expect(mainAmountElement).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);
	});
});
