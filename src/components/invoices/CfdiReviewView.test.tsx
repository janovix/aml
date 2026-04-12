import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { CfdiReviewView } from "./CfdiReviewView";
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

vi.mock("@/hooks/useOrgSettings", () => ({
	useOrgSettings: () => ({
		activityCode: "VEH",
		isLoading: false,
	}),
}));

vi.mock("@/lib/toast-utils", () => ({
	showFetchError: vi.fn(),
}));

describe("CfdiReviewView", () => {
	beforeEach(() => {
		getInvoiceById.mockReset();
	});

	it("renders CFDI data card after load", async () => {
		const inv = makeTestInvoice();
		getInvoiceById.mockResolvedValue(inv);

		renderWithProviders(<CfdiReviewView invoiceId={inv.id} />);

		await waitFor(() => {
			expect(screen.getByText("Datos del CFDI")).toBeInTheDocument();
		});
	});
});
