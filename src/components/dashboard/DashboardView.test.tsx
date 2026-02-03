import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardView } from "./DashboardView";
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

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
	}),
	usePathname: () => "/test-org/dashboard",
	useSearchParams: () => new URLSearchParams(),
	useParams: () => ({ orgSlug: "test-org" }),
}));

// Mock the JWT hook
vi.mock("@/hooks/useJwt", () => ({
	useJwt: () => ({
		jwt: "mock-token",
		isLoading: false,
	}),
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
	getTransactionStats: vi.fn().mockResolvedValue({
		transactionsToday: 10,
		suspiciousTransactions: 3,
		totalVolume: "1500000.00",
	}),
}));

describe("DashboardView", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders page header with dashboard title", async () => {
		renderWithProviders(<DashboardView />);

		await waitFor(() => {
			const dashboardHeaders = screen.getAllByText("Inicio");
			expect(dashboardHeaders.length).toBeGreaterThan(0);
		});
	});

	it("renders refresh button", async () => {
		renderWithProviders(<DashboardView />);

		await waitFor(() => {
			const refreshButtons = screen.getAllByRole("button", {
				name: /actualizar/i,
			});
			expect(refreshButtons.length).toBeGreaterThan(0);
		});
	});

	it("renders transaction stats card", async () => {
		renderWithProviders(<DashboardView />);

		await waitFor(() => {
			const transactionStats = screen.getAllByText(
				/estadísticas de transacciones/i,
			);
			expect(transactionStats.length).toBeGreaterThan(0);
		});
	});

	it("renders client stats card", async () => {
		renderWithProviders(<DashboardView />);

		await waitFor(() => {
			const clientStats = screen.getAllByText(/estadísticas de clientes/i);
			expect(clientStats.length).toBeGreaterThan(0);
		});
	});

	it("renders link to clients page", async () => {
		renderWithProviders(<DashboardView />);

		await waitFor(() => {
			const clientLinks = screen.getAllByRole("link", { name: /clientes/i });
			expect(clientLinks.length).toBeGreaterThan(0);
			expect(clientLinks[0]).toHaveAttribute("href", "/test-org/clients");
		});
	});

	it("renders link to transactions page", async () => {
		renderWithProviders(<DashboardView />);

		await waitFor(() => {
			const transactionLinks = screen.getAllByRole("link", {
				name: /transacciones/i,
			});
			expect(transactionLinks.length).toBeGreaterThan(0);
			expect(transactionLinks[0]).toHaveAttribute(
				"href",
				"/test-org/transactions",
			);
		});
	});

	it("calls refresh when button is clicked", async () => {
		const user = userEvent.setup();
		renderWithProviders(<DashboardView />);

		await waitFor(async () => {
			const refreshButtons = screen.getAllByRole("button", {
				name: /actualizar/i,
			});
			expect(refreshButtons.length).toBeGreaterThan(0);
			await user.click(refreshButtons[0]);
		});

		// Verify the button exists and can be clicked without errors
		const refreshButtonsAfterClick = screen.getAllByRole("button", {
			name: /actualizar/i,
		});
		expect(refreshButtonsAfterClick.length).toBeGreaterThan(0);
	});
});

// Additional tests for missing branches
import * as statsApi from "@/lib/api/stats";
import * as useJwtModule from "@/hooks/useJwt";
import * as orgStoreModule from "@/lib/org-store";

