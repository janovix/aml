import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TransactionDetailPageContent } from "./TransactionDetailPageContent";
import { mockTransactions } from "@/data/mockTransactions";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
	}),
	usePathname: () => `/transactions/test-id`,
}));

describe("TransactionDetailPageContent", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders transaction not found message when transaction doesn't exist", () => {
		render(<TransactionDetailPageContent transactionId="non-existent" />);

		expect(screen.getByText("Transacción no encontrada")).toBeInTheDocument();
		expect(
			screen.getByText(/La transacción con ID non-existent no existe/),
		).toBeInTheDocument();
	});

	it("renders transaction details when transaction exists", () => {
		const transaction = mockTransactions[0];
		render(<TransactionDetailPageContent transactionId={transaction.id} />);

		expect(
			screen.getByText(
				new RegExp(`Transacción ${transaction.reference || transaction.id}`),
			),
		).toBeInTheDocument();
	});

	it("displays transaction amount", () => {
		const transaction = mockTransactions[0];
		render(<TransactionDetailPageContent transactionId={transaction.id} />);

		// Check that amount is displayed (could be formatted as currency)
		// The amount 50000 might appear as "50,000" or "50000" or with currency symbols
		const amountString = transaction.amount.toString();
		const integerPart = amountString.split(".")[0];
		// Look for the amount number (could be formatted with commas)
		const amountTexts = screen.queryAllByText(
			new RegExp(`50[,\\s]?000|${integerPart}`),
		);
		expect(amountTexts.length).toBeGreaterThan(0);
	});

	it("displays transaction type badge", () => {
		const transaction = mockTransactions[0];
		render(<TransactionDetailPageContent transactionId={transaction.id} />);

		const typeLabels = [
			"Depósito",
			"Retiro",
			"Transferencia",
			"Pago",
			"Cobranza",
			"Otro",
		];
		const typeLabelsFound = typeLabels.filter((label) => {
			const elements = screen.queryAllByText(label);
			return elements.length > 0;
		});
		expect(typeLabelsFound.length).toBeGreaterThan(0);
	});

	it("displays transaction status badge", () => {
		const transaction = mockTransactions[0];
		render(<TransactionDetailPageContent transactionId={transaction.id} />);

		const statusLabels = [
			"Completada",
			"Pendiente",
			"En Revisión",
			"Rechazada",
			"Cancelada",
		];
		const statusLabelsFound = statusLabels.filter((label) => {
			const elements = screen.queryAllByText(label);
			return elements.length > 0;
		});
		expect(statusLabelsFound.length).toBeGreaterThan(0);
	});

	it("displays client information", () => {
		const transaction = mockTransactions[0];
		render(<TransactionDetailPageContent transactionId={transaction.id} />);

		const clientInfoElements = screen.getAllByText("Información del Cliente");
		const clientNameElements = screen.getAllByText(transaction.clientName);
		expect(clientInfoElements.length).toBeGreaterThan(0);
		expect(clientNameElements.length).toBeGreaterThan(0);
	});

	it("displays transaction dates section", () => {
		const transaction = mockTransactions[0];
		render(<TransactionDetailPageContent transactionId={transaction.id} />);

		const datesElements = screen.getAllByText("Fechas");
		expect(datesElements.length).toBeGreaterThan(0);
	});

	it("displays alert count", () => {
		const transaction = mockTransactions[0];
		render(<TransactionDetailPageContent transactionId={transaction.id} />);

		const alertCountElements = screen.getAllByText(
			transaction.alertCount.toString(),
		);
		expect(alertCountElements.length).toBeGreaterThan(0);
	});

	it("displays generate report button", () => {
		const transaction = mockTransactions[0];
		render(<TransactionDetailPageContent transactionId={transaction.id} />);

		const reportButtons = screen.getAllByText("Generar Reporte");
		expect(reportButtons.length).toBeGreaterThan(0);
	});

	it("displays additional information section", () => {
		const transaction = mockTransactions[0];
		render(<TransactionDetailPageContent transactionId={transaction.id} />);

		const additionalInfoElements = screen.getAllByText("Información Adicional");
		expect(additionalInfoElements.length).toBeGreaterThan(0);
	});
});
