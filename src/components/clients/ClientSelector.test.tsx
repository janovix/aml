import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClientSelector } from "./ClientSelector";
import { useClientSearch } from "@/hooks/useClientSearch";

vi.mock("@/hooks/useClientSearch");

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

	it("should show loading state", () => {
		vi.mocked(useClientSearch).mockReturnValue({
			...mockUseClientSearch,
			loading: true,
		});
		render(<ClientSelector />);
		expect(screen.getByText("Buscando clientes…")).toBeInTheDocument();
	});

	it("should show error state", () => {
		vi.mocked(useClientSearch).mockReturnValue({
			...mockUseClientSearch,
			error: "Error al cargar",
		});
		render(<ClientSelector />);
		expect(screen.getByText("Error al cargar")).toBeInTheDocument();
	});

	it("should show empty state when no results", () => {
		vi.mocked(useClientSearch).mockReturnValue({
			...mockUseClientSearch,
			items: [],
		});
		render(<ClientSelector emptyState="No hay clientes" />);
		expect(screen.getByText("No hay clientes")).toBeInTheDocument();
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
		expect(screen.getByText(/cliente/i)).toBeInTheDocument();
	});

	it("should handle controlled value", () => {
		vi.mocked(useClientSearch).mockReturnValue({
			...mockUseClientSearch,
			items: mockClients,
		});
		render(<ClientSelector value="1" />);
		expect(screen.getByText("Juan Pérez García")).toBeInTheDocument();
	});

	it("should handle value change to empty", () => {
		vi.mocked(useClientSearch).mockReturnValue({
			...mockUseClientSearch,
			items: mockClients,
		});
		const { rerender } = render(<ClientSelector value="1" />);
		rerender(<ClientSelector value="" />);
		expect(screen.getByText(/cliente/i)).toBeInTheDocument();
	});

	it("should show helper text when provided", () => {
		render(<ClientSelector helperText="Selecciona un cliente" />);
		expect(screen.getByText("Selecciona un cliente")).toBeInTheDocument();
	});

	it("should handle custom getOptionValue", () => {
		const getOptionValue = vi.fn((client) => client.rfc);
		render(<ClientSelector getOptionValue={getOptionValue} />);
		expect(screen.getByText(/cliente/i)).toBeInTheDocument();
	});
});
