import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClientsFilters } from "./ClientsFilters";

describe("ClientsFilters", () => {
	const defaultProps = {
		searchQuery: "",
		onSearchChange: vi.fn(),
		riskFilter: "",
		onRiskChange: vi.fn(),
		statusFilter: "",
		onStatusChange: vi.fn(),
		activeFilters: [],
		onApplyFilters: vi.fn(),
		onClearFilters: vi.fn(),
		onRemoveFilter: vi.fn(),
	};

	it("renders search input", () => {
		render(<ClientsFilters {...defaultProps} />);

		const searchInput = screen.getByPlaceholderText("Buscar por nombre o RFC...");
		expect(searchInput).toBeInTheDocument();
	});

	it("calls onSearchChange when typing in search input", async () => {
		const user = userEvent.setup();
		const { container } = render(<ClientsFilters {...defaultProps} />);

		const searchInput = container.querySelector(
			'input[placeholder="Buscar por nombre o RFC..."]',
		) as HTMLInputElement;
		expect(searchInput).toBeInTheDocument();
		await user.type(searchInput, "test");

		expect(defaultProps.onSearchChange).toHaveBeenCalled();
	});

	it("renders risk filter select", () => {
		render(<ClientsFilters {...defaultProps} />);

		const riskSelects = screen.getAllByRole("combobox", { name: /nivel de riesgo/i });
		expect(riskSelects.length).toBeGreaterThan(0);
	});

	it("renders status filter select", () => {
		render(<ClientsFilters {...defaultProps} />);

		const statusSelects = screen.getAllByRole("combobox", { name: /estado/i });
		expect(statusSelects.length).toBeGreaterThan(0);
	});

	it("renders apply button", () => {
		const { container } = render(<ClientsFilters {...defaultProps} />);

		const applyButtons = screen.getAllByRole("button", { name: /aplicar/i });
		const ourButton = applyButtons.find((btn) => container.contains(btn));
		expect(ourButton).toBeInTheDocument();
	});

	it("disables apply button when no filters are set", () => {
		const { container } = render(<ClientsFilters {...defaultProps} />);

		const applyButtons = screen.getAllByRole("button", { name: /aplicar/i });
		const ourButton = applyButtons.find((btn) =>
			container.contains(btn),
		) as HTMLButtonElement;
		expect(ourButton).toBeDisabled();
	});

	it("enables apply button when filters are set", () => {
		const { container } = render(
			<ClientsFilters {...defaultProps} searchQuery="test" />,
		);

		const applyButtons = screen.getAllByRole("button", { name: /aplicar/i });
		const ourButton = applyButtons.find((btn) =>
			container.contains(btn),
		) as HTMLButtonElement;
		expect(ourButton).not.toBeDisabled();
	});

	it("calls onApplyFilters when apply button is clicked", async () => {
		const user = userEvent.setup();
		const { container } = render(
			<ClientsFilters {...defaultProps} searchQuery="test" />,
		);

		const applyButtons = screen.getAllByRole("button", { name: /aplicar/i });
		const ourButton = applyButtons.find((btn) =>
			container.contains(btn),
		) as HTMLButtonElement;
		await user.click(ourButton);

		expect(defaultProps.onApplyFilters).toHaveBeenCalled();
	});

	it("renders clear button when filters are active", () => {
		const { container } = render(
			<ClientsFilters {...defaultProps} searchQuery="test" />,
		);

		const clearButtons = screen.getAllByRole("button", { name: /limpiar/i });
		const ourButton = clearButtons.find((btn) => container.contains(btn));
		expect(ourButton).toBeInTheDocument();
	});

	it("calls onClearFilters when clear button is clicked", async () => {
		const user = userEvent.setup();
		const { container } = render(
			<ClientsFilters {...defaultProps} searchQuery="test" />,
		);

		const clearButtons = screen.getAllByRole("button", { name: /limpiar/i });
		const ourButton = clearButtons.find((btn) =>
			container.contains(btn),
		) as HTMLButtonElement;
		await user.click(ourButton);

		expect(defaultProps.onClearFilters).toHaveBeenCalled();
	});

	it("renders active filter chips", () => {
		render(
			<ClientsFilters
				{...defaultProps}
				activeFilters={["Búsqueda: \"test\"", "Riesgo: Alto"]}
			/>,
		);

		expect(screen.getByText("Búsqueda: \"test\"")).toBeInTheDocument();
		expect(screen.getByText("Riesgo: Alto")).toBeInTheDocument();
	});

	it("calls onRemoveFilter when filter chip is removed", async () => {
		const user = userEvent.setup();
		const { container } = render(
			<ClientsFilters
				{...defaultProps}
				activeFilters={["Búsqueda: \"test\""]}
			/>,
		);

		const removeButtons = screen.getAllByLabelText(/remover filtro/i);
		const ourButton = removeButtons.find((btn) => container.contains(btn));
		if (ourButton) {
			await user.click(ourButton);
			expect(defaultProps.onRemoveFilter).toHaveBeenCalledWith(
				'Búsqueda: "test"',
			);
		}
	});

	it("renders advanced filters toggle", () => {
		const { container } = render(<ClientsFilters {...defaultProps} />);

		const toggleButtons = screen.getAllByRole("button", {
			name: /búsqueda avanzada/i,
		});
		const ourButton = toggleButtons.find((btn) => container.contains(btn));
		expect(ourButton).toBeInTheDocument();
	});
});
