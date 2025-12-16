import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransactionsTable } from "./TransactionsTable";
import { mockTransactions } from "@/data/mockTransactions";

const mockToast = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
	useToast: () => ({
		toast: mockToast,
		toasts: [],
	}),
}));

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
	}),
}));

describe("TransactionsTable", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders table with transaction data", () => {
		render(<TransactionsTable />);

		expect(screen.getByText("Lista de Transacciones")).toBeInTheDocument();
		expect(
			screen.getByText(
				new RegExp(`${mockTransactions.length} de \\d+ transacciones`),
			),
		).toBeInTheDocument();
	});

	it("renders all transaction rows", () => {
		render(<TransactionsTable />);

		mockTransactions.forEach((transaction) => {
			const elements = screen.getAllByText(transaction.clientName);
			expect(elements.length).toBeGreaterThan(0);
		});
	});

	it("allows selecting individual transactions", async () => {
		const user = userEvent.setup();
		render(<TransactionsTable />);

		const firstCheckbox = screen.getAllByRole("checkbox")[1]; // Skip select all checkbox
		await user.click(firstCheckbox);

		expect(firstCheckbox).toBeChecked();
	});

	it("allows selecting all transactions", async () => {
		const user = userEvent.setup();
		render(<TransactionsTable />);

		const selectAllCheckbox = screen.getAllByRole("checkbox")[0];
		await user.click(selectAllCheckbox);

		await waitFor(() => {
			expect(selectAllCheckbox).toBeChecked();
		});
	});

	it("shows bulk actions when transactions are selected", async () => {
		const user = userEvent.setup();
		render(<TransactionsTable />);

		const firstCheckbox = screen.getAllByRole("checkbox")[1];
		await user.click(firstCheckbox);

		expect(screen.getByText("Exportar")).toBeInTheDocument();
		expect(screen.getByText("Marcar")).toBeInTheDocument();
	});

	it("renders action menu for each transaction", async () => {
		const user = userEvent.setup();
		render(<TransactionsTable />);

		const menuButtons = screen.getAllByRole("button", {
			name: /acciones para/i,
		});
		expect(menuButtons.length).toBeGreaterThan(0);

		await user.click(menuButtons[0]);

		expect(screen.getByText("Ver Detalles")).toBeInTheDocument();
		expect(screen.getByText("Generar Reporte")).toBeInTheDocument();
	});

	it("displays status badges", () => {
		render(<TransactionsTable />);

		const completadaBadges = screen.getAllByText("Completada");
		const pendienteBadges = screen.getAllByText("Pendiente");
		expect(completadaBadges.length).toBeGreaterThan(0);
		expect(pendienteBadges.length).toBeGreaterThan(0);
	});

	it("displays alert counts", () => {
		render(<TransactionsTable />);

		const alertBadges = screen.getAllByText(/\d+/).filter((el) => {
			const text = el.textContent || "";
			return /^[0-9]+$/.test(text.trim());
		});
		expect(alertBadges.length).toBeGreaterThan(0);
	});

	it("filters transactions by search query", () => {
		render(<TransactionsTable searchQuery="Juan" />);

		const elements = screen.getAllByText("Juan Pérez García");
		expect(elements.length).toBeGreaterThan(0);
	});

	it("filters transactions by type", () => {
		render(<TransactionsTable typeFilter="TRANSFERENCIA" />);

		const transferTransactions = mockTransactions.filter(
			(t) => t.type === "TRANSFERENCIA",
		);
		transferTransactions.forEach((txn) => {
			const elements = screen.getAllByText(txn.clientName);
			expect(elements.length).toBeGreaterThan(0);
		});
	});

	it("filters transactions by status", () => {
		render(<TransactionsTable statusFilter="COMPLETADA" />);

		const completedTransactions = mockTransactions.filter(
			(t) => t.status === "COMPLETADA",
		);
		completedTransactions.forEach((txn) => {
			const elements = screen.getAllByText(txn.clientName);
			expect(elements.length).toBeGreaterThan(0);
		});
	});

	it("filters transactions by channel", () => {
		render(<TransactionsTable channelFilter="BANCA_EN_LINEA" />);

		const onlineTransactions = mockTransactions.filter(
			(t) => t.channel === "BANCA_EN_LINEA",
		);
		onlineTransactions.forEach((txn) => {
			const elements = screen.getAllByText(txn.clientName);
			expect(elements.length).toBeGreaterThan(0);
		});
	});
});
