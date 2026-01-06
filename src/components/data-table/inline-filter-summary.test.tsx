import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InlineFilterSummary } from "./inline-filter-summary";
import type { ActiveFilter } from "./types";

describe("InlineFilterSummary", () => {
	const mockOnRemoveFilter = vi.fn();
	const mockOnClearAll = vi.fn();
	const mockOnOpenFilters = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders filter button when no active filters", () => {
		render(
			<InlineFilterSummary
				activeFilters={[]}
				onRemoveFilter={mockOnRemoveFilter}
				onClearAll={mockOnClearAll}
				onOpenFilters={mockOnOpenFilters}
			/>,
		);

		expect(screen.getByText("Filtrar")).toBeInTheDocument();
	});

	it("calls onOpenFilters when filter button is clicked", () => {
		render(
			<InlineFilterSummary
				activeFilters={[]}
				onRemoveFilter={mockOnRemoveFilter}
				onClearAll={mockOnClearAll}
				onOpenFilters={mockOnOpenFilters}
			/>,
		);

		fireEvent.click(screen.getByText("Filtrar"));
		expect(mockOnOpenFilters).toHaveBeenCalled();
	});

	it("renders compact summary when compact mode is enabled", () => {
		const activeFilters: ActiveFilter[] = [
			{
				filterId: "status",
				filterLabel: "Status",
				values: [
					{ value: "active", label: "Active" },
					{ value: "inactive", label: "Inactive" },
				],
			},
		];

		render(
			<InlineFilterSummary
				activeFilters={activeFilters}
				onRemoveFilter={mockOnRemoveFilter}
				onClearAll={mockOnClearAll}
				onOpenFilters={mockOnOpenFilters}
				compact={true}
			/>,
		);

		expect(screen.getByText(/2 filtros/)).toBeInTheDocument();
	});

	it("shows singular 'filtro' text when only one filter active in compact mode", () => {
		const activeFilters: ActiveFilter[] = [
			{
				filterId: "status",
				filterLabel: "Status",
				values: [{ value: "active", label: "Active" }],
			},
		];

		render(
			<InlineFilterSummary
				activeFilters={activeFilters}
				onRemoveFilter={mockOnRemoveFilter}
				onClearAll={mockOnClearAll}
				onOpenFilters={mockOnOpenFilters}
				compact={true}
			/>,
		);

		expect(screen.getByText(/1 filtro/)).toBeInTheDocument();
	});

	it("renders filter pills when not in compact mode", () => {
		const activeFilters: ActiveFilter[] = [
			{
				filterId: "status",
				filterLabel: "Status",
				values: [{ value: "active", label: "Active" }],
			},
		];

		render(
			<InlineFilterSummary
				activeFilters={activeFilters}
				onRemoveFilter={mockOnRemoveFilter}
				onClearAll={mockOnClearAll}
				onOpenFilters={mockOnOpenFilters}
			/>,
		);

		expect(screen.getByText("Active")).toBeInTheDocument();
		expect(screen.getByText("Limpiar todo")).toBeInTheDocument();
	});

	it("calls onRemoveFilter when filter pill is clicked", () => {
		const activeFilters: ActiveFilter[] = [
			{
				filterId: "status",
				filterLabel: "Status",
				values: [{ value: "active", label: "Active" }],
			},
		];

		render(
			<InlineFilterSummary
				activeFilters={activeFilters}
				onRemoveFilter={mockOnRemoveFilter}
				onClearAll={mockOnClearAll}
				onOpenFilters={mockOnOpenFilters}
			/>,
		);

		fireEvent.click(screen.getByLabelText("Eliminar filtro Active"));
		expect(mockOnRemoveFilter).toHaveBeenCalledWith("status", "active");
	});

	it("calls onClearAll when clear all button is clicked", () => {
		const activeFilters: ActiveFilter[] = [
			{
				filterId: "status",
				filterLabel: "Status",
				values: [{ value: "active", label: "Active" }],
			},
		];

		render(
			<InlineFilterSummary
				activeFilters={activeFilters}
				onRemoveFilter={mockOnRemoveFilter}
				onClearAll={mockOnClearAll}
				onOpenFilters={mockOnOpenFilters}
			/>,
		);

		fireEvent.click(screen.getByText("Limpiar todo"));
		expect(mockOnClearAll).toHaveBeenCalled();
	});

	it("uses custom text props", () => {
		render(
			<InlineFilterSummary
				activeFilters={[]}
				onRemoveFilter={mockOnRemoveFilter}
				onClearAll={mockOnClearAll}
				onOpenFilters={mockOnOpenFilters}
				filterButtonText="Filter"
			/>,
		);

		expect(screen.getByText("Filter")).toBeInTheDocument();
	});

	it("uses custom clear all text", () => {
		const activeFilters: ActiveFilter[] = [
			{
				filterId: "status",
				filterLabel: "Status",
				values: [{ value: "active", label: "Active" }],
			},
		];

		render(
			<InlineFilterSummary
				activeFilters={activeFilters}
				onRemoveFilter={mockOnRemoveFilter}
				onClearAll={mockOnClearAll}
				onOpenFilters={mockOnOpenFilters}
				clearAllText="Clear All"
			/>,
		);

		expect(screen.getByText("Clear All")).toBeInTheDocument();
	});

	it("renders filter icon in pill when provided", () => {
		const activeFilters: ActiveFilter[] = [
			{
				filterId: "status",
				filterLabel: "Status",
				values: [
					{
						value: "active",
						label: "Active",
						icon: <span data-testid="filter-icon">🔵</span>,
					},
				],
			},
		];

		render(
			<InlineFilterSummary
				activeFilters={activeFilters}
				onRemoveFilter={mockOnRemoveFilter}
				onClearAll={mockOnClearAll}
				onOpenFilters={mockOnOpenFilters}
			/>,
		);

		expect(screen.getByTestId("filter-icon")).toBeInTheDocument();
	});

	it("renders multiple filter pills from multiple filters", () => {
		const activeFilters: ActiveFilter[] = [
			{
				filterId: "status",
				filterLabel: "Status",
				values: [{ value: "active", label: "Active" }],
			},
			{
				filterId: "type",
				filterLabel: "Type",
				values: [
					{ value: "type1", label: "Type 1" },
					{ value: "type2", label: "Type 2" },
				],
			},
		];

		render(
			<InlineFilterSummary
				activeFilters={activeFilters}
				onRemoveFilter={mockOnRemoveFilter}
				onClearAll={mockOnClearAll}
				onOpenFilters={mockOnOpenFilters}
			/>,
		);

		expect(screen.getByText("Active")).toBeInTheDocument();
		expect(screen.getByText("Type 1")).toBeInTheDocument();
		expect(screen.getByText("Type 2")).toBeInTheDocument();
	});

	it("calls onOpenFilters in compact mode", () => {
		const activeFilters: ActiveFilter[] = [
			{
				filterId: "status",
				filterLabel: "Status",
				values: [{ value: "active", label: "Active" }],
			},
		];

		render(
			<InlineFilterSummary
				activeFilters={activeFilters}
				onRemoveFilter={mockOnRemoveFilter}
				onClearAll={mockOnClearAll}
				onOpenFilters={mockOnOpenFilters}
				compact={true}
			/>,
		);

		fireEvent.click(screen.getByText(/1 filtro/));
		expect(mockOnOpenFilters).toHaveBeenCalled();
	});
});
