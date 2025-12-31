import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
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

describe("NavBreadcrumb", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockPathname.mockReturnValue("/test-org/clients");
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
});
