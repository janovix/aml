import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { OperationDetailsView } from "./OperationDetailsView";
import { renderWithProviders } from "@/lib/testHelpers";
import type { OperationEntity } from "@/types/operation";
import type { Client } from "@/types/client";

const getOperationById = vi.fn();
const getClientById = vi.fn();
const deleteOperation = vi.fn();

vi.mock("@/lib/api/operations", () => ({
	getOperationById: (...a: unknown[]) => getOperationById(...a),
	deleteOperation: (...a: unknown[]) => deleteOperation(...a),
}));

vi.mock("@/lib/api/clients", () => ({
	getClientById: (...a: unknown[]) => getClientById(...a),
}));

const navigateTo = vi.fn();
vi.mock("@/hooks/useOrgNavigation", () => ({
	useOrgNavigation: () => ({
		navigateTo,
		orgPath: (p: string) => `/o${p}`,
	}),
}));

vi.mock("@/components/operations/ThresholdIndicator", () => ({
	ThresholdIndicator: () => null,
}));

function makeOperation(): OperationEntity {
	return {
		id: "op-detail-1",
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

function makeClient(): Client {
	return {
		id: "c1",
		personType: "physical",
		firstName: "Ada",
		lastName: "Lovelace",
		secondLastName: null,
		businessName: null,
		rfc: "LOVA800101",
		email: "ada@example.com",
		phone: "5550000000",
		country: "MX",
		stateCode: "CMX",
		city: "Ciudad de México",
		municipality: "Cuauhtémoc",
		neighborhood: "Centro",
		street: "Reforma",
		externalNumber: "1",
		postalCode: "06000",
		createdAt: "",
		updatedAt: "",
	} as unknown as Client;
}

describe("OperationDetailsView", () => {
	beforeEach(() => {
		getOperationById.mockReset();
		getClientById.mockReset();
		deleteOperation.mockReset();
		navigateTo.mockReset();
	});

	it("renders detail subtitle and client after load", async () => {
		getOperationById.mockResolvedValue(makeOperation());
		getClientById.mockResolvedValue(makeClient());

		renderWithProviders(<OperationDetailsView operationId="op-detail-1" />);

		await waitFor(() => {
			expect(screen.getByText("Detalle de operación")).toBeInTheDocument();
		});
		expect(screen.getByText("op-detail-1")).toBeInTheDocument();
	});
});
