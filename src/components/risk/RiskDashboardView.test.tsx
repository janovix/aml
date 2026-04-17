import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { RiskDashboardView } from "./RiskDashboardView";
import { renderWithProviders } from "@/lib/testHelpers";

const getRiskDashboard = vi.fn();
const getOrgRiskAssessment = vi.fn();
const triggerOrgRiskAssessment = vi.fn();

vi.mock("@/lib/api/risk", () => ({
	getRiskDashboard: (...a: unknown[]) => getRiskDashboard(...a),
	getOrgRiskAssessment: (...a: unknown[]) => getOrgRiskAssessment(...a),
	triggerOrgRiskAssessment: (...a: unknown[]) => triggerOrgRiskAssessment(...a),
}));

vi.mock("@/hooks/useJwt", () => ({
	useJwt: () => ({ jwt: "jwt-1", isLoading: false }),
}));

vi.mock("@/lib/org-store", () => ({
	useOrgStore: () => ({
		currentOrg: { id: "org-1", slug: "o", name: "O" },
	}),
}));

vi.mock("@/hooks/useOrgNavigation", () => ({
	useOrgNavigation: () => ({ orgPath: (p: string) => `/o${p}` }),
}));

describe("RiskDashboardView", () => {
	beforeEach(() => {
		getRiskDashboard.mockReset();
		getOrgRiskAssessment.mockReset();
		triggerOrgRiskAssessment.mockReset();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("renders stats after dashboards load", async () => {
		getRiskDashboard.mockResolvedValue({
			organizationId: "org-1",
			distribution: {
				total: 5,
				LOW: 1,
				MEDIUM_LOW: 0,
				MEDIUM: 2,
				MEDIUM_HIGH: 1,
				HIGH: 1,
			},
			dueForReview: 0,
		});
		getOrgRiskAssessment.mockResolvedValue(null);

		renderWithProviders(<RiskDashboardView />);

		await waitFor(() => {
			expect(screen.getByText("5")).toBeInTheDocument();
		});
	});

	it("queues org assessment and refreshes card after poll returns data", async () => {
		const mockOrgAssessment = {
			id: "ora-1",
			organizationId: "org-1",
			version: 1,
			riskLevel: "MEDIUM" as const,
			inherentRiskScore: 4.2,
			residualRiskScore: 3.1,
			requiredAuditType: "INTERNAL",
			fpRiskLevel: "LOW",
			periodStartDate: "2024-01-01T00:00:00.000Z",
			periodEndDate: "2025-01-01T00:00:00.000Z",
			elements: [] as [],
			mitigants: [] as [],
			createdAt: "2025-06-01T12:00:00.000Z",
		};

		let orgCalls = 0;
		getOrgRiskAssessment.mockImplementation(async () => {
			orgCalls += 1;
			if (orgCalls <= 2) return null;
			return mockOrgAssessment;
		});

		getRiskDashboard.mockResolvedValue({
			organizationId: "org-1",
			distribution: {
				total: 5,
				LOW: 1,
				MEDIUM_LOW: 0,
				MEDIUM: 2,
				MEDIUM_HIGH: 1,
				HIGH: 1,
			},
			dueForReview: 0,
		});
		triggerOrgRiskAssessment.mockResolvedValue(undefined);

		renderWithProviders(<RiskDashboardView />);

		await waitFor(() => {
			expect(screen.getByText("5")).toBeInTheDocument();
		});

		vi.useFakeTimers();

		fireEvent.click(
			screen.getByRole("button", { name: /Iniciar evaluación/i }),
		);
		expect(triggerOrgRiskAssessment).toHaveBeenCalledWith({ jwt: "jwt-1" });

		await act(async () => {
			await vi.advanceTimersByTimeAsync(5000);
		});

		expect(screen.getByText("Ver detalle completo")).toBeInTheDocument();
	});
});
