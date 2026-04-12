import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { EvaluationDetailView } from "./EvaluationDetailView";
import { renderWithProviders } from "@/lib/testHelpers";
import type { RiskEvaluationDetail } from "@/lib/api/risk";

vi.mock("next/navigation", () => ({
	useParams: () => ({ id: "ev-1" }),
}));

const getRiskEvaluationDetail = vi.fn();
vi.mock("@/lib/api/risk", () => ({
	getRiskEvaluationDetail: (...a: unknown[]) => getRiskEvaluationDetail(...a),
}));

vi.mock("@/hooks/useJwt", () => ({
	useJwt: () => ({ jwt: "jwt-1" }),
}));

vi.mock("@/hooks/useOrgNavigation", () => ({
	useOrgNavigation: () => ({ orgPath: (p: string) => `/o${p}` }),
}));

function makeDetail(): RiskEvaluationDetail {
	return {
		id: "ev-1",
		clientId: "c1",
		client: {
			id: "c1",
			name: "ACME",
			rfc: "XAXX010101000",
			personType: "physical",
			isPEP: false,
			countryCode: "MX",
			stateCode: null,
		},
		riskLevel: "LOW",
		dueDiligenceLevel: "SIMPLIFIED",
		inherentRiskScore: 1,
		residualRiskScore: 1,
		clientFactors: {
			elementType: "CLIENT",
			factors: [],
			rawScore: 1,
			riskLevel: "LOW",
		},
		geographicFactors: {
			elementType: "GEOGRAPHIC",
			factors: [],
			rawScore: 1,
			riskLevel: "LOW",
		},
		activityFactors: {
			elementType: "PRODUCT_SERVICE",
			factors: [],
			rawScore: 1,
			riskLevel: "LOW",
		},
		transactionFactors: {
			elementType: "TRANSACTION_CHANNEL",
			factors: [],
			rawScore: 1,
			riskLevel: "LOW",
		},
		mitigantFactors: { effect: 0, factors: [] },
		assessedAt: "2024-01-01",
		nextReviewAt: "2025-01-01",
		assessedBy: "u1",
		triggerReason: null,
		methodologyId: null,
		version: 1,
	};
}

describe("EvaluationDetailView", () => {
	beforeEach(() => {
		getRiskEvaluationDetail.mockReset();
	});

	it("renders client name when detail loads", async () => {
		getRiskEvaluationDetail.mockResolvedValue(makeDetail());

		renderWithProviders(<EvaluationDetailView />);

		await waitFor(() => {
			expect(screen.getByText("ACME")).toBeInTheDocument();
		});
	});
});
