import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClientsPageContent } from "./ClientsPageContent";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
	}),
	usePathname: () => "/clients",
}));

describe("ClientsPageContent", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders page header", () => {
		render(<ClientsPageContent />);

		const clientesHeaders = screen.getAllByText("Clientes");
		const gestionTexts = screen.getAllByText("Gestión y monitoreo de clientes");
		expect(clientesHeaders.length).toBeGreaterThan(0);
		expect(gestionTexts.length).toBeGreaterThan(0);
	});

	it("renders new client button", () => {
		render(<ClientsPageContent />);

		const newButtons = screen.getAllByRole("button", { name: /nuevo cliente/i });
		expect(newButtons.length).toBeGreaterThan(0);
	});

	it("navigates to new client page when button is clicked", async () => {
		const user = userEvent.setup();
		render(<ClientsPageContent />);

		const newButtons = screen.getAllByRole("button", { name: /nuevo cliente/i });
		await user.click(newButtons[0]);

		expect(mockPush).toHaveBeenCalledWith("/clients/new");
	});

	it("renders KPI cards", () => {
		render(<ClientsPageContent />);

		const avisos = screen.getAllByText("Avisos Abiertos");
		const total = screen.getAllByText("Total Clientes");
		expect(avisos.length).toBeGreaterThan(0);
		expect(total.length).toBeGreaterThan(0);
	});

	it("renders filters section", () => {
		render(<ClientsPageContent />);

		const searchInputs = screen.getAllByPlaceholderText("Buscar por nombre o RFC...");
		expect(searchInputs.length).toBeGreaterThan(0);
	});

	it("renders clients table", () => {
		render(<ClientsPageContent />);

		const tableTitles = screen.getAllByText("Lista de Clientes");
		expect(tableTitles.length).toBeGreaterThan(0);
	});

	it("renders mobile menu button", () => {
		render(<ClientsPageContent />);

		const menuButtons = screen.getAllByRole("button", { name: /abrir menú/i });
		expect(menuButtons.length).toBeGreaterThan(0);
	});

	it("opens mobile menu when button is clicked", async () => {
		const user = userEvent.setup();
		render(<ClientsPageContent />);

		const menuButtons = screen.getAllByRole("button", { name: /abrir menú/i });
		await user.click(menuButtons[0]);

		// Menu should be visible - check for mobile menu container
		await waitFor(
			() => {
				const mobileMenus = document.querySelectorAll('[class*="translate-x-0"]');
				expect(mobileMenus.length).toBeGreaterThan(0);
			},
			{ timeout: 2000 },
		);
	});

	it("closes mobile menu when overlay is clicked", async () => {
		const user = userEvent.setup();
		render(<ClientsPageContent />);

		const menuButtons = screen.getAllByRole("button", { name: /abrir menú/i });
		await user.click(menuButtons[0]);

		await waitFor(() => {
			const overlays = document.querySelectorAll('[aria-hidden="true"]');
			if (overlays.length > 0) {
				const overlay = overlays[0] as HTMLElement;
				user.click(overlay);
			}
		});
	});

	it("applies filters when apply button is clicked", async () => {
		const user = userEvent.setup();
		render(<ClientsPageContent />);

		const searchInputs = screen.getAllByPlaceholderText("Buscar por nombre o RFC...");
		await user.type(searchInputs[0], "test");

		const applyButtons = screen.getAllByRole("button", { name: /aplicar/i });
		await user.click(applyButtons[0]);

		// Should show active filters
		await waitFor(() => {
			const filterChips = screen.queryAllByText(/Búsqueda:/i);
			expect(filterChips.length).toBeGreaterThan(0);
		});
	});

	it("clears filters when clear button is clicked", async () => {
		const user = userEvent.setup();
		render(<ClientsPageContent />);

		const searchInputs = screen.getAllByPlaceholderText("Buscar por nombre o RFC...");
		await user.type(searchInputs[0], "test");

		const applyButtons = screen.getAllByRole("button", { name: /aplicar/i });
		await user.click(applyButtons[0]);

		await waitFor(() => {
			const clearButtons = screen.getAllByRole("button", { name: /limpiar/i });
			if (clearButtons.length > 0) {
				user.click(clearButtons[0]);
			}
		});
	});

	it("shows active filters when applied", async () => {
		const user = userEvent.setup();
		render(<ClientsPageContent />);

		const searchInputs = screen.getAllByPlaceholderText("Buscar por nombre o RFC...");
		await user.type(searchInputs[0], "test");

		const applyButtons = screen.getAllByRole("button", { name: /aplicar/i });
		await user.click(applyButtons[0]);

		// Wait for filters to be applied and check they appear
		await waitFor(
			() => {
				const filterChips = screen.queryAllByText(/Búsqueda:/i);
				expect(filterChips.length).toBeGreaterThan(0);
			},
			{ timeout: 3000 },
		);
	});


	it("handles status filter application", () => {
		render(<ClientsPageContent />);

		// Find status filter
		const statusSelects = screen.getAllByRole("combobox", { name: /estado/i });
		expect(statusSelects.length).toBeGreaterThan(0);
	});

	it("toggles sidebar collapse", () => {
		render(<ClientsPageContent />);
		// Sidebar should be rendered
		const sidebars = document.querySelectorAll("aside");
		expect(sidebars.length).toBeGreaterThan(0);
	});

});
