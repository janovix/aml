import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { OperationEditView } from "./OperationEditView";
import { renderWithProviders } from "@/lib/testHelpers";
import type { OperationEntity } from "@/types/operation";

const getOperationById = vi.fn();
vi.mock("@/lib/api/operations", () => ({
	getOperationById: (...a: unknown[]) => getOperationById(...a),
	updateOperation: vi.fn(),
}));

vi.mock("@/hooks/useOrgNavigation", () => ({
	useOrgNavigation: () => ({
		navigateTo: vi.fn(),
		orgPath: (p: string) => `/o${p}`,
	}),
}));

vi.mock("@/lib/api/exchange-rates", () => ({
	fetchExchangeRate: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/components/clients/ClientSelector", () => ({
	ClientSelector: () => <div data-testid="client-selector" />,
}));

vi.mock("@/components/catalogs/CatalogSelector", () => ({
	CatalogSelector: () => <div data-testid="catalog-selector" />,
}));

vi.mock("@/components/operations/OperationPaymentForm", () => ({
	OperationPaymentForm: () => <div data-testid="payment-form" />,
}));

vi.mock("@/components/operations/ThresholdIndicator", () => ({
	ThresholdIndicator: () => null,
}));

vi.mock("@/components/operations/BranchZipCodeDisplay", () => ({
	BranchZipCodeDisplay: () => null,
}));

function makeOperation(): OperationEntity {
	return {
		id: "op-edit-1",
		organizationId: "org-1",
		clientId: "c1",
		invoiceId: null,
		activityCode: "VEH",
		operationTypeCode: null,
		operationDate: "2024-03-10T00:00:00.000Z",
		branchPostalCode: "03100",
		amount: "500",
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
}

describe("OperationEditView", () => {
	beforeEach(() => {
		getOperationById.mockReset();
	});

	it("renders edit title after operation loads", async () => {
		getOperationById.mockResolvedValue(makeOperation());

		renderWithProviders(<OperationEditView operationId="op-edit-1" />);

		await waitFor(() => {
			expect(screen.getByText("Editar Operación")).toBeInTheDocument();
		});
		expect(screen.getByText("op-edit-1")).toBeInTheDocument();
	});
});
