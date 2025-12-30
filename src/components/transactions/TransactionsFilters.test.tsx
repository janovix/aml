import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransactionsFilters } from "./TransactionsFilters";

describe("TransactionsFilters", () => {
	it("renders search input and filter controls", () => {
		const onFiltersChange = vi.fn();
		render(
			<TransactionsFilters filters={{}} onFiltersChange={onFiltersChange} />,
		);

		expect(
			screen.getByPlaceholderText("Buscar por cliente o folio..."),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Aplicar" })).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Búsqueda avanzada" }),
		).toBeInTheDocument();
	});

	it("initializes with provided filter values", () => {
		const onFiltersChange = vi.fn();
		render(
			<TransactionsFilters
				filters={{
					operationType: "purchase",
					vehicleType: "land",
					startDate: "2024-01-15T00:00:00Z",
					endDate: "2024-01-20T23:59:59Z",
				}}
				onFiltersChange={onFiltersChange}
			/>,
		);

		// The component should initialize with these values
		expect(
			screen.getByRole("combobox", { name: /tipo de transacción/i }),
		).toBeInTheDocument();
	});

	it("updates search filter on input change", async () => {
		const user = userEvent.setup();
		const onFiltersChange = vi.fn();
		render(
			<TransactionsFilters filters={{}} onFiltersChange={onFiltersChange} />,
		);

		const searchInput = screen.getByPlaceholderText(
			"Buscar por cliente o folio...",
		);
		await user.type(searchInput, "test search");

		expect(searchInput).toHaveValue("test search");
	});

	it("calls onFiltersChange with operationType when apply is clicked", async () => {
		const user = userEvent.setup();
		const onFiltersChange = vi.fn();
		render(
			<TransactionsFilters filters={{}} onFiltersChange={onFiltersChange} />,
		);

		// Open the operation type dropdown and select purchase
		const typeFilter = screen.getByRole("combobox", {
			name: /tipo de transacción/i,
		});
		await user.click(typeFilter);
		await user.click(screen.getByRole("option", { name: "Compra" }));

		// Click apply
		await user.click(screen.getByRole("button", { name: "Aplicar" }));

		expect(onFiltersChange).toHaveBeenCalledWith(
			expect.objectContaining({
				operationType: "purchase",
			}),
		);
	});

	it("calls onFiltersChange with vehicleType when apply is clicked", async () => {
		const user = userEvent.setup();
		const onFiltersChange = vi.fn();
		render(
			<TransactionsFilters filters={{}} onFiltersChange={onFiltersChange} />,
		);

		// Open the vehicle type dropdown and select land
		const vehicleFilter = screen.getByRole("combobox", {
			name: /tipo de vehículo/i,
		});
		await user.click(vehicleFilter);
		await user.click(screen.getByRole("option", { name: "Terrestre" }));

		// Click apply
		await user.click(screen.getByRole("button", { name: "Aplicar" }));

		expect(onFiltersChange).toHaveBeenCalledWith(
			expect.objectContaining({
				vehicleType: "land",
			}),
		);
	});

	it("clears operationType when 'all' is selected", async () => {
		const user = userEvent.setup();
		const onFiltersChange = vi.fn();
		render(
			<TransactionsFilters
				filters={{ operationType: "purchase" }}
				onFiltersChange={onFiltersChange}
			/>,
		);

		// Open the operation type dropdown and select all
		const typeFilter = screen.getByRole("combobox", {
			name: /tipo de transacción/i,
		});
		await user.click(typeFilter);
		await user.click(screen.getByRole("option", { name: "Todos" }));

		// Click apply
		await user.click(screen.getByRole("button", { name: "Aplicar" }));

		expect(onFiltersChange).toHaveBeenCalledWith({});
	});

	it("clears vehicleType when 'all' is selected", async () => {
		const user = userEvent.setup();
		const onFiltersChange = vi.fn();
		render(
			<TransactionsFilters
				filters={{ vehicleType: "land" }}
				onFiltersChange={onFiltersChange}
			/>,
		);

		// Open the vehicle type dropdown and select all
		const vehicleFilter = screen.getByRole("combobox", {
			name: /tipo de vehículo/i,
		});
		await user.click(vehicleFilter);
		await user.click(screen.getByRole("option", { name: "Todos" }));

		// Click apply
		await user.click(screen.getByRole("button", { name: "Aplicar" }));

		expect(onFiltersChange).toHaveBeenCalledWith({});
	});

	it("toggles advanced filters visibility", async () => {
		const user = userEvent.setup();
		const onFiltersChange = vi.fn();
		render(
			<TransactionsFilters filters={{}} onFiltersChange={onFiltersChange} />,
		);

		// Initially advanced filters content should be hidden (collapsible is closed)
		expect(screen.queryByLabelText("Fecha desde")).not.toBeInTheDocument();

		// Click advanced filters toggle
		await user.click(screen.getByRole("button", { name: "Búsqueda avanzada" }));

		// Now advanced filters should be visible
		expect(screen.getByLabelText("Fecha desde")).toBeInTheDocument();
		expect(screen.getByLabelText("Fecha hasta")).toBeInTheDocument();
		expect(screen.getByLabelText("Monto mínimo")).toBeInTheDocument();
		expect(screen.getByLabelText("Monto máximo")).toBeInTheDocument();
	});

	it("applies date filters when dates are entered", async () => {
		const user = userEvent.setup();
		const onFiltersChange = vi.fn();
		render(
			<TransactionsFilters filters={{}} onFiltersChange={onFiltersChange} />,
		);

		// Open advanced filters
		await user.click(screen.getByRole("button", { name: "Búsqueda avanzada" }));

		// Enter start date
		const startDateInput = screen.getByLabelText("Fecha desde");
		await user.type(startDateInput, "2024-01-15");

		// Enter end date
		const endDateInput = screen.getByLabelText("Fecha hasta");
		await user.type(endDateInput, "2024-01-20");

		// Click apply
		await user.click(screen.getByRole("button", { name: "Aplicar" }));

		expect(onFiltersChange).toHaveBeenCalledWith(
			expect.objectContaining({
				startDate: expect.stringContaining("2024-01-15"),
				endDate: expect.stringContaining("2024-01-20"),
			}),
		);
	});

	it("applies multiple filters at once", async () => {
		const user = userEvent.setup();
		const onFiltersChange = vi.fn();
		render(
			<TransactionsFilters filters={{}} onFiltersChange={onFiltersChange} />,
		);

		// Select operation type
		const typeFilter = screen.getByRole("combobox", {
			name: /tipo de transacción/i,
		});
		await user.click(typeFilter);
		await user.click(screen.getByRole("option", { name: "Venta" }));

		// Select vehicle type
		const vehicleFilter = screen.getByRole("combobox", {
			name: /tipo de vehículo/i,
		});
		await user.click(vehicleFilter);
		await user.click(screen.getByRole("option", { name: "Marítimo" }));

		// Open advanced filters and add dates
		await user.click(screen.getByRole("button", { name: "Búsqueda avanzada" }));
		await user.type(screen.getByLabelText("Fecha desde"), "2024-02-01");

		// Click apply
		await user.click(screen.getByRole("button", { name: "Aplicar" }));

		expect(onFiltersChange).toHaveBeenCalledWith(
			expect.objectContaining({
				operationType: "sale",
				vehicleType: "marine",
				startDate: expect.stringContaining("2024-02-01"),
			}),
		);
	});

	it("applies air vehicle type filter", async () => {
		const user = userEvent.setup();
		const onFiltersChange = vi.fn();
		render(
			<TransactionsFilters filters={{}} onFiltersChange={onFiltersChange} />,
		);

		// Select air vehicle type
		const vehicleFilter = screen.getByRole("combobox", {
			name: /tipo de vehículo/i,
		});
		await user.click(vehicleFilter);
		await user.click(screen.getByRole("option", { name: "Aéreo" }));

		// Click apply
		await user.click(screen.getByRole("button", { name: "Aplicar" }));

		expect(onFiltersChange).toHaveBeenCalledWith(
			expect.objectContaining({
				vehicleType: "air",
			}),
		);
	});
});
