import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClientsPageContent } from "./ClientsPageContent";
import { renderWithProviders } from "@/lib/testHelpers";

// Mock cookies module to return Spanish language for tests
vi.mock("@/lib/cookies", () => ({
	getCookie: (name: string) => {
		if (name === "janovix-lang") return "es";
		return undefined;
	},
	setCookie: vi.fn(),
	deleteCookie: vi.fn(),
	COOKIE_NAMES: {
		THEME: "janovix-theme",
		LANGUAGE: "janovix-lang",
	},
}));

// Mock the org store
vi.mock("@/lib/org-store", () => ({
	useOrgStore: () => ({
		currentOrg: { id: "org-123", slug: "test-org", name: "Test Org" },
		organizations: [],
		setCurrentOrg: vi.fn(),
	}),
}));

// Mock the API calls
vi.mock("@/lib/api/stats", () => ({
	getClientStats: vi.fn().mockResolvedValue({
		totalClients: 100,
		physicalClients: 70,
		moralClients: 30,
		trustClients: 0,
	}),
}));

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
		replace: vi.fn(),
	}),
	usePathname: () => "/test-org/clients",
	useSearchParams: () => new URLSearchParams(),
	useParams: () => ({ orgSlug: "test-org" }),
}));

// Mock useJwt to return a valid JWT
vi.mock("@/hooks/useJwt", () => ({
	useJwt: () => ({
		jwt: "mock-jwt-token",
		isLoading: false,
		error: null,
		refetch: vi.fn(),
	}),
}));

describe("ClientsPageContent", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders page header", () => {
		renderWithProviders(<ClientsPageContent />);

		const clientesHeaders = screen.getAllByText("Clientes");
		const gestionTexts = screen.getAllByText("Gestión y monitoreo de clientes");
		expect(clientesHeaders.length).toBeGreaterThan(0);
		expect(gestionTexts.length).toBeGreaterThan(0);
	});

	it("renders new client button", () => {
		renderWithProviders(<ClientsPageContent />);

		const newButtons = screen.getAllByRole("button", {
			name: /nuevo cliente/i,
		});
		expect(newButtons.length).toBeGreaterThan(0);
	});

	it("navigates to new client page when button is clicked", async () => {
		const user = userEvent.setup();
		renderWithProviders(<ClientsPageContent />);

		const newButtons = screen.getAllByRole("button", {
			name: /nuevo cliente/i,
		});
		await user.click(newButtons[0]);

		expect(mockPush).toHaveBeenCalledWith("/test-org/clients/new");
	});

	it("renders KPI cards", () => {
		renderWithProviders(<ClientsPageContent />);

		const total = screen.getAllByText("Total Clientes");
		const physical = screen.getAllByText("Personas Físicas");
		const moral = screen.getAllByText("Personas Morales");
		expect(total.length).toBeGreaterThan(0);
		expect(physical.length).toBeGreaterThan(0);
		expect(moral.length).toBeGreaterThan(0);
	});

	it("renders clients table with built-in search", () => {
		renderWithProviders(<ClientsPageContent />);

		// Check for the DataTable by looking for search placeholder
		const searchInputs = screen.getAllByPlaceholderText(/buscar/i);
		expect(searchInputs.length).toBeGreaterThan(0);
	});

	// Mobile menu button removed - sidebar is now handled by DashboardLayout
	it.skip("renders mobile menu button", () => {
		// This test is skipped as mobile menu is now handled by DashboardLayout
	});

	it.skip("opens mobile menu when button is clicked", async () => {
		// This test is skipped as mobile menu is now handled by DashboardLayout
	});

	it.skip("closes mobile menu when overlay is clicked", async () => {
		// This test is skipped as mobile menu is now handled by DashboardLayout
	});

	// Sidebar is now handled by DashboardLayout, not ClientsPageContent
	it.skip("toggles sidebar collapse", () => {
		// This test is skipped as sidebar is now handled by DashboardLayout
	});
});
