import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransactionsTable } from "./TransactionsTable";
import { mockTransactions } from "@/data/mockTransactions";
import * as transactionsApi from "@/lib/api/transactions";

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

vi.mock("@/lib/api/transactions", () => ({
	listTransactions: vi.fn(),
}));

describe("TransactionsTable", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(transactionsApi.listTransactions).mockResolvedValue({
			data: mockTransactions,
			pagination: {
				page: 1,
				limit: 100,
				total: mockTransactions.length,
				totalPages: 1,
			},
		});
	});

	it("renders table with transaction data", async () => {
		render(<TransactionsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Transacciones")).toBeInTheDocument();
		});

		await waitFor(() => {
			expect(
				screen.getByText(
					new RegExp(`${mockTransactions.length} transacciones en total`),
				),
			).toBeInTheDocument();
		});
	});

	it("renders all transaction rows", async () => {
		render(<TransactionsTable />);

		await waitFor(() => {
			// Check for some transactions by their brand/model
			expect(screen.getByText(/Toyota/i)).toBeInTheDocument();
			expect(screen.getByText(/Honda/i)).toBeInTheDocument();
		});
	});

	it("allows selecting individual transactions", async () => {
		const user = userEvent.setup();
		render(<TransactionsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Transacciones")).toBeInTheDocument();
		});

		const checkboxes = screen.getAllByRole("checkbox");
		const firstTransactionCheckbox = checkboxes[1]; // Skip select all checkbox
		await user.click(firstTransactionCheckbox);

		await waitFor(() => {
			expect(firstTransactionCheckbox).toBeChecked();
		});
	});

	it("allows selecting all transactions", async () => {
		const user = userEvent.setup();
		render(<TransactionsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Transacciones")).toBeInTheDocument();
		});

		const selectAllCheckbox = screen.getAllByRole("checkbox")[0];
		await user.click(selectAllCheckbox);

		await waitFor(() => {
			expect(selectAllCheckbox).toBeChecked();
		});
	});

	it("toggles individual transaction selection", async () => {
		const user = userEvent.setup();
		render(<TransactionsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Transacciones")).toBeInTheDocument();
		});

		const checkboxes = screen.getAllByRole("checkbox");
		const firstTransactionCheckbox = checkboxes[1];

		// Select
		await user.click(firstTransactionCheckbox);
		expect(firstTransactionCheckbox).toBeChecked();

		// Deselect
		await user.click(firstTransactionCheckbox);
		expect(firstTransactionCheckbox).not.toBeChecked();
	});

	it("toggles all transactions when select all is clicked twice", async () => {
		const user = userEvent.setup();
		render(<TransactionsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Transacciones")).toBeInTheDocument();
		});

		const selectAllCheckbox = screen.getAllByRole("checkbox")[0];

		// Select all
		await user.click(selectAllCheckbox);
		expect(selectAllCheckbox).toBeChecked();

		// Deselect all
		await user.click(selectAllCheckbox);
		expect(selectAllCheckbox).not.toBeChecked();
	});

	it("renders action menu for each transaction", async () => {
		const user = userEvent.setup();
		render(<TransactionsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Transacciones")).toBeInTheDocument();
		});

		const menuButtons = screen.getAllByRole("button", {
			name: /acciones para/i,
		});
		expect(menuButtons.length).toBeGreaterThan(0);

		await user.click(menuButtons[0]);

		expect(screen.getByText("Ver Detalles")).toBeInTheDocument();
		expect(screen.getByText("Editar")).toBeInTheDocument();
	});

	it("displays operation type badges", async () => {
		render(<TransactionsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Transacciones")).toBeInTheDocument();
		});

		await waitFor(() => {
			const compraBadges = screen.queryAllByText("Compra");
			const ventaBadges = screen.queryAllByText("Venta");
			expect(compraBadges.length + ventaBadges.length).toBeGreaterThan(0);
		});
	});

	it("displays formatted currency amounts", async () => {
		render(<TransactionsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Transacciones")).toBeInTheDocument();
		});

		// Check for MXN formatted amounts (they should be formatted with $ symbol)
		await waitFor(() => {
			const amounts = screen.queryAllByText(/\$/);
			expect(amounts.length).toBeGreaterThan(0);
		});
	});

	it("displays formatted dates", async () => {
		render(<TransactionsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Transacciones")).toBeInTheDocument();
		});

		// Check that dates are rendered (they should be formatted)
		const dateElements = screen.queryAllByText(/\d{1,2}\s+\w+\s+\d{4}/);
		expect(dateElements.length).toBeGreaterThan(0);
	});

	it("displays payment method labels", async () => {
		render(<TransactionsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Transacciones")).toBeInTheDocument();
		});

		await waitFor(() => {
			const paymentMethods = screen.queryAllByText(
				/Efectivo|Transferencia|Financiamiento|Cheque/i,
			);
			expect(paymentMethods.length).toBeGreaterThan(0);
		});
	});

	it("shows loading state while fetching", async () => {
		// Create a promise that doesn't resolve immediately
		let resolveTransactions: (value: unknown) => void;
		const transactionsPromise = new Promise((resolve) => {
			resolveTransactions = resolve;
		});
		vi.mocked(transactionsApi.listTransactions).mockReturnValue(
			transactionsPromise as ReturnType<
				typeof transactionsApi.listTransactions
			>,
		);

		render(<TransactionsTable />);

		// Should show loading initially
		expect(screen.getByText("Cargando...")).toBeInTheDocument();

		// Resolve the promise
		resolveTransactions!({
			data: mockTransactions,
			pagination: {
				page: 1,
				limit: 100,
				total: mockTransactions.length,
				totalPages: 1,
			},
		});

		await waitFor(() => {
			expect(
				screen.getByText(
					new RegExp(`${mockTransactions.length} transacciones en total`),
				),
			).toBeInTheDocument();
		});
	});

	it("handles API error gracefully", async () => {
		vi.mocked(transactionsApi.listTransactions).mockRejectedValue(
			new Error("API error"),
		);

		render(<TransactionsTable />);

		await waitFor(() => {
			expect(mockToast).toHaveBeenCalledWith(
				expect.objectContaining({
					title: "Error",
					description: "No se pudieron cargar las transacciones.",
					variant: "destructive",
				}),
			);
		});
	});

	it("navigates to transaction details on view details click", async () => {
		const user = userEvent.setup();
		render(<TransactionsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Transacciones")).toBeInTheDocument();
		});

		// Open action menu
		const menuButtons = screen.getAllByRole("button", {
			name: /acciones para/i,
		});
		await user.click(menuButtons[0]);

		// Click view details
		await user.click(screen.getByText("Ver Detalles"));

		expect(mockPush).toHaveBeenCalledWith(
			`/transactions/${mockTransactions[0].id}`,
		);
	});

	it("navigates to transaction edit on edit click", async () => {
		const user = userEvent.setup();
		render(<TransactionsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Transacciones")).toBeInTheDocument();
		});

		// Open action menu
		const menuButtons = screen.getAllByRole("button", {
			name: /acciones para/i,
		});
		await user.click(menuButtons[0]);

		// Click edit
		await user.click(screen.getByText("Editar"));

		expect(mockPush).toHaveBeenCalledWith(
			`/transactions/${mockTransactions[0].id}/edit`,
		);
	});

	it("shows generate report option in menu", async () => {
		const user = userEvent.setup();
		render(<TransactionsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Transacciones")).toBeInTheDocument();
		});

		// Open action menu
		const menuButtons = screen.getAllByRole("button", {
			name: /acciones para/i,
		});
		await user.click(menuButtons[0]);

		// Check generate report option exists
		expect(screen.getByText("Generar Reporte")).toBeInTheDocument();
	});

	it("shows export button when transactions are selected", async () => {
		const user = userEvent.setup();
		render(<TransactionsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Transacciones")).toBeInTheDocument();
		});

		// Select a transaction
		const checkboxes = screen.getAllByRole("checkbox");
		await user.click(checkboxes[1]);

		// Check export button is visible
		await waitFor(() => {
			expect(screen.getByText("Exportar")).toBeInTheDocument();
		});
	});

	it("passes filters to API", async () => {
		const filters = { operationType: "purchase" as const };
		render(<TransactionsTable filters={filters} />);

		await waitFor(() => {
			expect(transactionsApi.listTransactions).toHaveBeenCalledWith(
				expect.objectContaining({
					operationType: "purchase",
				}),
			);
		});
	});

	it("shows selected count in header", async () => {
		const user = userEvent.setup();
		render(<TransactionsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Transacciones")).toBeInTheDocument();
		});

		// Select two transactions
		const checkboxes = screen.getAllByRole("checkbox");
		await user.click(checkboxes[1]);
		await user.click(checkboxes[2]);

		await waitFor(() => {
			expect(screen.getByText(/2 seleccionadas/)).toBeInTheDocument();
		});
	});

	it("displays vehicle brand and model", async () => {
		render(<TransactionsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Transacciones")).toBeInTheDocument();
		});

		// Check for vehicle info
		await waitFor(() => {
			expect(screen.getByText(/Corolla/i)).toBeInTheDocument();
			expect(screen.getByText(/CR-V/i)).toBeInTheDocument();
		});
	});
});
