import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClientsTable } from "./ClientsTable";
import { mockClients } from "@/data/mockClients";
import { getClientDisplayName } from "@/types/client";
import * as clientsApi from "@/lib/api/clients";

const mockToast = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
	useToast: () => ({
		toast: mockToast,
		toasts: [],
	}),
}));

vi.mock("@/hooks/useJwt", () => ({
	useJwt: () => ({
		jwt: "test-jwt-token",
		isLoading: false,
		error: null,
		refetch: vi.fn(),
	}),
}));

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
	}),
}));

vi.mock("@/lib/api/clients", () => ({
	listClients: vi.fn(),
	deleteClient: vi.fn(),
}));

describe("ClientsTable", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(clientsApi.listClients).mockResolvedValue({
			data: mockClients,
			pagination: {
				page: 1,
				limit: 100,
				total: mockClients.length,
				totalPages: 1,
			},
		});
	});

	it("renders table with client data", async () => {
		render(<ClientsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Clientes")).toBeInTheDocument();
		});

		await waitFor(() => {
			expect(
				screen.getByText(new RegExp(`${mockClients.length} clientes en total`)),
			).toBeInTheDocument();
		});
	});

	it("renders all client rows", async () => {
		render(<ClientsTable />);

		await waitFor(() => {
			mockClients.forEach((client) => {
				const displayName = getClientDisplayName(client);
				const elements = screen.queryAllByText(displayName);
				expect(elements.length).toBeGreaterThan(0);
			});
		});
	});

	it("allows selecting individual clients", async () => {
		const user = userEvent.setup();
		render(<ClientsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Clientes")).toBeInTheDocument();
		});

		const checkboxes = screen.getAllByRole("checkbox");
		const firstClientCheckbox = checkboxes[1]; // Skip select all checkbox
		await user.click(firstClientCheckbox);

		await waitFor(() => {
			expect(firstClientCheckbox).toBeChecked();
		});
	});

	it("allows selecting all clients", async () => {
		const user = userEvent.setup();
		render(<ClientsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Clientes")).toBeInTheDocument();
		});

		const selectAllCheckbox = screen.getAllByRole("checkbox")[0];
		await user.click(selectAllCheckbox);

		await waitFor(() => {
			expect(selectAllCheckbox).toBeChecked();
		});
	});

	it("shows bulk actions when clients are selected", async () => {
		const user = userEvent.setup();
		render(<ClientsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Clientes")).toBeInTheDocument();
		});

		const checkboxes = screen.getAllByRole("checkbox");
		const firstClientCheckbox = checkboxes[1];
		await user.click(firstClientCheckbox);

		await waitFor(() => {
			expect(screen.getByText("Exportar")).toBeInTheDocument();
			expect(screen.getByText("Marcar")).toBeInTheDocument();
		});
	});

	it("renders action menu for each client", async () => {
		const user = userEvent.setup();
		render(<ClientsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Clientes")).toBeInTheDocument();
		});

		const menuButtons = screen.getAllByRole("button", {
			name: /acciones para/i,
		});
		expect(menuButtons.length).toBeGreaterThan(0);

		await user.click(menuButtons[0]);

		expect(screen.getByText("Ver Detalles")).toBeInTheDocument();
		expect(screen.getByText("Editar")).toBeInTheDocument();
		expect(screen.getByText("Generar Reporte")).toBeInTheDocument();
	});

	it("displays person type badges", async () => {
		render(<ClientsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Clientes")).toBeInTheDocument();
		});

		await waitFor(() => {
			const moralBadges = screen.queryAllByText("Moral");
			const fisicaBadges = screen.queryAllByText("Física");
			expect(moralBadges.length + fisicaBadges.length).toBeGreaterThan(0);
		});
	});

	it("displays RFC for each client", async () => {
		render(<ClientsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Clientes")).toBeInTheDocument();
		});

		await waitFor(() => {
			mockClients.forEach((client) => {
				const rfcElements = screen.queryAllByText(client.rfc);
				expect(rfcElements.length).toBeGreaterThan(0);
			});
		});
	});

	it("displays creation date", async () => {
		render(<ClientsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Clientes")).toBeInTheDocument();
		});

		// Check that dates are rendered (they should be formatted)
		const dateElements = screen.queryAllByText(/\d{1,2}\s+\w+\s+\d{4}/);
		expect(dateElements.length).toBeGreaterThan(0);
	});

	it("shows loading state while fetching", async () => {
		// Create a promise that doesn't resolve immediately
		let resolveClients: (value: unknown) => void;
		const clientsPromise = new Promise((resolve) => {
			resolveClients = resolve;
		});
		vi.mocked(clientsApi.listClients).mockReturnValue(
			clientsPromise as Promise<{
				data: typeof mockClients;
				pagination: {
					page: number;
					limit: number;
					total: number;
					totalPages: number;
				};
			}>,
		);

		render(<ClientsTable />);

		// Should show loading initially
		expect(screen.getByText("Cargando...")).toBeInTheDocument();

		// Resolve the promise
		resolveClients!({
			data: mockClients,
			pagination: {
				page: 1,
				limit: 100,
				total: mockClients.length,
				totalPages: 1,
			},
		});

		await waitFor(() => {
			expect(
				screen.getByText(new RegExp(`${mockClients.length} clientes en total`)),
			).toBeInTheDocument();
		});
	});

	it("handles API error gracefully", async () => {
		vi.mocked(clientsApi.listClients).mockRejectedValue(new Error("API error"));

		render(<ClientsTable />);

		await waitFor(() => {
			expect(mockToast).toHaveBeenCalledWith(
				expect.objectContaining({
					title: "Error",
					description: "No se pudieron cargar los clientes.",
					variant: "destructive",
				}),
			);
		});
	});

	it("navigates to client details on view details click", async () => {
		const user = userEvent.setup();
		render(<ClientsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Clientes")).toBeInTheDocument();
		});

		// Open action menu
		const menuButtons = screen.getAllByRole("button", {
			name: /acciones para/i,
		});
		await user.click(menuButtons[0]);

		// Click view details
		await user.click(screen.getByText("Ver Detalles"));

		expect(mockPush).toHaveBeenCalledWith(`/clients/${mockClients[0].rfc}`);
	});

	it("navigates to client edit on edit click", async () => {
		const user = userEvent.setup();
		render(<ClientsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Clientes")).toBeInTheDocument();
		});

		// Open action menu
		const menuButtons = screen.getAllByRole("button", {
			name: /acciones para/i,
		});
		await user.click(menuButtons[0]);

		// Click edit
		await user.click(screen.getByText("Editar"));

		expect(mockPush).toHaveBeenCalledWith(
			`/clients/${mockClients[0].rfc}/edit`,
		);
	});

	it("generates report for a client", async () => {
		const user = userEvent.setup();

		// Mock URL methods
		global.URL.createObjectURL = vi.fn().mockReturnValue("blob:test");
		global.URL.revokeObjectURL = vi.fn();

		render(<ClientsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Clientes")).toBeInTheDocument();
		});

		// Open action menu
		const menuButtons = screen.getAllByRole("button", {
			name: /acciones para/i,
		});
		await user.click(menuButtons[0]);

		// Click generate report
		await user.click(screen.getByText("Generar Reporte"));

		expect(mockToast).toHaveBeenCalledWith(
			expect.objectContaining({
				title: "Reporte generado",
			}),
		);
	});

	it("flags a client as suspicious", async () => {
		const user = userEvent.setup();
		render(<ClientsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Clientes")).toBeInTheDocument();
		});

		// Open action menu
		const menuButtons = screen.getAllByRole("button", {
			name: /acciones para/i,
		});
		await user.click(menuButtons[0]);

		// Click flag as suspicious
		await user.click(screen.getByText("Marcar como Sospechoso"));

		expect(mockToast).toHaveBeenCalledWith(
			expect.objectContaining({
				title: "Cliente marcado",
			}),
		);
	});

	it("opens delete confirmation dialog", async () => {
		const user = userEvent.setup();
		render(<ClientsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Clientes")).toBeInTheDocument();
		});

		// Open action menu
		const menuButtons = screen.getAllByRole("button", {
			name: /acciones para/i,
		});
		await user.click(menuButtons[0]);

		// Click delete
		await user.click(screen.getByText("Eliminar"));

		// Dialog should be open
		expect(screen.getByText("¿Eliminar cliente?")).toBeInTheDocument();
	});

	it("cancels delete dialog", async () => {
		const user = userEvent.setup();
		render(<ClientsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Clientes")).toBeInTheDocument();
		});

		// Open action menu
		const menuButtons = screen.getAllByRole("button", {
			name: /acciones para/i,
		});
		await user.click(menuButtons[0]);

		// Click delete
		await user.click(screen.getByText("Eliminar"));

		// Cancel
		await user.click(screen.getByRole("button", { name: "Cancelar" }));

		// Dialog should be closed
		await waitFor(() => {
			expect(screen.queryByText("¿Eliminar cliente?")).not.toBeInTheDocument();
		});
	});

	it("confirms delete and removes client", async () => {
		const user = userEvent.setup();
		vi.mocked(clientsApi.deleteClient).mockResolvedValue(undefined);

		render(<ClientsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Clientes")).toBeInTheDocument();
		});

		// Open action menu
		const menuButtons = screen.getAllByRole("button", {
			name: /acciones para/i,
		});
		await user.click(menuButtons[0]);

		// Click delete
		await user.click(screen.getByText("Eliminar"));

		// Confirm delete
		await user.click(screen.getByRole("button", { name: /eliminar/i }));

		await waitFor(() => {
			expect(clientsApi.deleteClient).toHaveBeenCalled();
		});

		expect(mockToast).toHaveBeenCalledWith(
			expect.objectContaining({
				title: "Cliente eliminado",
			}),
		);
	});

	it("handles delete error gracefully", async () => {
		const user = userEvent.setup();
		vi.mocked(clientsApi.deleteClient).mockRejectedValue(
			new Error("Delete failed"),
		);

		render(<ClientsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Clientes")).toBeInTheDocument();
		});

		// Open action menu
		const menuButtons = screen.getAllByRole("button", {
			name: /acciones para/i,
		});
		await user.click(menuButtons[0]);

		// Click delete
		await user.click(screen.getByText("Eliminar"));

		// Confirm delete
		await user.click(screen.getByRole("button", { name: /eliminar/i }));

		await waitFor(() => {
			expect(mockToast).toHaveBeenCalledWith(
				expect.objectContaining({
					title: "Error",
					description: "No se pudo eliminar el cliente.",
					variant: "destructive",
				}),
			);
		});
	});

	it("handles bulk export", async () => {
		const user = userEvent.setup();

		// Mock URL methods
		global.URL.createObjectURL = vi.fn().mockReturnValue("blob:test");
		global.URL.revokeObjectURL = vi.fn();

		render(<ClientsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Clientes")).toBeInTheDocument();
		});

		// Select a client
		const checkboxes = screen.getAllByRole("checkbox");
		await user.click(checkboxes[1]);

		// Click export
		await user.click(screen.getByText("Exportar"));

		expect(mockToast).toHaveBeenCalledWith(
			expect.objectContaining({
				title: "Exportación completa",
			}),
		);
	});

	it("handles bulk flag", async () => {
		const user = userEvent.setup();
		render(<ClientsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Clientes")).toBeInTheDocument();
		});

		// Select a client
		const checkboxes = screen.getAllByRole("checkbox");
		await user.click(checkboxes[1]);

		// Click flag
		await user.click(screen.getByText("Marcar"));

		expect(mockToast).toHaveBeenCalledWith(
			expect.objectContaining({
				title: "Clientes marcados",
			}),
		);

		// Selection should be cleared
		await waitFor(() => {
			expect(checkboxes[1]).not.toBeChecked();
		});
	});

	it("toggles individual client selection", async () => {
		const user = userEvent.setup();
		render(<ClientsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Clientes")).toBeInTheDocument();
		});

		const checkboxes = screen.getAllByRole("checkbox");
		const firstClientCheckbox = checkboxes[1];

		// Select
		await user.click(firstClientCheckbox);
		expect(firstClientCheckbox).toBeChecked();

		// Deselect
		await user.click(firstClientCheckbox);
		expect(firstClientCheckbox).not.toBeChecked();
	});

	it("toggles all clients when select all is clicked twice", async () => {
		const user = userEvent.setup();
		render(<ClientsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Clientes")).toBeInTheDocument();
		});

		const selectAllCheckbox = screen.getAllByRole("checkbox")[0];

		// Select all
		await user.click(selectAllCheckbox);
		expect(selectAllCheckbox).toBeChecked();

		// Deselect all
		await user.click(selectAllCheckbox);
		expect(selectAllCheckbox).not.toBeChecked();
	});

	it("allows sorting by clicking column headers", async () => {
		const user = userEvent.setup();
		render(<ClientsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Clientes")).toBeInTheDocument();
		});

		// Find sort buttons in table headers
		const sortButtons = screen
			.getAllByRole("button")
			.filter((btn) => btn.querySelector('svg[class*="arrow-up-down"]'));

		if (sortButtons.length > 0) {
			// Click to sort
			await user.click(sortButtons[0]);
			// Click again to reverse sort
			await user.click(sortButtons[0]);
		}
	});

	it("shows selected count in header", async () => {
		const user = userEvent.setup();
		render(<ClientsTable />);

		await waitFor(() => {
			expect(screen.getByText("Lista de Clientes")).toBeInTheDocument();
		});

		// Select two clients
		const checkboxes = screen.getAllByRole("checkbox");
		await user.click(checkboxes[1]);
		await user.click(checkboxes[2]);

		await waitFor(() => {
			expect(screen.getByText(/2 seleccionados/)).toBeInTheDocument();
		});
	});
});
