import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
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

	it("renders clients table with built-in search", () => {
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

	// Sidebar is now handled by DashboardLayout, not ClientsPageContent
	it.skip("toggles sidebar collapse", () => {
		// This test is skipped as sidebar is now handled by DashboardLayout
	});
});
