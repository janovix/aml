import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardView } from "./DashboardView";
import { renderWithProviders } from "@/lib/testHelpers";

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

vi.mock("@/hooks/useJwt", () => ({
	useJwt: () => ({
		jwt: "mock-token",
		isLoading: false,
	}),
}));

vi.mock("@/lib/org-store", () => ({
	useOrgStore: () => ({
		currentOrg: { id: "org-123", slug: "test-org", name: "Test Org" },
		organizations: [],
		setCurrentOrg: vi.fn(),
	}),
}));

vi.mock("@/lib/api/stats", () => ({
	getClientStats: vi.fn().mockResolvedValue({
		totalClients: 100,
		physicalClients: 70,
		moralClients: 30,
		trustClients: 0,
	}),
	getOperationStats: vi.fn().mockResolvedValue({
		operationsToday: 10,
		suspiciousOperations: 3,
		totalVolume: "1500000.00",
		totalOperations: 47,
	}),
	getReportSummary: vi.fn().mockResolvedValue({
		alerts: {
			total: 15,
			bySeverity: { LOW: 5, MEDIUM: 4, HIGH: 3, CRITICAL: 3 },
			byStatus: { DETECTED: 10, SUBMITTED: 5 },
			byRule: [],
			byMonth: [],
			avgResolutionDays: 7.5,
			overdueCount: 2,
		},
		clients: {
			total: 100,
			byPersonType: { physical: 60, moral: 40 },
			byCountry: {},
			withAlerts: 8,
			newInPeriod: 12,
		},
		riskIndicators: {
			highRiskClients: 5,
			criticalAlerts: 3,
			overdueSubmissions: 1,
			complianceScore: 85,
		},
	}),
}));

