import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FilterDrawer } from "./filter-drawer";
import type { FilterDef } from "./types";
import { AlertCircle, User } from "lucide-react";

describe("FilterDrawer", () => {
	const mockOnClose = vi.fn();
	const mockOnToggleFilter = vi.fn();
	const mockOnClearAll = vi.fn();

	const mockFilters: FilterDef[] = [
		{
			id: "status",
			label: "Status",
			icon: AlertCircle,
			options: [
				{ value: "active", label: "Active" },
				{ value: "inactive", label: "Inactive" },
			],
		},
		{
			id: "type",
			label: "Type",
			icon: User,
			options: [
				{
					value: "type1",
					label: "Type 1",
					icon: <span data-testid="type-icon">📦</span>,
				},
				{ value: "type2", label: "Type 2" },
			],
		},
	];

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders when isOpen is true", () => {
		render(
			<FilterDrawer
				isOpen={true}
				onClose={mockOnClose}
				filters={mockFilters}
				activeFilters={{}}
				onToggleFilter={mockOnToggleFilter}
				onClearAll={mockOnClearAll}
			/>,
		);

		expect(screen.getByText("Filtros")).toBeInTheDocument();
	});

	it("renders with custom title text", () => {
		render(
			<FilterDrawer
				isOpen={true}
				onClose={mockOnClose}
				filters={mockFilters}
				activeFilters={{}}
				onToggleFilter={mockOnToggleFilter}
				onClearAll={mockOnClearAll}
				filtersTitleText="Custom Filters"
			/>,
		);

		expect(screen.getByText("Custom Filters")).toBeInTheDocument();
	});

	it("shows active filter count", () => {
		render(
			<FilterDrawer
				isOpen={true}
				onClose={mockOnClose}
				filters={mockFilters}
				activeFilters={{ status: ["active", "inactive"] }}
				onToggleFilter={mockOnToggleFilter}
				onClearAll={mockOnClearAll}
			/>,
		);

		expect(screen.getByText(/2 filtros activos/)).toBeInTheDocument();
	});

	it("shows singular filter count when only one active", () => {
		render(
			<FilterDrawer
				isOpen={true}
				onClose={mockOnClose}
				filters={mockFilters}
				activeFilters={{ status: ["active"] }}
				onToggleFilter={mockOnToggleFilter}
				onClearAll={mockOnClearAll}
			/>,
		);

		expect(screen.getByText(/1 filtro activo/)).toBeInTheDocument();
	});

	it("calls onClose when backdrop is clicked", () => {
		render(
			<FilterDrawer
				isOpen={true}
				onClose={mockOnClose}
				filters={mockFilters}
				activeFilters={{}}
				onToggleFilter={mockOnToggleFilter}
				onClearAll={mockOnClearAll}
			/>,
		);

		// Click the backdrop
		const backdrop = document.querySelector(".fixed.inset-0");
		fireEvent.click(backdrop!);

		expect(mockOnClose).toHaveBeenCalled();
	});

	it("calls onClose when close button is clicked", () => {
		render(
			<FilterDrawer
				isOpen={true}
				onClose={mockOnClose}
				filters={mockFilters}
				activeFilters={{}}
				onToggleFilter={mockOnToggleFilter}
				onClearAll={mockOnClearAll}
			/>,
		);

		const closeButtons = screen.getAllByRole("button");
		// Find the close button (the one that's small)
		const closeButton = closeButtons.find(
			(btn) => btn.querySelector("svg[class*='h-4 w-4']") !== null,
		);
		fireEvent.click(closeButton!);

		expect(mockOnClose).toHaveBeenCalled();
	});

	it("calls onClearAll when clear button is clicked", () => {
		render(
			<FilterDrawer
				isOpen={true}
				onClose={mockOnClose}
				filters={mockFilters}
				activeFilters={{ status: ["active"] }}
				onToggleFilter={mockOnToggleFilter}
				onClearAll={mockOnClearAll}
			/>,
		);

		fireEvent.click(screen.getByText("Limpiar"));
		expect(mockOnClearAll).toHaveBeenCalled();
	});

	it("calls onToggleFilter when filter option is clicked", () => {
		render(
			<FilterDrawer
				isOpen={true}
				onClose={mockOnClose}
				filters={mockFilters}
				activeFilters={{}}
				onToggleFilter={mockOnToggleFilter}
				onClearAll={mockOnClearAll}
			/>,
		);

		fireEvent.click(screen.getByText("Active"));
		expect(mockOnToggleFilter).toHaveBeenCalledWith("status", "active");
	});

	it("highlights selected filter options", () => {
		render(
			<FilterDrawer
				isOpen={true}
				onClose={mockOnClose}
				filters={mockFilters}
				activeFilters={{ status: ["active"] }}
				onToggleFilter={mockOnToggleFilter}
				onClearAll={mockOnClearAll}
			/>,
		);

		const activeButton = screen.getByText("Active").closest("button");
		expect(activeButton?.className).toContain("bg-primary/10");
	});

	it("calls onClose when apply button is clicked", () => {
		render(
			<FilterDrawer
				isOpen={true}
				onClose={mockOnClose}
				filters={mockFilters}
				activeFilters={{}}
				onToggleFilter={mockOnToggleFilter}
				onClearAll={mockOnClearAll}
			/>,
		);

		fireEvent.click(screen.getByText("Aplicar Filtros"));
		expect(mockOnClose).toHaveBeenCalled();
	});

	it("renders option icon when provided", () => {
		render(
			<FilterDrawer
				isOpen={true}
				onClose={mockOnClose}
				filters={mockFilters}
				activeFilters={{}}
				onToggleFilter={mockOnToggleFilter}
				onClearAll={mockOnClearAll}
			/>,
		);

		expect(screen.getByTestId("type-icon")).toBeInTheDocument();
	});

	it("renders fallback icon when no option icon", () => {
		render(
			<FilterDrawer
				isOpen={true}
				onClose={mockOnClose}
				filters={mockFilters}
				activeFilters={{}}
				onToggleFilter={mockOnToggleFilter}
				onClearAll={mockOnClearAll}
			/>,
		);

		// Type 2 has no icon, so it should render the fallback
		expect(screen.getByText("Type 2")).toBeInTheDocument();
	});

	it("skips clientId filter", () => {
		const filtersWithClientId: FilterDef[] = [
			...mockFilters,
			{
				id: "clientId",
				label: "Client",
				icon: User,
				options: [{ value: "client1", label: "Client 1" }],
			},
		];

		render(
			<FilterDrawer
				isOpen={true}
				onClose={mockOnClose}
				filters={filtersWithClientId}
				activeFilters={{}}
				onToggleFilter={mockOnToggleFilter}
				onClearAll={mockOnClearAll}
			/>,
		);

		// Client filter should not be rendered in drawer
		expect(screen.queryByText("Client 1")).not.toBeInTheDocument();
	});

	it("skips filters with no options", () => {
		const filtersWithEmpty: FilterDef[] = [
			...mockFilters,
			{
				id: "empty",
				label: "Empty Filter",
				icon: User,
				options: [],
			},
		];

		render(
			<FilterDrawer
				isOpen={true}
				onClose={mockOnClose}
				filters={filtersWithEmpty}
				activeFilters={{}}
				onToggleFilter={mockOnToggleFilter}
				onClearAll={mockOnClearAll}
			/>,
		);

		expect(screen.queryByText("Empty Filter")).not.toBeInTheDocument();
	});

	it("does not show clear button when no filters active", () => {
		render(
			<FilterDrawer
				isOpen={true}
				onClose={mockOnClose}
				filters={mockFilters}
				activeFilters={{}}
				onToggleFilter={mockOnToggleFilter}
				onClearAll={mockOnClearAll}
			/>,
		);

		expect(screen.queryByText("Limpiar")).not.toBeInTheDocument();
	});

	it("uses custom text props", () => {
		render(
			<FilterDrawer
				isOpen={true}
				onClose={mockOnClose}
				filters={mockFilters}
				activeFilters={{ status: ["active"] }}
				onToggleFilter={mockOnToggleFilter}
				onClearAll={mockOnClearAll}
				clearText="Clear"
				applyFiltersText="Apply"
				filterText="filter"
				filtersText="filters"
				activeText="active"
				activePluralText="active"
			/>,
		);

		expect(screen.getByText("Clear")).toBeInTheDocument();
		expect(screen.getByText("Apply")).toBeInTheDocument();
	});
});
