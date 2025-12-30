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

		const newButtons = screen.getAllByRole("button", {
			name: /nuevo cliente/i,
		});
		expect(newButtons.length).toBeGreaterThan(0);
	});

	it("navigates to new client page when button is clicked", async () => {
		const user = userEvent.setup();
		render(<ClientsPageContent />);

		const newButtons = screen.getAllByRole("button", {
			name: /nuevo cliente/i,
		});
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

		const searchInputs = screen.getAllByPlaceholderText(
			"Buscar por nombre o RFC...",
		);
		expect(searchInputs.length).toBeGreaterThan(0);
	});

	it("renders clients table", () => {
		render(<ClientsPageContent />);

		// Check for the DataTable by looking for search placeholder
		const searchInputs = screen.getAllByPlaceholderText(/buscar/i);
		expect(searchInputs.length).toBeGreaterThan(0);
	});

	// Mobile menu button removed - sidebar is now handled by DashboardLayout
	it.skip("renders mobile menu button", () => {
		// This test is skipped as mobile menu is now handled by DashboardLayout
	});

	it.skip("opens mobile menu when button is clicked", async () => {
		// This test is skipped as mobile menu is now handled by DashboardLayout
	});

	it.skip("closes mobile menu when overlay is clicked", async () => {
		// This test is skipped as mobile menu is now handled by DashboardLayout
	});

	it("applies filters when apply button is clicked", async () => {
		const user = userEvent.setup();
		render(<ClientsPageContent />);

		const searchInputs = screen.getAllByPlaceholderText(
			"Buscar por nombre o RFC...",
		);
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

		const searchInputs = screen.getAllByPlaceholderText(
			"Buscar por nombre o RFC...",
		);
		await user.type(searchInputs[0], "test");

		const applyButtons = screen.getAllByRole("button", { name: /aplicar/i });
		await user.click(applyButtons[0]);

		await waitFor(
			async () => {
				const clearButtons = screen.getAllByRole("button", {
					name: /limpiar/i,
				});
				if (clearButtons.length > 0) {
					await user.click(clearButtons[0]);
					// Verify filters were cleared by checking search input is empty
					const searchInputsAfter = screen.getAllByPlaceholderText(
						"Buscar por nombre o RFC...",
					);
					expect(searchInputsAfter[0]).toHaveValue("");
				}
			},
			{ timeout: 3000 },
		);
	});

	it("shows active filters when applied", async () => {
		const user = userEvent.setup();
		render(<ClientsPageContent />);

		const searchInputs = screen.getAllByPlaceholderText(
			"Buscar por nombre o RFC...",
		);
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

	// Sidebar is now handled by DashboardLayout, not ClientsPageContent
	it.skip("toggles sidebar collapse", () => {
		// This test is skipped as sidebar is now handled by DashboardLayout
	});
});
