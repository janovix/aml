import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClientsTable } from "./ClientsTable";
import { mockClients } from "@/data/mockClients";

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

describe("ClientsTable", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});
	it("renders table with client data", () => {
		render(<ClientsTable />);

		expect(screen.getByText("Lista de Clientes")).toBeInTheDocument();
		expect(
			screen.getByText(`${mockClients.length} clientes en total`),
		).toBeInTheDocument();
	});

	it("renders all client rows", () => {
		render(<ClientsTable />);

		mockClients.forEach((client) => {
			const displayName =
				client.personType === "FISICA"
					? `${client.firstName} ${client.lastName} ${client.secondLastName || ""}`.trim()
					: client.businessName;
			const elements = screen.getAllByText(displayName);
			expect(elements.length).toBeGreaterThan(0);
		});
	});

	it("allows selecting individual clients", async () => {
		const user = userEvent.setup();
		render(<ClientsTable />);

		const firstCheckbox = screen.getAllByRole("checkbox")[1]; // Skip select all checkbox
		await user.click(firstCheckbox);

		expect(firstCheckbox).toBeChecked();
	});

	it("allows selecting all clients", async () => {
		const user = userEvent.setup();
		render(<ClientsTable />);

		const selectAllCheckbox = screen.getAllByRole("checkbox")[0];
		await user.click(selectAllCheckbox);

		// Wait for state update and check that select all is checked
		await waitFor(() => {
			expect(selectAllCheckbox).toBeChecked();
		});
	});

	it("shows bulk actions when clients are selected", async () => {
		const user = userEvent.setup();
		render(<ClientsTable />);

		const firstCheckbox = screen.getAllByRole("checkbox")[1];
		await user.click(firstCheckbox);

		expect(screen.getByText("Exportar")).toBeInTheDocument();
		expect(screen.getByText("Marcar")).toBeInTheDocument();
	});

	it("renders action menu for each client", async () => {
		const user = userEvent.setup();
		render(<ClientsTable />);

		const menuButtons = screen.getAllByRole("button", {
			name: /acciones para/i,
		});
		expect(menuButtons.length).toBeGreaterThan(0);

		await user.click(menuButtons[0]);

		expect(screen.getByText("Ver Detalles")).toBeInTheDocument();
		expect(screen.getByText("Editar")).toBeInTheDocument();
		expect(screen.getByText("Generar Reporte")).toBeInTheDocument();
	});

	it("displays risk level badges", () => {
		render(<ClientsTable />);

		const altoBadges = screen.getAllByText("Alto");
		const medioBadges = screen.getAllByText("Medio");
		const bajoBadges = screen.getAllByText("Bajo");
		expect(altoBadges.length).toBeGreaterThan(0);
		expect(medioBadges.length).toBeGreaterThan(0);
		expect(bajoBadges.length).toBeGreaterThan(0);
	});

	it("displays status badges", () => {
		render(<ClientsTable />);

		const activoBadges = screen.getAllByText("Activo");
		expect(activoBadges.length).toBeGreaterThan(0);
	});

	it("displays alert counts", () => {
		render(<ClientsTable />);

		const alertBadges = screen.getAllByText(/\d+/).filter((el) => {
			const text = el.textContent || "";
			return /^[0-9]+$/.test(text.trim());
		});
		expect(alertBadges.length).toBeGreaterThan(0);
	});

});
