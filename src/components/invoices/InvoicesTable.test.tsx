import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InvoicesTable } from "./InvoicesTable";
import { renderWithProviders } from "@/lib/testHelpers";
import type { InvoiceEntity } from "@/types/invoice";

const mockInvoice: InvoiceEntity = {
	id: "inv-1",
	organizationId: "org-1",
	uuid: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
	version: "4.0",
	series: null,
	folio: null,
	issuerRfc: "AAA010101AAA",
	issuerName: "Emisor SA",
	issuerTaxRegimeCode: "601",
	receiverRfc: "BBB010101BBB",
	receiverName: "Receptor SA",
	receiverUsageCode: null,
	receiverTaxRegimeCode: null,
	receiverPostalCode: null,
	subtotal: "100",
	discount: null,
	total: "116",
	currencyCode: "MXN",
	exchangeRate: null,
	paymentFormCode: null,
	paymentMethodCode: null,
	voucherTypeCode: "I",
	issueDate: "2024-06-15T12:00:00.000Z",
	certificationDate: null,
	exportCode: null,
	tfdUuid: null,
	tfdSatCertificate: null,
	tfdSignature: null,
	tfdStampDate: null,
	xmlContent: null,
	notes: null,
	createdAt: "2024-06-15T12:00:00.000Z",
	updatedAt: "2024-06-15T12:00:00.000Z",
	deletedAt: null,
	items: [],
};

const mockNavigateTo = vi.fn();

vi.mock("@/hooks/useOrgNavigation", () => ({
	useOrgNavigation: () => ({
		navigateTo: mockNavigateTo,
		orgPath: (p: string) => `/test-org${p}`,
	}),
}));

vi.mock("@/hooks/useServerTable", () => ({
	useServerTable: () => ({
		data: [mockInvoice],
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

describe("InvoicesTable", () => {
	beforeEach(() => {
		mockNavigateTo.mockClear();
	});

	it("renders invoice issuer and navigates on view", async () => {
		const user = userEvent.setup();
		renderWithProviders(<InvoicesTable />);

		expect(screen.getByText("Emisor SA")).toBeInTheDocument();
		expect(screen.getByText("Receptor SA")).toBeInTheDocument();

		const viewButtons = screen.getAllByRole("button", { name: "" });
		const eyeBtn = viewButtons.find((b) => b.querySelector("svg.lucide-eye"));
		expect(eyeBtn).toBeTruthy();
		await user.click(eyeBtn!);
		expect(mockNavigateTo).toHaveBeenCalledWith("/invoices/inv-1");
	});
});
