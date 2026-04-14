import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { RiskDashboardView } from "./RiskDashboardView";
import { renderWithProviders } from "@/lib/testHelpers";

const getRiskDashboard = vi.fn();
const getOrgRiskAssessment = vi.fn();

vi.mock("@/lib/api/risk", () => ({
	getRiskDashboard: (...a: unknown[]) => getRiskDashboard(...a),
	getOrgRiskAssessment: (...a: unknown[]) => getOrgRiskAssessment(...a),
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
});
