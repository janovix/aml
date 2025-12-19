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
});
