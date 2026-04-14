import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { InvoiceDetailsView } from "./InvoiceDetailsView";
import { renderWithProviders } from "@/lib/testHelpers";
import { makeTestInvoice } from "./invoice-test-fixtures";

const getInvoiceById = vi.fn();
vi.mock("@/lib/api/invoices", () => ({
	getInvoiceById: (...args: unknown[]) => getInvoiceById(...args),
}));

vi.mock("@/hooks/useJwt", () => ({
	useJwt: () => ({ jwt: "jwt-1", isLoading: false }),
}));

vi.mock("@/hooks/useOrgNavigation", () => ({
	useOrgNavigation: () => ({ navigateTo: vi.fn() }),
}));

vi.mock("@/lib/toast-utils", () => ({
	showFetchError: vi.fn(),
}));

describe("InvoiceDetailsView", () => {
	beforeEach(() => {
		getInvoiceById.mockReset();
	});

	it("renders issuer after fetch", async () => {
		const inv = makeTestInvoice();
		getInvoiceById.mockResolvedValue(inv);

		renderWithProviders(<InvoiceDetailsView invoiceId={inv.id} />);

		await waitFor(() => {
			expect(screen.getByText("Emisor Test SA")).toBeInTheDocument();
		});
		expect(screen.getByText("Detalle de factura CFDI")).toBeInTheDocument();
	});
});
