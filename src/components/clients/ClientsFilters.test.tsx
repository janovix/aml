import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClientsFilters } from "./ClientsFilters";

describe("ClientsFilters", () => {
	const mockProps = {
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
		render(<ClientsFilters {...mockProps} />);

		expect(
			screen.getByPlaceholderText("Buscar por nombre o RFC..."),
		).toBeInTheDocument();
	});

	it("renders filter buttons", () => {
		render(<ClientsFilters {...mockProps} />);

		expect(screen.getByText("Aplicar")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Búsqueda avanzada" }),
		).toBeInTheDocument();
	});

	it("displays active filters when present", () => {
		const propsWithFilters = {
			...mockProps,
			activeFilters: ["Riesgo: Alto", "Estado: Activo"],
		};

		render(<ClientsFilters {...propsWithFilters} />);

		expect(screen.getByText("Filtros activos:")).toBeInTheDocument();
		expect(screen.getByText("Riesgo: Alto")).toBeInTheDocument();
		expect(screen.getByText("Estado: Activo")).toBeInTheDocument();
	});
});
