import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
		const monitoreoTexts = screen.getAllByText(
			"Monitoreo y análisis de transacciones",
		);
		expect(transaccionesHeaders.length).toBeGreaterThan(0);
		expect(monitoreoTexts.length).toBeGreaterThan(0);
	});

	it("renders new transaction button", () => {
		render(<TransactionsPageContent />);

		const newButtons = screen.getAllByRole("button", {
			name: /nueva transacción/i,
		});
		expect(newButtons.length).toBeGreaterThan(0);
	});

	it("navigates to new transaction page when button is clicked", async () => {
		const user = userEvent.setup();
		render(<TransactionsPageContent />);

		const newButtons = screen.getAllByRole("button", {
			name: /nueva transacción/i,
		});
		await user.click(newButtons[0]);

		expect(mockPush).toHaveBeenCalledWith("/transactions/new");
	});

	it("renders KPI cards", () => {
		render(<TransactionsPageContent />);

		const totalElements = screen.getAllByText("Total Transacciones");
		const montoElements = screen.getAllByText("Monto Total");
		expect(totalElements.length).toBeGreaterThan(0);
		expect(montoElements.length).toBeGreaterThan(0);
	});

	it("renders filters", () => {
		render(<TransactionsPageContent />);

		const searchInputs = screen.getAllByPlaceholderText(
			"Buscar por cliente, referencia o descripción...",
		);
		expect(searchInputs.length).toBeGreaterThan(0);
	});

	it("renders transactions table", () => {
		render(<TransactionsPageContent />);

		const tableHeaders = screen.getAllByText("Lista de Transacciones");
		expect(tableHeaders.length).toBeGreaterThan(0);
	});

	it("renders mobile menu button", () => {
		render(<TransactionsPageContent />);

		const menuButtons = screen.getAllByRole("button", { name: /abrir menú/i });
		expect(menuButtons.length).toBeGreaterThan(0);
	});

	it("applies filters when search query changes", async () => {
		const user = userEvent.setup();
		const { container } = render(<TransactionsPageContent />);

		const searchInputs = container.querySelectorAll(
			'input[placeholder="Buscar por cliente, referencia o descripción..."]',
		);
		expect(searchInputs.length).toBeGreaterThan(0);
		if (searchInputs.length > 0) {
			await user.type(searchInputs[0] as HTMLElement, "test");

			const applyButtons = screen.getAllByText("Aplicar");
			const ourApplyButton = Array.from(applyButtons).find((btn) =>
				container.contains(btn),
			);
			expect(ourApplyButton).toBeInTheDocument();
		}
	});

	it("renders sidebar", () => {
		render(<TransactionsPageContent />);

		const sidebars = screen.getAllByText("Transacciones");
		expect(sidebars.length).toBeGreaterThan(0);
	});
});
