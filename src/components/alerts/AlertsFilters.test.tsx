import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AlertsFilters } from "./AlertsFilters";

describe("AlertsFilters", () => {
	const defaultProps = {
		searchQuery: "",
		onSearchChange: vi.fn(),
		statusFilter: "",
		onStatusChange: vi.fn(),
		severityFilter: "",
		onSeverityChange: vi.fn(),
		sourceFilter: "",
		onSourceChange: vi.fn(),
		activeFilters: [],
		onApplyFilters: vi.fn(),
		onClearFilters: vi.fn(),
		onRemoveFilter: vi.fn(),
	};

	it("should render search input and filters", () => {
		render(<AlertsFilters {...defaultProps} />);

		expect(
			screen.getByPlaceholderText("Buscar por título o descripción..."),
		).toBeInTheDocument();
		expect(screen.getByText("Aplicar")).toBeInTheDocument();
	});

	it("should call onSearchChange when typing in search input", async () => {
		const user = userEvent.setup();
		const onSearchChange = vi.fn();

		render(<AlertsFilters {...defaultProps} onSearchChange={onSearchChange} />);

		const searchInput = screen.getByPlaceholderText(
			"Buscar por título o descripción...",
		);
		await user.type(searchInput, "test");

		expect(onSearchChange).toHaveBeenCalled();
	});

	it("should display active filters when provided", () => {
		render(
			<AlertsFilters
				{...defaultProps}
				activeFilters={['Búsqueda: "test"', "Estado: Pendiente"]}
			/>,
		);

		expect(screen.getByText('Búsqueda: "test"')).toBeInTheDocument();
		expect(screen.getByText("Estado: Pendiente")).toBeInTheDocument();
	});
});