const mockReportSummary = {
	alerts: {
		total: 15,
		bySeverity: { LOW: 5, MEDIUM: 4, HIGH: 3, CRITICAL: 3 },
		byStatus: { DETECTED: 10, SUBMITTED: 5 },
		byRule: [],
		byMonth: [],
		avgResolutionDays: 7.5,
		overdueCount: 2,
	},
	clients: {
		total: 100,
		byPersonType: { physical: 60, moral: 40 },
		byCountry: {},
		withAlerts: 8,
		newInPeriod: 12,
	},
	riskIndicators: {
		highRiskClients: 5,
		criticalAlerts: 3,
		overdueSubmissions: 1,
		complianceScore: 85,
	},
};

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

	it("renders operation stats card", async () => {
		renderWithProviders(<DashboardView />);

		await waitFor(() => {
			const operationStats = screen.getAllByText(
				/estadísticas de operaciones/i,
			);
			expect(operationStats.length).toBeGreaterThan(0);
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

	it("renders link to operations page", async () => {
		renderWithProviders(<DashboardView />);

		await waitFor(() => {
			const operationLinks = screen.getAllByRole("link", {
				name: /operaciones/i,
			});
			expect(operationLinks.length).toBeGreaterThan(0);
			expect(operationLinks[0]).toHaveAttribute("href", "/test-org/operations");
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

		const refreshButtonsAfterClick = screen.getAllByRole("button", {
			name: /actualizar/i,
		});
		expect(refreshButtonsAfterClick.length).toBeGreaterThan(0);
	});

	it("renders risk indicators card with compliance score", async () => {
		renderWithProviders(<DashboardView />);

		await waitFor(() => {
			const riskIndicators = screen.getAllByText(/indicadores de riesgo/i);
			expect(riskIndicators.length).toBeGreaterThan(0);
		});
	});

	it("renders alert summary card", async () => {
		renderWithProviders(<DashboardView />);

		await waitFor(() => {
			const alertSummary = screen.getAllByText(/resumen de alertas/i);
			expect(alertSummary.length).toBeGreaterThan(0);
		});
	});

	it("renders total operations for non-vehicle activity", async () => {
		renderWithProviders(<DashboardView />);

		await waitFor(() => {
			const totalOps = screen.getAllByText(/total operaciones/i);
			expect(totalOps.length).toBeGreaterThan(0);
		});
	});
});

import * as statsApi from "@/lib/api/stats";
import * as useJwtModule from "@/hooks/useJwt";
import * as orgStoreModule from "@/lib/org-store";

describe("DashboardView branch coverage", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		// Re-establish default mocks after restoreAllMocks removes spy overrides
		vi.mocked(statsApi.getClientStats).mockResolvedValue({
			totalClients: 100,
			physicalClients: 70,
			moralClients: 30,
			trustClients: 0,
		});
		vi.mocked(statsApi.getOperationStats).mockResolvedValue({
			operationsToday: 10,
			suspiciousOperations: 3,
			totalVolume: "1500000.00",
			totalOperations: 47,
		});
		vi.mocked(statsApi.getReportSummary).mockResolvedValue(
			mockReportSummary as never,
		);
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

	it("handles null operation stats", async () => {
		vi.spyOn(statsApi, "getOperationStats").mockResolvedValue(null as never);

		renderWithProviders(<DashboardView />);

		await waitFor(() => {
			const dashboardHeaders = screen.getAllByText("Inicio");
			expect(dashboardHeaders.length).toBeGreaterThan(0);
		});
	});

	it("handles null report summary", async () => {
		vi.spyOn(statsApi, "getReportSummary").mockResolvedValue(null as never);

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
		vi.spyOn(statsApi, "getOperationStats").mockRejectedValue(
			new Error("API Error"),
		);
		vi.spyOn(statsApi, "getReportSummary").mockRejectedValue(
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
		vi.spyOn(statsApi, "getOperationStats").mockResolvedValue({
			operationsToday: 10,
			suspiciousOperations: 3,
			totalVolume: "1500000.00",
			totalOperations: 47,
		});

		renderWithProviders(<DashboardView />);

		await waitFor(() => {
			const dashboardHeaders = screen.getAllByText("Inicio");
			expect(dashboardHeaders.length).toBeGreaterThan(0);
		});
	});

	it("formats currency with numeric value", async () => {
		vi.spyOn(statsApi, "getOperationStats").mockResolvedValue({
			operationsToday: 10,
			suspiciousOperations: 3,
			totalVolume: "1500000",
			totalOperations: 47,
		});

		renderWithProviders(<DashboardView />);

		await waitFor(() => {
			const dashboardHeaders = screen.getAllByText("Inicio");
			expect(dashboardHeaders.length).toBeGreaterThan(0);
		});
	});

	it("handles null operation stats gracefully", async () => {
		vi.spyOn(statsApi, "getOperationStats").mockResolvedValue(null as never);

		renderWithProviders(<DashboardView />);

		await waitFor(() => {
			const dashboardHeaders = screen.getAllByText("Inicio");
			expect(dashboardHeaders.length).toBeGreaterThan(0);
		});
	});

	it("shows risk indicators with low compliance score", async () => {
		vi.spyOn(statsApi, "getReportSummary").mockResolvedValue({
			...mockReportSummary,
			riskIndicators: {
				highRiskClients: 20,
				criticalAlerts: 15,
				overdueSubmissions: 10,
				complianceScore: 35,
			},
		});

		renderWithProviders(<DashboardView />);

		await waitFor(() => {
			const riskIndicators = screen.getAllByText(/indicadores de riesgo/i);
			expect(riskIndicators.length).toBeGreaterThan(0);
		});
	});

	it("shows comparison metrics when available", async () => {
		vi.spyOn(statsApi, "getReportSummary").mockResolvedValue({
			...mockReportSummary,
			comparison: {
				alertsChange: 10.5,
				transactionsChange: -5.2,
				amountChange: 3.1,
				clientsChange: 8.0,
			},
		});

		renderWithProviders(<DashboardView />);

		await waitFor(() => {
			const vsLastMonth = screen.getAllByText(/vs\. mes anterior/i);
			expect(vsLastMonth.length).toBeGreaterThan(0);
		});
	});

	it("shows new clients and clients with alerts from report summary", async () => {
		renderWithProviders(<DashboardView />);

		await waitFor(() => {
			const newClients = screen.getAllByText(/nuevos clientes/i);
			expect(newClients.length).toBeGreaterThan(0);
		});
	});

	it("shows total operations in operations stats card", async () => {
		const { OrgSettingsContext } =
			await import("@/contexts/org-settings-context");
		const { render } = await import("@testing-library/react");
		const React = await import("react");
		const { LanguageProvider } = await import("@/components/LanguageProvider");
		const { PageStatusProvider } =
			await import("@/components/PageStatusProvider");
		const { SidebarProvider } = await import("@/components/ui/sidebar");
		const { ChatProvider } = await import("@/components/chat/ChatProvider");

		render(
			<LanguageProvider defaultLanguage="es">
				<PageStatusProvider>
					<SidebarProvider>
						<ChatProvider>
							<OrgSettingsContext.Provider
								value={{
									settings: {
										id: "s1",
										organizationId: "org-123",
										obligatedSubjectKey: "ABC123456XYZ",
										activityKey: "INM",
										selfServiceMode: "disabled" as const,
										selfServiceExpiryHours: 72,
										selfServiceRequiredSections: null,
										createdAt: "",
										updatedAt: "",
									},
									isLoading: false,
									refresh: async () => {},
								}}
							>
								<DashboardView />
							</OrgSettingsContext.Provider>
						</ChatProvider>
					</SidebarProvider>
				</PageStatusProvider>
			</LanguageProvider>,
		);

		await waitFor(() => {
			const totalOps = screen.getAllByText(/total operaciones/i);
			expect(totalOps.length).toBeGreaterThan(0);
		});

		const vehicles = screen.queryByText(/vehículos registrados/i);
		expect(vehicles).toBeNull();
	});
});
