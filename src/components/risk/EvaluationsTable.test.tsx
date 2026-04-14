import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { EvaluationsTable } from "./EvaluationsTable";
import { renderWithProviders } from "@/lib/testHelpers";
import type { RiskEvaluationRow } from "@/lib/api/risk";

vi.mock("@/hooks/useOrgNavigation", () => ({
	useOrgNavigation: () => ({ orgPath: (p: string) => `/o${p}` }),
}));

vi.mock("@/lib/toast-utils", () => ({
	showFetchError: vi.fn(),
}));

const mockRow: RiskEvaluationRow = {
	id: "ev-1",
	clientId: "c1",
	clientName: "Cliente Uno",
	clientRfc: "RFC1",
	clientPersonType: "physical",
	riskLevel: "LOW",
	dueDiligenceLevel: "SIMPLIFIED",
	inherentRiskScore: 1,
	residualRiskScore: 1,
	triggerReason: null,
	assessedAt: "2024-01-01",
	methodologyId: null,
	version: 1,
};

vi.mock("@/hooks/useServerTable", () => ({
	useServerTable: () => ({
		data: [mockRow],
		isLoading: false,
		isLoadingMore: false,
		hasMore: false,
		pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
		filterMeta: [
			{ id: "riskLevel", label: "Nivel", type: "enum" as const, options: [] },
			{
				id: "triggerReason",
				label: "Motivo",
				type: "enum" as const,
				options: [],
			},
		],
		handleLoadMore: vi.fn(),
		urlFilterProps: {
			initialFilters: {},
			onFiltersChange: vi.fn(),
			initialSearch: "",
			onSearchChange: vi.fn(),
			initialSort: undefined,
			onSortChange: vi.fn(),
		},
	}),
}));

describe("EvaluationsTable", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders client name from row data", () => {
		renderWithProviders(<EvaluationsTable />);
		expect(screen.getByText("Cliente Uno")).toBeInTheDocument();
	});
});
