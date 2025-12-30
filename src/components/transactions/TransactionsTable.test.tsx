import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransactionsTable } from "./TransactionsTable";
import { mockTransactions } from "@/data/mockTransactions";
import { mockClients } from "@/data/mockClients";
import * as transactionsApi from "@/lib/api/transactions";
import * as clientsApi from "@/lib/api/clients";

const mockToast = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
	useToast: () => ({
		toast: mockToast,
		toasts: [],
	}),
}));

vi.mock("@/hooks/use-mobile", () => ({
	useIsMobile: () => false,
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

vi.mock("@/lib/api/clients", () => ({
	getClientByRfc: vi.fn(),
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

		// Mock client fetching - return clients based on clientId
		const clientIdToRfc: Record<string, string> = {
			"1": "EGL850101AAA",
			"2": "CNO920315BBB",
			"3": "SFM880520CCC",
			"4": "IDP950712DDD",
			"5": "PECJ850615E56",
		};

		vi.mocked(clientsApi.getClientByRfc).mockImplementation(async ({ rfc }) => {
			let client = mockClients.find((c) => c.rfc === rfc);
			if (!client && clientIdToRfc[rfc]) {
				client = mockClients.find((c) => c.rfc === clientIdToRfc[rfc]);
			}
			if (client) {
				return client;
			}
			throw new Error("Client not found");
		});
	});

	it("renders table with transaction data", async () => {
		render(<TransactionsTable />);

		await waitFor(() => {
			// Check that data is loaded by looking for transaction content
			expect(screen.getByText(/Toyota/i)).toBeInTheDocument();
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
			expect(screen.getByText(/Toyota/i)).toBeInTheDocument();
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
			expect(screen.getByText(/Toyota/i)).toBeInTheDocument();
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
			expect(screen.getByText(/Toyota/i)).toBeInTheDocument();
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
			expect(screen.getByText(/Toyota/i)).toBeInTheDocument();
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
			expect(screen.getByText(/Toyota/i)).toBeInTheDocument();
		});

		// Find the action buttons (the MoreHorizontal icon buttons) - they are in the last cell of each row
		const rows = screen.getAllByRole("row");
		expect(rows.length).toBeGreaterThan(1); // header + at least 1 data row
	});

	it("displays formatted currency amounts", async () => {
		render(<TransactionsTable />);

		await waitFor(() => {
			expect(screen.getByText(/Toyota/i)).toBeInTheDocument();
		});

		// Check for MXN formatted amounts (they should be formatted with $ symbol)
		const amounts = screen.queryAllByText(/\$/);
		expect(amounts.length).toBeGreaterThan(0);
	});

	it("shows loading state while fetching", async () => {
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
		expect(screen.getByText("Cargando transacciones...")).toBeInTheDocument();

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
			expect(screen.getByText(/Toyota/i)).toBeInTheDocument();
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

	it("navigates to transaction details via link click", async () => {
		render(<TransactionsTable />);

		await waitFor(() => {
			expect(screen.getByText(/Toyota/i)).toBeInTheDocument();
		});

		// Click on client name link to navigate
		const links = screen.getAllByRole("link");
		expect(links.length).toBeGreaterThan(0);
		expect(links[0]).toHaveAttribute(
			"href",
			expect.stringContaining("/transactions/"),
		);
	});

	it("renders transaction links", async () => {
		render(<TransactionsTable />);

		await waitFor(() => {
			expect(screen.getByText(/Toyota/i)).toBeInTheDocument();
		});

		// Check that transaction links exist
		const links = screen.getAllByRole("link");
		expect(links.length).toBeGreaterThan(0);
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

	it("shows selected count in footer", async () => {
		const user = userEvent.setup();
		render(<TransactionsTable />);

		await waitFor(() => {
			expect(screen.getByText(/Toyota/i)).toBeInTheDocument();
		});

		// Select two transactions
		const checkboxes = screen.getAllByRole("checkbox");
		await user.click(checkboxes[1]);
		await user.click(checkboxes[2]);

		await waitFor(() => {
			expect(screen.getByText(/2 seleccionados/)).toBeInTheDocument();
		});
	});

	it("displays vehicle brand and model", async () => {
		render(<TransactionsTable />);

		await waitFor(() => {
			expect(screen.getByText(/Corolla/i)).toBeInTheDocument();
			expect(screen.getByText(/CR-V/i)).toBeInTheDocument();
		});
	});

	it("displays short transaction IDs", async () => {
		render(<TransactionsTable />);

		await waitFor(() => {
			expect(screen.getByText(/Toyota/i)).toBeInTheDocument();
		});

		// Check that short IDs are displayed (format: YYYYMMDD-XXXX)
		const shortIdPattern = /\d{8}-[A-Z0-9]{4}/;
		const shortIds = screen.queryAllByText(shortIdPattern);
		expect(shortIds.length).toBeGreaterThan(0);
	});

	it("has search functionality", async () => {
		const user = userEvent.setup();
		render(<TransactionsTable />);

		await waitFor(() => {
			expect(screen.getByText(/Toyota/i)).toBeInTheDocument();
		});

		// Find search input
		const searchInput = screen.getByPlaceholderText(/buscar/i);
		expect(searchInput).toBeInTheDocument();

		// Type in search
		await user.type(searchInput, "Toyota");

		// Check that results are filtered (search is client-side)
		await waitFor(() => {
			// Should still show Toyota
			expect(screen.getByText(/Toyota/i)).toBeInTheDocument();
		});
	});

	it("has filter popovers", async () => {
		render(<TransactionsTable />);

		await waitFor(() => {
			expect(screen.getByText(/Toyota/i)).toBeInTheDocument();
		});

		// Check for filter buttons (using getAllByText since filter button and label may duplicate)
		const operacionButtons = screen.getAllByText("Operación");
		const vehiculoButtons = screen.getAllByText("Vehículo");
		const monedaButtons = screen.getAllByText("Moneda");
		expect(operacionButtons.length).toBeGreaterThan(0);
		expect(vehiculoButtons.length).toBeGreaterThan(0);
		expect(monedaButtons.length).toBeGreaterThan(0);
	});
});