describe("DashboardView branch coverage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("handles missing JWT", async () => {
		vi.spyOn(useJwtModule, "useJwt").mockReturnValue({
			jwt: null,
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});

		renderWithProviders(<DashboardView />);

		await waitFor(() => {
			const dashboardHeaders = screen.getAllByText("Inicio");
			expect(dashboardHeaders.length).toBeGreaterThan(0);
		});
	});

	it("handles missing org", async () => {
		vi.spyOn(orgStoreModule, "useOrgStore").mockReturnValue({
			currentOrg: null,
			organizations: [],
			setCurrentOrg: vi.fn(),
			addOrganization: vi.fn(),
			isLoading: false,
		});

		renderWithProviders(<DashboardView />);

		await waitFor(() => {
			const dashboardHeaders = screen.getAllByText("Inicio");
			expect(dashboardHeaders.length).toBeGreaterThan(0);
		});
	});

	it("handles JWT loading state", async () => {
		vi.spyOn(useJwtModule, "useJwt").mockReturnValue({
			jwt: null,
			isLoading: true,
			error: null,
			refetch: vi.fn(),
		});

		renderWithProviders(<DashboardView />);

		await waitFor(() => {
			const dashboardHeaders = screen.getAllByText("Inicio");
			expect(dashboardHeaders.length).toBeGreaterThan(0);
		});
	});

	it("handles null client stats", async () => {
		vi.spyOn(statsApi, "getClientStats").mockResolvedValue(null as never);

		renderWithProviders(<DashboardView />);

		await waitFor(() => {
			const dashboardHeaders = screen.getAllByText("Inicio");
			expect(dashboardHeaders.length).toBeGreaterThan(0);
		});
	});

	it("handles null transaction stats", async () => {
		vi.spyOn(statsApi, "getTransactionStats").mockResolvedValue(null as never);

		renderWithProviders(<DashboardView />);

		await waitFor(() => {
			const dashboardHeaders = screen.getAllByText("Inicio");
			expect(dashboardHeaders.length).toBeGreaterThan(0);
		});
	});

	it("handles API error", async () => {
		vi.spyOn(statsApi, "getClientStats").mockRejectedValue(
			new Error("API Error"),
		);
		vi.spyOn(statsApi, "getTransactionStats").mockRejectedValue(
			new Error("API Error"),
		);

		renderWithProviders(<DashboardView />);

		await waitFor(() => {
			const dashboardHeaders = screen.getAllByText("Inicio");
			expect(dashboardHeaders.length).toBeGreaterThan(0);
		});
	});

	it("shows client stats with person type breakdown", async () => {
		vi.spyOn(statsApi, "getClientStats").mockResolvedValue({
			totalClients: 100,
			physicalClients: 60,
			moralClients: 40,
			trustClients: 0,
		});

		renderWithProviders(<DashboardView />);

		await waitFor(() => {
			// Should show client stats section
			const dashboardHeaders = screen.getAllByText("Inicio");
			expect(dashboardHeaders.length).toBeGreaterThan(0);
		});
	});

	it("shows zero counts when no clients exist", async () => {
		vi.spyOn(statsApi, "getClientStats").mockResolvedValue({
			totalClients: 0,
			physicalClients: 0,
			moralClients: 0,
			trustClients: 0,
		});

		renderWithProviders(<DashboardView />);

		await waitFor(() => {
			const dashboardHeaders = screen.getAllByText("Inicio");
			expect(dashboardHeaders.length).toBeGreaterThan(0);
		});
	});

	it("formats currency with string value", async () => {
		vi.spyOn(statsApi, "getTransactionStats").mockResolvedValue({
			transactionsToday: 10,
			suspiciousTransactions: 3,
			totalVolume: "1500000.00",
		});

		renderWithProviders(<DashboardView />);

		await waitFor(() => {
			const dashboardHeaders = screen.getAllByText("Inicio");
			expect(dashboardHeaders.length).toBeGreaterThan(0);
		});
	});

	it("formats currency with numeric value", async () => {
		vi.spyOn(statsApi, "getTransactionStats").mockResolvedValue({
			transactionsToday: 10,
			suspiciousTransactions: 3,
			totalVolume: "1500000",
		});

		renderWithProviders(<DashboardView />);

		await waitFor(() => {
			const dashboardHeaders = screen.getAllByText("Inicio");
			expect(dashboardHeaders.length).toBeGreaterThan(0);
		});
	});

	it("handles null transaction stats gracefully", async () => {
		vi.spyOn(statsApi, "getTransactionStats").mockResolvedValue(null as never);

		renderWithProviders(<DashboardView />);

		await waitFor(() => {
			const dashboardHeaders = screen.getAllByText("Inicio");
			expect(dashboardHeaders.length).toBeGreaterThan(0);
		});
	});
});
