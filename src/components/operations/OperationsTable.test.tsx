import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { OperationsTable } from "./OperationsTable";
import { renderWithProviders } from "@/lib/testHelpers";
import type { OperationEntity } from "@/types/operation";

vi.mock("@/hooks/useOrgNavigation", () => ({
	useOrgNavigation: () => ({
		navigateTo: vi.fn(),
		orgPath: (p: string) => `/o${p}`,
	}),
}));

vi.mock("@/hooks/useJwt", () => ({
	useJwt: () => ({ jwt: "jwt-1" }),
}));

const mockOp: OperationEntity = {
	id: "op-1",
	organizationId: "org-1",
	clientId: "c1",
	invoiceId: null,
	activityCode: "VEH",
	operationTypeCode: null,
	operationDate: "2024-01-15T00:00:00.000Z",
	branchPostalCode: "03100",
	amount: "1000",
	currencyCode: "MXN",
	exchangeRate: null,
	amountMxn: null,
	umaValue: null,
	umaDailyValue: null,
	alertTypeCode: "NONE",
	alertDescription: null,
	watchlistStatus: null,
	watchlistCheckedAt: null,
	watchlistResult: null,
	watchlistFlags: null,
	priorityCode: null,
	dataSource: "MANUAL",
	completenessStatus: "COMPLETE",
	missingFields: [],
	referenceNumber: null,
	notes: null,
	createdAt: "2024-01-01",
	updatedAt: "2024-01-01",
	deletedAt: null,
	payments: [],
} as OperationEntity;

vi.mock("@/hooks/useServerTable", () => ({
	useServerTable: () => ({
		data: [mockOp],
		isLoading: false,
		isLoadingMore: false,
		hasMore: false,
		pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
		filterMeta: [],
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

describe("OperationsTable", () => {
	it("renders client id as name when client map empty", () => {
		renderWithProviders(<OperationsTable />);
		expect(screen.getByText("c1")).toBeInTheDocument();
	});
});
