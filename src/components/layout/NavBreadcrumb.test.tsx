import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { NavBreadcrumb } from "./NavBreadcrumb";

// Mock usePathname
const mockPathname = vi.fn(() => "/test-org/clients");

vi.mock("next/navigation", () => ({
	usePathname: () => mockPathname(),
	useParams: () => ({ orgSlug: "test-org" }),
}));

vi.mock("@/lib/org-store", () => ({
	useOrgStore: () => ({
		currentOrg: { slug: "test-org", name: "Test Org", id: "1" },
	}),
}));

// Mock getClientById
const mockGetClientById = vi.fn();
vi.mock("@/lib/api/clients", () => ({
	getClientById: (opts: { id: string }) => mockGetClientById(opts),
}));

describe("NavBreadcrumb", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockPathname.mockReturnValue("/test-org/clients");
		mockGetClientById.mockResolvedValue({
			id: "CLT123456789",
			personType: "physical",
			firstName: "Juan",
			lastName: "Pérez",
			secondLastName: "García",
			rfc: "PEGJ800101AAA",
			email: "juan@example.com",
			phone: "5551234567",
			country: "MX",
			stateCode: "CMX",
			city: "CDMX",
			municipality: "Cuauhtémoc",
			neighborhood: "Centro",
			street: "Reforma",
			externalNumber: "123",
			postalCode: "06600",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		});
	});

	it("renders home link", () => {
		render(<NavBreadcrumb />);

		// Should have a link to home (anchor tag, not BreadcrumbPage span with role="link")
		const homeLink = screen.getByRole("link", { name: /inicio/i });
		expect(homeLink).toBeInTheDocument();
		expect(homeLink).toHaveAttribute("href", "/test-org/clients");
	});

	it("renders current page in breadcrumb", () => {
		render(<NavBreadcrumb />);

		// Should show Clientes as the current page
		expect(screen.getByText("Clientes")).toBeInTheDocument();
	});

	it("renders breadcrumb navigation", () => {
		render(<NavBreadcrumb />);

		// Should have breadcrumb navigation
		const nav = screen.getByRole("navigation", { name: /breadcrumb/i });
		expect(nav).toBeInTheDocument();
	});

	it("renders nested route correctly", () => {
		mockPathname.mockReturnValue("/test-org/clients/123/edit");
		render(<NavBreadcrumb />);

		// Should show Clientes, truncated ID, and Editar
		expect(screen.getByText("Clientes")).toBeInTheDocument();
		expect(screen.getByText("Editar")).toBeInTheDocument();
	});

	it("renders transactions route", () => {
		mockPathname.mockReturnValue("/test-org/transactions");
		render(<NavBreadcrumb />);

		expect(screen.getByText("Transacciones")).toBeInTheDocument();
	});

	it("renders alerts route", () => {
		mockPathname.mockReturnValue("/test-org/alerts");
		render(<NavBreadcrumb />);

		expect(screen.getByText("Alertas")).toBeInTheDocument();
	});

	it("renders reports route", () => {
		mockPathname.mockReturnValue("/test-org/reports");
		render(<NavBreadcrumb />);

		expect(screen.getByText("Reportes")).toBeInTheDocument();
	});

	it("renders team route", () => {
		mockPathname.mockReturnValue("/test-org/team");
		render(<NavBreadcrumb />);

		expect(screen.getByText("Equipo")).toBeInTheDocument();
	});

	it("renders settings route", () => {
		mockPathname.mockReturnValue("/test-org/settings");
		render(<NavBreadcrumb />);

		expect(screen.getByText("Configuración")).toBeInTheDocument();
	});

	it("renders new client route", () => {
		mockPathname.mockReturnValue("/test-org/clients/new");
		render(<NavBreadcrumb />);

		expect(screen.getByText("Clientes")).toBeInTheDocument();
		expect(screen.getByText("Nuevo")).toBeInTheDocument();
	});

	it("renders edit route", () => {
		mockPathname.mockReturnValue("/test-org/transactions/abc123/edit");
		render(<NavBreadcrumb />);

		expect(screen.getByText("Transacciones")).toBeInTheDocument();
		expect(screen.getByText("Editar")).toBeInTheDocument();
	});

	it("truncates long IDs", () => {
		mockPathname.mockReturnValue(
			"/test-org/clients/12345678-1234-1234-1234-123456789012",
		);
		render(<NavBreadcrumb />);

		// UUID should be truncated
		expect(screen.getByText("12345678…")).toBeInTheDocument();
	});

	it("renders home page when at org root", () => {
		mockPathname.mockReturnValue("/test-org");
		render(<NavBreadcrumb />);

		// Should show just home
		expect(screen.getByText("Inicio")).toBeInTheDocument();
	});

	it("has horizontal scroll container for mobile", () => {
		render(<NavBreadcrumb />);

		// Check for overflow-x-auto class on the breadcrumb list
		const list = document.querySelector('[data-slot="breadcrumb-list"]');
		expect(list).toHaveClass("overflow-x-auto");
	});

	it("renders separators between breadcrumb items", () => {
		mockPathname.mockReturnValue("/test-org/clients/new");
		render(<NavBreadcrumb />);

		// Should have separators
		const separators = document.querySelectorAll(
			'[data-slot="breadcrumb-separator"]',
		);
		expect(separators.length).toBeGreaterThan(0);
	});

	describe("client name fetching", () => {
		it("fetches and displays client name for client detail pages", async () => {
			mockPathname.mockReturnValue("/test-org/clients/CLT123456789");
			render(<NavBreadcrumb />);

			// Initially should show truncated ID
			expect(screen.getByText("CLT12345…")).toBeInTheDocument();

			// After fetch, should show client name (formatProperNoun converts to uppercase)
			await waitFor(() => {
				expect(screen.getByText("JUAN PÉREZ GARCÍA")).toBeInTheDocument();
			});

			// Should have called getClientById with the correct ID
			expect(mockGetClientById).toHaveBeenCalledWith(
				expect.objectContaining({ id: "CLT123456789" }),
			);
		});

		it("displays business name for moral person clients", async () => {
			mockGetClientById.mockResolvedValue({
				id: "CLT987654321",
				personType: "moral",
				businessName: "ACME Corporation S.A. de C.V.",
				rfc: "ACM800101AAA",
				email: "contact@acme.com",
				phone: "5551234567",
				country: "MX",
				stateCode: "CMX",
				city: "CDMX",
				municipality: "Cuauhtémoc",
				neighborhood: "Centro",
				street: "Reforma",
				externalNumber: "456",
				postalCode: "06600",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			});

			mockPathname.mockReturnValue("/test-org/clients/CLT987654321");
			render(<NavBreadcrumb />);

			// formatProperNoun converts to uppercase
			await waitFor(() => {
				expect(
					screen.getByText("ACME CORPORATION S.A. DE C.V."),
				).toBeInTheDocument();
			});
		});

		it("keeps showing truncated ID when client fetch fails", async () => {
			mockGetClientById.mockRejectedValue(new Error("Client not found"));

			mockPathname.mockReturnValue("/test-org/clients/CLT123456789");
			render(<NavBreadcrumb />);

			// Should show truncated ID
			expect(screen.getByText("CLT12345…")).toBeInTheDocument();

			// Wait for fetch to fail
			await waitFor(() => {
				expect(mockGetClientById).toHaveBeenCalled();
			});

			// Should still show truncated ID after failure
			expect(screen.getByText("CLT12345…")).toBeInTheDocument();
		});

		it("displays client name in edit page breadcrumb", async () => {
			mockPathname.mockReturnValue("/test-org/clients/CLT123456789/edit");
			render(<NavBreadcrumb />);

			// Initially shows truncated ID for the client segment
			expect(screen.getByText("CLT12345…")).toBeInTheDocument();
			expect(screen.getByText("Editar")).toBeInTheDocument();

			// After fetch, should show client name (formatProperNoun converts to uppercase)
			await waitFor(() => {
				expect(screen.getByText("JUAN PÉREZ GARCÍA")).toBeInTheDocument();
			});
		});

		it("does not fetch client for non-client ID segments", () => {
			mockPathname.mockReturnValue("/test-org/transactions/TXN123456789");
			render(<NavBreadcrumb />);

			// Should not call getClientById for transaction IDs
			expect(mockGetClientById).not.toHaveBeenCalled();
		});
	});
});
