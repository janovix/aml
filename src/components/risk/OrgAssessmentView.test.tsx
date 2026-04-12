import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { OrgAssessmentView } from "./OrgAssessmentView";
import { renderWithProviders } from "@/lib/testHelpers";
import type { OrgRiskAssessment } from "@/lib/api/risk";

const getOrgRiskAssessment = vi.fn();
const getOrgRiskEvolution = vi.fn();
const triggerOrgRiskAssessment = vi.fn();

vi.mock("@/lib/api/risk", () => ({
	getOrgRiskAssessment: (...a: unknown[]) => getOrgRiskAssessment(...a),
	getOrgRiskEvolution: (...a: unknown[]) => getOrgRiskEvolution(...a),
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

vi.mock("sonner", () => ({
	toast: { error: vi.fn(), success: vi.fn() },
}));

function makeOrgAssessment(): OrgRiskAssessment {
	return {
		id: "oa-1",
		organizationId: "org-1",
		version: 1,
		riskLevel: "MEDIUM",
		inherentRiskScore: 10,
		residualRiskScore: 8,
		requiredAuditType: "ORDINARY",
		fpRiskLevel: "LOW",
		periodStartDate: "2024-01-01",
		periodEndDate: "2024-12-31",
		elements: [
			{
				elementType: "CLIENT",
				riskScore: 2,
				riskLevel: "LOW",
				impactScore: 1,
				probabilityScore: 1,
				factorBreakdown: {},
			},
		],
		mitigants: [],
		createdAt: "2024-01-01",
	};
}

describe("OrgAssessmentView", () => {
	beforeEach(() => {
		getOrgRiskAssessment.mockReset();
		getOrgRiskEvolution.mockReset();
	});

	it("renders org assessment when data loads", async () => {
		getOrgRiskAssessment.mockResolvedValue(makeOrgAssessment());
		getOrgRiskEvolution.mockResolvedValue([]);

		renderWithProviders(<OrgAssessmentView />);

		await waitFor(() => {
			expect(
				screen.getByText("Evaluación Organizacional EBR"),
			).toBeInTheDocument();
		});
	});
});
