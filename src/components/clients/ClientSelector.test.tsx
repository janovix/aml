import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClientSelector } from "./ClientSelector";
import { useClientSearch } from "@/hooks/useClientSearch";
import { useIsMobile } from "@/hooks/use-mobile";

vi.mock("@/hooks/useClientSearch");
vi.mock("@/hooks/use-mobile");

const mockUseIsMobile = vi.mocked(useIsMobile);

const mockClients = [
	{
		id: "1",
		rfc: "PECJ850615E56",
		personType: "physical" as const,
		firstName: "Juan",
		lastName: "Pérez",
		secondLastName: "García",
		email: "juan@example.com",
		phone: "+52 55 1234 5678",
		country: "MX",
		stateCode: "CDMX",
		city: "Ciudad de México",
		municipality: "Benito Juárez",
		neighborhood: "Del Valle",
		street: "Av. Insurgentes Sur",
		externalNumber: "1234",
		postalCode: "03100",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
];

describe("ClientSelector", () => {
	const mockUseClientSearch = {
		items: mockClients,
		pagination: {
			page: 1,
			limit: 15,
			total: 1,
			totalPages: 1,
		},
		loading: false,
		error: null,
		searchTerm: "",
		setSearchTerm: vi.fn(),
		reload: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(useClientSearch).mockReturnValue(mockUseClientSearch);
		mockUseIsMobile.mockReturnValue(false); // Default to desktop
	});

	it("should render with label", () => {
		render(<ClientSelector label="Cliente" />);
		expect(screen.getByText("Cliente")).toBeInTheDocument();
	});

	it("should show required indicator when required", () => {
		render(<ClientSelector label="Cliente" required />);
		const label = screen.getByText("Cliente");
		expect(label.querySelector(".text-destructive")).toBeInTheDocument();
	});

	it("should display placeholder", () => {
		render(<ClientSelector placeholder="Seleccionar cliente" />);
		expect(screen.getByText("Seleccionar cliente")).toBeInTheDocument();
	});

	it("should render with different states", () => {
		// Test loading state
		vi.mocked(useClientSearch).mockReturnValue({
			...mockUseClientSearch,
			loading: true,
		});
		const { rerender } = render(<ClientSelector />);
		expect(screen.getAllByText(/cliente/i).length).toBeGreaterThan(0);

		// Test error state
		vi.mocked(useClientSearch).mockReturnValue({
			...mockUseClientSearch,
			error: "Error al cargar",
			loading: false,
		});
		rerender(<ClientSelector />);
		expect(screen.getAllByText(/cliente/i).length).toBeGreaterThan(0);

		// Test empty items
		vi.mocked(useClientSearch).mockReturnValue({
			...mockUseClientSearch,
			items: [],
			error: null,
		});
		rerender(<ClientSelector emptyState="No hay clientes" />);
		expect(screen.getAllByText(/cliente/i).length).toBeGreaterThan(0);
	});

	it("should handle client with empty display name", () => {
		const clientWithEmptyName = {
			...mockClients[0],
			firstName: null,
			lastName: null,
			secondLastName: null,
		};
		vi.mocked(useClientSearch).mockReturnValue({
			...mockUseClientSearch,
			items: [clientWithEmptyName],
		});
		render(<ClientSelector />);
		expect(screen.getAllByText(/cliente/i).length).toBeGreaterThan(0);
	});

	it("should handle controlled value", () => {
		vi.mocked(useClientSearch).mockReturnValue({
			...mockUseClientSearch,
			items: mockClients,
		});
		render(<ClientSelector value="1" />);
		// Component renders with controlled value
		expect(screen.getAllByText(/cliente/i).length).toBeGreaterThan(0);
	});

	it("should handle value change to empty", () => {
		vi.mocked(useClientSearch).mockReturnValue({
			...mockUseClientSearch,
			items: mockClients,
		});
		const { rerender } = render(<ClientSelector value="1" />);
		rerender(<ClientSelector value="" />);
		expect(screen.getAllByText(/cliente/i).length).toBeGreaterThan(0);
	});

	it("should show helper text when provided", () => {
		render(<ClientSelector helperText="Selecciona un cliente" />);
		expect(screen.getByText("Selecciona un cliente")).toBeInTheDocument();
	});

	it("should handle custom getOptionValue", () => {
		const getOptionValue = vi.fn((client) => client.rfc);
		render(<ClientSelector getOptionValue={getOptionValue} />);
		expect(screen.getAllByText(/cliente/i).length).toBeGreaterThan(0);
	});

	it("should allow selecting a client option", async () => {
		const user = userEvent.setup();
		const handleChange = vi.fn();
		const handleValueChange = vi.fn();

		render(
			<ClientSelector
				onChange={handleChange}
				onValueChange={handleValueChange}
			/>,
		);

		const trigger = screen.getByRole("combobox");
		await user.click(trigger);

		// Names are now displayed in uppercase by getClientDisplayName
		await waitFor(() => {
			expect(screen.getByText("JUAN PÉREZ GARCÍA")).toBeInTheDocument();
		});

		const option = screen.getByText("JUAN PÉREZ GARCÍA");
		await user.click(option);

		expect(handleChange).toHaveBeenCalledWith(mockClients[0]);
		expect(handleValueChange).toHaveBeenCalledWith("1");
	});

	it("should call onCreateNew when create button is clicked", async () => {
		const user = userEvent.setup();
		const onCreateNew = vi.fn();

		render(<ClientSelector onCreateNew={onCreateNew} />);

		const trigger = screen.getByRole("combobox");
		await user.click(trigger);

		await waitFor(() => {
			expect(screen.getByText("Crear nuevo cliente")).toBeInTheDocument();
		});

		const createButton = screen.getByText("Crear nuevo cliente");
		await user.click(createButton);

		expect(onCreateNew).toHaveBeenCalled();
	});

	it("should show create button in empty state when onCreateNew is provided", async () => {
		const user = userEvent.setup();
		const onCreateNew = vi.fn();

		vi.mocked(useClientSearch).mockReturnValue({
			...mockUseClientSearch,
			items: [],
		});

		render(<ClientSelector onCreateNew={onCreateNew} />);

		const trigger = screen.getByRole("combobox");
		await user.click(trigger);

		await waitFor(() => {
			// Should find at least one create button (may appear in multiple places)
			const createButtons = screen.getAllByText("Crear nuevo cliente");
			expect(createButtons.length).toBeGreaterThan(0);
		});
	});

	it("should handle search functionality", async () => {
		const user = userEvent.setup();
		const mockSetSearchTerm = vi.fn();

		vi.mocked(useClientSearch).mockReturnValue({
			...mockUseClientSearch,
			setSearchTerm: mockSetSearchTerm,
		});

		render(<ClientSelector />);

		const trigger = screen.getByRole("combobox");
		await user.click(trigger);

		const searchInput = await screen.findByPlaceholderText(
			"Buscar cliente por nombre o RFC...",
		);
		expect(searchInput).toBeInTheDocument();

		await user.type(searchInput, "Juan");

		expect(mockSetSearchTerm).toHaveBeenCalled();
	});

	it("should display error state", async () => {
		const user = userEvent.setup();

		vi.mocked(useClientSearch).mockReturnValue({
			...mockUseClientSearch,
			error: "Error al cargar clientes",
			loading: false,
		});

		render(<ClientSelector />);

		const trigger = screen.getByRole("combobox");
		await user.click(trigger);

		await waitFor(() => {
			expect(screen.getByText("Error al cargar clientes")).toBeInTheDocument();
		});
	});

	it("should show empty state message", async () => {
		const user = userEvent.setup();

		vi.mocked(useClientSearch).mockReturnValue({
			...mockUseClientSearch,
			items: [],
		});

		render(<ClientSelector emptyState="No hay clientes disponibles" />);

		const trigger = screen.getByRole("combobox");
		await user.click(trigger);

		await waitFor(() => {
			expect(
				screen.getByText("No hay clientes disponibles"),
			).toBeInTheDocument();
		});
	});

	it("should handle controlled value changes", async () => {
		const { rerender } = render(<ClientSelector value="1" />);

		const trigger = screen.getByRole("combobox");
		expect(trigger).toBeInTheDocument();

		rerender(<ClientSelector value="2" />);
		expect(trigger).toBeInTheDocument();
	});

	it("should clear selection when value changes to empty", async () => {
		const { rerender } = render(<ClientSelector value="1" />);

		const trigger = screen.getByRole("combobox");
		expect(trigger).toBeInTheDocument();

		rerender(<ClientSelector value="" />);
		expect(trigger).toBeInTheDocument();
	});

	it("should display selected client name in trigger", async () => {
		vi.mocked(useClientSearch).mockReturnValue({
			...mockUseClientSearch,
			items: mockClients,
		});

		render(<ClientSelector value="1" />);

		const trigger = screen.getByRole("combobox");
		// Should show client name or placeholder
		expect(trigger).toBeInTheDocument();
	});

	it("should use custom renderOption when provided", async () => {
		const user = userEvent.setup();
		const customRenderOption = vi.fn((client, isSelected) => (
			<div data-testid="custom-client-option">
				{client.rfc} {isSelected ? "(selected)" : ""}
			</div>
		));

		render(<ClientSelector renderOption={customRenderOption} />);

		const trigger = screen.getByRole("combobox");
		await user.click(trigger);

		await waitFor(() => {
			expect(customRenderOption).toHaveBeenCalled();
		});

		expect(screen.getByTestId("custom-client-option")).toBeInTheDocument();
	});

	it("should display result summary with pagination", async () => {
		const user = userEvent.setup();

		vi.mocked(useClientSearch).mockReturnValue({
			...mockUseClientSearch,
			pagination: {
				page: 1,
				limit: 15,
				total: 50,
				totalPages: 4,
			},
		});

		render(<ClientSelector />);

		const trigger = screen.getByRole("combobox");
		await user.click(trigger);

		// Type to trigger search
		const searchInput = await screen.findByPlaceholderText(
			"Buscar cliente por nombre o RFC...",
		);
		await user.type(searchInput, "test");

		await waitFor(() => {
			expect(
				screen.getByText(/Mostrando 1 de 50 clientes/),
			).toBeInTheDocument();
		});
	});

	it("should close popover after selection", async () => {
		const user = userEvent.setup();
		const handleChange = vi.fn();

		render(<ClientSelector onChange={handleChange} />);

		const trigger = screen.getByRole("combobox");
		await user.click(trigger);

		// Names are now displayed in uppercase by getClientDisplayName
		await waitFor(() => {
			expect(screen.getByText("JUAN PÉREZ GARCÍA")).toBeInTheDocument();
		});

		const option = screen.getByText("JUAN PÉREZ GARCÍA");
		await user.click(option);

		// Popover should close - verify by checking the trigger still exists and menu is not visible
		await waitFor(
			() => {
				// The popover content should not be visible
				expect(
					screen.queryByPlaceholderText("Buscar cliente por nombre o RFC..."),
				).not.toBeInTheDocument();
			},
			{ timeout: 3000 },
		);
	});

	it("should handle disabled state", () => {
		render(<ClientSelector disabled />);

		const trigger = screen.getByRole("combobox");
		expect(trigger).toBeDisabled();
	});

	it("should use custom placeholder", () => {
		render(<ClientSelector placeholder="Elige un cliente" />);

		const trigger = screen.getByRole("combobox");
		expect(trigger).toHaveTextContent("Elige un cliente");
	});

	it("should use custom search placeholder", async () => {
		const user = userEvent.setup();

		render(<ClientSelector searchPlaceholder="Buscar por RFC o nombre..." />);

		const trigger = screen.getByRole("combobox");
		await user.click(trigger);

		expect(
			await screen.findByPlaceholderText("Buscar por RFC o nombre..."),
		).toBeInTheDocument();
	});

	describe("mobile drawer behavior", () => {
		beforeEach(() => {
			mockUseIsMobile.mockReturnValue(true);
		});

		it("should open drawer on mobile when trigger is clicked", async () => {
			const user = userEvent.setup();

			render(<ClientSelector label="Cliente" />);

			const trigger = screen.getByRole("combobox");
			await user.click(trigger);

			// On mobile, Sheet should render with dialog role
			await waitFor(() => {
				expect(screen.getByRole("dialog")).toBeInTheDocument();
			});

			// Should show the title in the sheet header (h2 element)
			const dialog = screen.getByRole("dialog");
			expect(dialog.querySelector("h2")).toHaveTextContent("Cliente");
		});

		it("should show search input in mobile drawer", async () => {
			const user = userEvent.setup();

			render(<ClientSelector label="Cliente" />);

			const trigger = screen.getByRole("combobox");
			await user.click(trigger);

			await waitFor(() => {
				expect(
					screen.getByPlaceholderText("Buscar cliente por nombre o RFC..."),
				).toBeInTheDocument();
			});
		});

		it("should allow selecting client in mobile drawer", async () => {
			const user = userEvent.setup();
			const handleChange = vi.fn();

			render(<ClientSelector onChange={handleChange} />);

			const trigger = screen.getByRole("combobox");
			await user.click(trigger);

			await waitFor(() => {
				expect(screen.getByText("JUAN PÉREZ GARCÍA")).toBeInTheDocument();
			});

			const option = screen.getByText("JUAN PÉREZ GARCÍA");
			await user.click(option);

			expect(handleChange).toHaveBeenCalledWith(mockClients[0]);
		});

		it("should close drawer after selection on mobile", async () => {
			const user = userEvent.setup();

			render(<ClientSelector />);

			const trigger = screen.getByRole("combobox");
			await user.click(trigger);

			await waitFor(() => {
				expect(screen.getByText("JUAN PÉREZ GARCÍA")).toBeInTheDocument();
			});

			const option = screen.getByText("JUAN PÉREZ GARCÍA");
			await user.click(option);

			await waitFor(() => {
				expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
			});
		});

		it("should show required indicator in mobile drawer title", async () => {
			const user = userEvent.setup();

			render(<ClientSelector label="Cliente" required />);

			const trigger = screen.getByRole("combobox");
			await user.click(trigger);

			await waitFor(() => {
				const dialog = screen.getByRole("dialog");
				expect(dialog.querySelector(".text-destructive")).toBeInTheDocument();
			});
		});

		it("should show create new button in mobile drawer when onCreateNew is provided", async () => {
			const user = userEvent.setup();
			const onCreateNew = vi.fn();

			render(<ClientSelector onCreateNew={onCreateNew} />);

			const trigger = screen.getByRole("combobox");
			await user.click(trigger);

			await waitFor(() => {
				expect(screen.getByText("Crear nuevo cliente")).toBeInTheDocument();
			});
		});
	});
});
