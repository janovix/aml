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
				expect(screen.getByText(formattedAmount)).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);
	});
});
