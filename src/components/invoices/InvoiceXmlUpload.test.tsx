import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { InvoiceXmlUpload } from "./InvoiceXmlUpload";
import { renderWithProviders } from "@/lib/testHelpers";

const toastError = vi.fn();
const toastSuccess = vi.fn();
vi.mock("sonner", () => ({
	toast: {
		error: (...args: unknown[]) => toastError(...args),
		success: (...args: unknown[]) => toastSuccess(...args),
	},
}));

vi.mock("@/hooks/useJwt", () => ({
	useJwt: () => ({ jwt: "jwt-1", isLoading: false }),
}));

const mockNavigateTo = vi.fn();
vi.mock("@/hooks/useOrgNavigation", () => ({
	useOrgNavigation: () => ({ navigateTo: mockNavigateTo }),
}));

const parseInvoiceXml = vi.fn();
vi.mock("@/lib/api/invoices", () => ({
	parseInvoiceXml: (...args: unknown[]) => parseInvoiceXml(...args),
}));

describe("InvoiceXmlUpload", () => {
	beforeEach(() => {
		toastError.mockClear();
		toastSuccess.mockClear();
		mockNavigateTo.mockClear();
		parseInvoiceXml.mockReset();
	});

	it("shows toast for non-XML extension", async () => {
		renderWithProviders(<InvoiceXmlUpload />);

		const input = document.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;
		const file = new File(["<root/>"], "bad.pdf", { type: "application/pdf" });
		fireEvent.change(input, { target: { files: [file] } });

		await waitFor(() => expect(toastError).toHaveBeenCalled());
		expect(parseInvoiceXml).not.toHaveBeenCalled();
	});

	it("parses valid XML and navigates to review", async () => {
		parseInvoiceXml.mockResolvedValue({
			invoice: { id: "new-inv" },
		});

		renderWithProviders(<InvoiceXmlUpload />);

		const input = document.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;
		const xml = `<cfdi ${"x".repeat(120)} />`;
		const file = new File([xml], "doc.xml", { type: "application/xml" });
		fireEvent.change(input, { target: { files: [file] } });

		await waitFor(() => expect(parseInvoiceXml).toHaveBeenCalled());
		expect(toastSuccess).toHaveBeenCalled();
		expect(mockNavigateTo).toHaveBeenCalledWith(
			"/invoices/new-inv/create-operation",
		);
	});
});
