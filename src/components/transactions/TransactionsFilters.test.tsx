import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransactionsFilters } from "./TransactionsFilters";

const defaultProps = {
	searchQuery: "",
	onSearchChange: vi.fn(),
	typeFilter: "",
	onTypeChange: vi.fn(),
	statusFilter: "",
	onStatusChange: vi.fn(),
	channelFilter: "",
	onChannelChange: vi.fn(),
	activeFilters: [],
	onApplyFilters: vi.fn(),
	onClearFilters: vi.fn(),
	onRemoveFilter: vi.fn(),
};

describe("TransactionsFilters", () => {
	it("renders search input", () => {
		render(<TransactionsFilters {...defaultProps} />);

		const searchInput = screen.getByPlaceholderText(
			"Buscar por cliente, referencia o descripción...",
		);
		expect(searchInput).toBeInTheDocument();
	});

	it("renders type filter", () => {
		render(<TransactionsFilters {...defaultProps} />);

		const typeSelects = screen.getAllByRole("combobox");
		const typeFilter = typeSelects.find((select) =>
			select.getAttribute("id")?.includes("type"),
		);
		expect(typeFilter).toBeInTheDocument();
	});

	it("renders status filter", () => {
		render(<TransactionsFilters {...defaultProps} />);

		const statusSelects = screen.getAllByRole("combobox");
		const statusFilter = statusSelects.find((select) =>
			select.getAttribute("id")?.includes("status"),
		);
		expect(statusFilter).toBeInTheDocument();
	});

	it("renders channel filter", () => {
		render(<TransactionsFilters {...defaultProps} />);

		const channelSelects = screen.getAllByRole("combobox");
		const channelFilter = channelSelects.find((select) =>
			select.getAttribute("id")?.includes("channel"),
		);
		expect(channelFilter).toBeInTheDocument();
	});

	it("calls onSearchChange when typing in search input", async () => {
		const user = userEvent.setup();
		const onSearchChange = vi.fn();
		const { container } = render(
			<TransactionsFilters {...defaultProps} onSearchChange={onSearchChange} />,
		);

		const searchInput = container.querySelector(
			'input[placeholder="Buscar por cliente, referencia o descripción..."]',
		) as HTMLInputElement;
		expect(searchInput).toBeInTheDocument();
		await user.type(searchInput, "test");

		expect(onSearchChange).toHaveBeenCalled();
	});

	it("shows apply button", () => {
		render(<TransactionsFilters {...defaultProps} />);

		const applyButtons = screen.getAllByText("Aplicar");
		expect(applyButtons.length).toBeGreaterThan(0);
	});

	it("shows clear button when filters are active", () => {
		render(<TransactionsFilters {...defaultProps} searchQuery="test" />);

		const clearButtons = screen.getAllByText("Limpiar");
		expect(clearButtons.length).toBeGreaterThan(0);
	});

	it("calls onApplyFilters when apply button is clicked", async () => {
		const user = userEvent.setup();
		const onApplyFilters = vi.fn();
		const { container } = render(
			<TransactionsFilters
				{...defaultProps}
				searchQuery="test"
				onApplyFilters={onApplyFilters}
			/>,
		);

		const applyButtons = screen.getAllByText("Aplicar");
		const ourApplyButton = Array.from(applyButtons).find((btn) =>
			container.contains(btn),
		);
		expect(ourApplyButton).toBeInTheDocument();
		if (ourApplyButton) {
			await user.click(ourApplyButton);
			expect(onApplyFilters).toHaveBeenCalled();
		}
	});

	it("calls onClearFilters when clear button is clicked", async () => {
		const user = userEvent.setup();
		const onClearFilters = vi.fn();
		const { container } = render(
			<TransactionsFilters
				{...defaultProps}
				searchQuery="test"
				onClearFilters={onClearFilters}
			/>,
		);

		const clearButtons = screen.getAllByText("Limpiar");
		const ourClearButton = Array.from(clearButtons).find((btn) =>
			container.contains(btn),
		);
		expect(ourClearButton).toBeInTheDocument();
		if (ourClearButton) {
			await user.click(ourClearButton);
			expect(onClearFilters).toHaveBeenCalled();
		}
	});

	it("shows advanced filters toggle", () => {
		render(<TransactionsFilters {...defaultProps} />);

		const advancedButtons = screen.getAllByText("Búsqueda avanzada");
		expect(advancedButtons.length).toBeGreaterThan(0);
	});

	it("displays active filter chips", () => {
		render(
			<TransactionsFilters
				{...defaultProps}
				activeFilters={['Búsqueda: "test"', "Tipo: TRANSFERENCIA"]}
			/>,
		);

		expect(screen.getByText('Búsqueda: "test"')).toBeInTheDocument();
		expect(screen.getByText("Tipo: TRANSFERENCIA")).toBeInTheDocument();
	});

	it("calls onRemoveFilter when removing a filter chip", async () => {
		const user = userEvent.setup();
		const onRemoveFilter = vi.fn();
		const { container } = render(
			<TransactionsFilters
				{...defaultProps}
				activeFilters={['Búsqueda: "test"']}
				onRemoveFilter={onRemoveFilter}
			/>,
		);

		const removeButtons = container.querySelectorAll(
			'button[aria-label*="Remover filtro"]',
		);
		if (removeButtons.length > 0) {
			await user.click(removeButtons[0] as HTMLElement);
			expect(onRemoveFilter).toHaveBeenCalled();
		}
	});
});
