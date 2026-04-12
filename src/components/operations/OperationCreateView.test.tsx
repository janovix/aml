import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { OperationCreateView } from "./OperationCreateView";
import { renderWithProviders } from "@/lib/testHelpers";

vi.mock("next/navigation", () => ({
	useSearchParams: () => new URLSearchParams(),
}));

const formData = {
	clientId: "",
	operationDate: "2024-06-01",
	branchPostalCode: "",
	amount: "",
	currencyCode: "MXN",
	exchangeRate: "",
	alertTypeCode: "",
	notes: "",
	referenceNumber: "",
	invoiceId: "",
	dataSource: "MANUAL",
	payments: [
		{
			paymentDate: "2024-06-01",
			paymentFormCode: "",
			monetaryInstrumentCode: null,
			currencyCode: "MXN",
			amount: "",
			bankName: null,
			accountNumberMasked: null,
			checkNumber: null,
			reference: null,
		},
	],
	extension: {},
};

vi.mock("@/hooks/useSessionStorageForm", () => ({
	useSessionStorageForm: () => [formData, vi.fn(), vi.fn()],
}));

vi.mock("@/hooks/useOrgSettings", () => ({
	useOrgSettings: () => ({
		activityCode: "VEH",
		isConfigured: true,
		isLoading: false,
	}),
}));

vi.mock("@/hooks/useOrgNavigation", () => ({
	useOrgNavigation: () => ({
		navigateTo: vi.fn(),
		orgPath: (p: string) => `/o${p}`,
	}),
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

vi.mock("@/lib/api/exchange-rates", () => ({
	fetchExchangeRate: vi.fn().mockResolvedValue(null),
}));

describe("OperationCreateView", () => {
	it("renders nueva operación hero when org is configured", async () => {
		renderWithProviders(<OperationCreateView />);

		await waitFor(() => {
			expect(screen.getByText("Nueva Operación")).toBeInTheDocument();
		});
	});
});
