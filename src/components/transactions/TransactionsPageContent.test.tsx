import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TransactionsPageContent } from "./TransactionsPageContent";

const mockPush = vi.fn();
const mockPathname = vi.fn(() => "/transactions");

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
	}),
	usePathname: () => mockPathname(),
}));

describe("TransactionsPageContent", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders page header", () => {
		render(<TransactionsPageContent />);

		const transaccionesHeaders = screen.getAllByText("Transacciones");
		const descriptionTexts = screen.getAllByText(
			"Gestión de transacciones de vehículos",
		);
		expect(transaccionesHeaders.length).toBeGreaterThan(0);
		expect(descriptionTexts.length).toBeGreaterThan(0);
	});

	it("renders new transaction button", () => {
		render(<TransactionsPageContent />);

		const newButtons = screen.getAllByRole("button", {
			name: /nueva transacción/i,
		});
		expect(newButtons.length).toBeGreaterThan(0);
	});

	it("links to new transaction page", () => {
		render(<TransactionsPageContent />);

		const link = screen.getByRole("link");
		expect(link).toHaveAttribute("href", "/transactions/new");
		const button = screen.getByRole("button", { name: /nueva transacción/i });
		expect(button).toBeInTheDocument();
	});

	it("renders KPI cards", () => {
		render(<TransactionsPageContent />);

		const totalElements = screen.getAllByText("Volumen Total");
		const montoElements = screen.getAllByText("Total Vehículos");
		expect(totalElements.length).toBeGreaterThan(0);
		expect(montoElements.length).toBeGreaterThan(0);
	});

	it("renders transactions table with built-in search", () => {
		render(<TransactionsPageContent />);

		// Check for the DataTable by looking for search placeholder
		const searchInputs = screen.getAllByPlaceholderText(/buscar/i);
		expect(searchInputs.length).toBeGreaterThan(0);
	});

	// Mobile menu button removed - sidebar is now handled by DashboardLayout
	it.skip("renders mobile menu button", () => {
		// This test is skipped as mobile menu is now handled by DashboardLayout
	});

	// Sidebar is now handled by DashboardLayout, not TransactionsPageContent
	it.skip("renders sidebar", () => {
		// This test is skipped as sidebar is now handled by DashboardLayout
	});
});
